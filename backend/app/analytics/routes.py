from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
import pandas as pd
import os

from app.database.connection import get_db
from app.database.models import Project, Transaction, Dataset, User
from app.auth.routes import get_current_user
from app.analytics.engine import AnalyticsEngine
from app.analytics.eda_engine import EdaEngine
from app.analytics.product_engine import ProductEngine
from app.analytics.customer_engine import CustomerEngine
from app.analytics.regional_engine import RegionalEngine
from app.analytics.executive_summary_engine import ExecutiveSummaryEngine
from app.ml.engine import MLEngine
import threading
import time

class AnalyticsCache:
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()

    def get(self, project_id: int, endpoint: str, filters: Any) -> Any:
        key = (project_id, endpoint, self._serialize_filters(filters))
        with self._lock:
            return self._cache.get(key)

    def set(self, project_id: int, endpoint: str, filters: Any, value: Any) -> None:
        key = (project_id, endpoint, self._serialize_filters(filters))
        with self._lock:
            self._cache[key] = value

    def invalidate(self, project_id: int) -> None:
        with self._lock:
            keys_to_remove = [k for k in self._cache.keys() if k[0] == project_id]
            for k in keys_to_remove:
                del self._cache[k]

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def _serialize_filters(self, filters: Any) -> tuple:
        if not filters:
            return ()
        regions = tuple(sorted(filters.regions)) if filters.regions else None
        types = tuple(sorted(filters.types)) if filters.types else None
        categories = tuple(sorted(filters.categories)) if filters.categories else None
        segments = tuple(sorted(filters.segments)) if filters.segments else None
        return (filters.startDate, filters.endDate, regions, types, categories, segments)

class DataFrameCache:
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()

    def get_df(self, project_id: int, db: Session) -> pd.DataFrame:
        with self._lock:
            cached = self._cache.get(project_id)
            if cached is not None:
                df, timestamp = cached
                if time.time() - timestamp < 300: # 5 minutes cache expiry
                    return df.copy()
            
            df = self._load_from_db_or_file(project_id, db)
            self._cache[project_id] = (df, time.time())
            return df.copy()

    def invalidate(self, project_id: int) -> None:
        with self._lock:
            if project_id in self._cache:
                del self._cache[project_id]

    def _standardize_df(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        # Fill missing columns with defaults
        defaults = {
            "customer_id": "", "customer_name": "Unknown", "region": "Default",
            "product_category": "Other", "product_name": "Other", "order_id": "",
            "order_date": pd.NaT, "quantity": 0, "sales_amount": 0.0,
            "profit": 0.0, "discount": 0.0, "customer_type": "Retail",
            "order_status": "Completed"
        }
        for col, default_val in defaults.items():
            if col not in df.columns:
                df[col] = default_val

        # Standardize column data types once at load time
        df["sales_amount"] = pd.to_numeric(df["sales_amount"], errors='coerce').fillna(0.0)
        df["profit"] = pd.to_numeric(df["profit"], errors='coerce').fillna(0.0)
        df["quantity"] = pd.to_numeric(df["quantity"], errors='coerce').fillna(0).astype(int)
        df["discount"] = pd.to_numeric(df["discount"], errors='coerce').fillna(0.0)
        df["order_date"] = pd.to_datetime(df["order_date"], errors='coerce')
        return df

    def _load_from_db_or_file(self, project_id: int, db: Session) -> pd.DataFrame:
        from sqlalchemy import text
        sql = """
            SELECT customer_id, customer_name, region, product_category, product_name, 
                   order_id, order_date, quantity, sales_amount, profit, discount, 
                   customer_type, order_status 
            FROM transactions 
            WHERE project_id = :project_id
        """
        df = pd.read_sql_query(text(sql), con=db.bind, params={"project_id": project_id})
        if not df.empty:
            return self._standardize_df(df)
            
        # Fallback to Dataset cleaned CSV file
        dataset = db.query(Dataset).filter(Dataset.project_id == project_id).order_by(Dataset.created_at.desc()).first()
        if dataset and os.path.exists(dataset.file_path):
            df = pd.read_csv(dataset.file_path)
            df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
            return self._standardize_df(df)
            
        return pd.DataFrame()

analytics_cache = AnalyticsCache()
df_cache = DataFrameCache()

router = APIRouter(prefix="/projects", tags=["Analytics Dashboard"])

def load_project_df(project_id: int, db: Session) -> pd.DataFrame:
    return df_cache.get_df(project_id, db)



class FilterSchema(BaseModel):
    regions: Optional[List[str]] = None
    types: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    segments: Optional[List[str]] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None


def apply_filters(df: pd.DataFrame, filters: FilterSchema) -> pd.DataFrame:
    if df.empty:
        return df
        
    # Shallow copy to avoid in-memory reference mutation side-effects between concurrent requests
    df = df.copy()
    
    # 1. Filter by date range
    if filters.startDate:
        start_dt = pd.to_datetime(filters.startDate, errors='coerce')
        if pd.notna(start_dt):
            df = df[df["order_date"] >= start_dt]
    if filters.endDate:
        end_dt = pd.to_datetime(filters.endDate, errors='coerce')
        if pd.notna(end_dt):
            df = df[df["order_date"] <= end_dt]
            
    # 2. Filter by region
    if filters.regions:
        df = df[df["region"].isin(filters.regions)]
        
    # 3. Filter by customer type
    if filters.types:
        df = df[df["customer_type"].isin(filters.types)]
        
    # 4. Filter by product category
    if filters.categories:
        df = df[df["product_category"].isin(filters.categories)]

    # 5. Filter by RFM segment
    if filters.segments:
        # Calculate RFM segments
        metrics = AnalyticsEngine.calculate_bi_metrics(df)
        rfm_list = metrics.get("rfm", [])
        customer_segments = {r["customerId"]: r["segment"] for r in rfm_list}
        df = df[df["customer_id"].map(customer_segments).isin(filters.segments)]
        
    return df


@router.get("/{project_id}/filter-options")
def get_project_filter_options(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
        
    # Query distinct values from transactions
    regions = db.query(Transaction.region).filter(Transaction.project_id == project_id).distinct().all()
    types = db.query(Transaction.customer_type).filter(Transaction.project_id == project_id).distinct().all()
    categories = db.query(Transaction.product_category).filter(Transaction.project_id == project_id).distinct().all()
    
    from sqlalchemy import func
    # Aggregate min and max order dates at the database level rather than fetching all rows
    min_max_date = db.query(
        func.min(Transaction.order_date),
        func.max(Transaction.order_date)
    ).filter(Transaction.project_id == project_id).first()
    
    min_date = min_max_date[0] if min_max_date and min_max_date[0] else ""
    max_date = min_max_date[1] if min_max_date and min_max_date[1] else ""

    return {
        "regions": sorted([r[0] for r in regions if r[0]]),
        "types": sorted([t[0] for t in types if t[0]]),
        "categories": sorted([c[0] for c in categories if c[0]]),
        "minDate": min_date,
        "maxDate": max_date
    }


@router.post("/{project_id}/analytics")
def get_project_analytics(
    project_id: int,
    filters: FilterSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    cached_val = analytics_cache.get(project_id, "analytics", filters)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    if df.empty:
        res = {
            "filtered_transactions": [],
            "kpis": {
                "sales": 0, "profit": 0, "orders": 0, "customers": 0, "aov": 0,
                "margin": 0, "retention": 0, "repeatBuyers": 0, "singleBuyers": 0, "topCLVName": "-"
            },
            "monthly_trends": [], "regions": [], "categories": [], "customers": [], "products": [], "rfm": []
        }
        analytics_cache.set(project_id, "analytics", filters, res)
        return res

    df_filtered = apply_filters(df, filters)
    results = AnalyticsEngine.calculate_bi_metrics(df_filtered)
    
    mapping = {
        "customer_id": "Customer ID",
        "customer_name": "Customer Name",
        "region": "Region",
        "product_category": "Product Category",
        "product_name": "Product Name",
        "order_id": "Order ID",
        "order_date": "Order Date",
        "quantity": "Quantity",
        "sales_amount": "Sales Amount",
        "profit": "Profit",
        "discount": "Discount",
        "customer_type": "Customer Type",
        "order_status": "Order Status"
    }
    filtered_df_renamed = df_filtered.rename(columns={k: v for k, v in mapping.items() if k in df_filtered.columns})
    filtered_transactions = filtered_df_renamed.to_dict(orient="records")
    
    for tx in filtered_transactions:
        if "Order Date" in tx and pd.notna(tx["Order Date"]):
            tx["Order Date"] = str(tx["Order Date"].strftime("%Y-%m-%d") if isinstance(tx["Order Date"], pd.Timestamp) else tx["Order Date"])

    results["filtered_transactions"] = filtered_transactions
    analytics_cache.set(project_id, "analytics", filters, results)
    return results


@router.post("/{project_id}/eda")
def get_eda_metrics(
    project_id: int,
    filters: FilterSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    cached_val = analytics_cache.get(project_id, "eda", filters)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    df_filtered = apply_filters(df, filters)
    results = EdaEngine.run_profiling(df_filtered)
    analytics_cache.set(project_id, "eda", filters, results)
    return results


@router.post("/{project_id}/products-analytics")
def get_products_analytics(
    project_id: int,
    filters: FilterSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    cached_val = analytics_cache.get(project_id, "products", filters)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    df_filtered = apply_filters(df, filters)
    results = ProductEngine.run_analysis(df_filtered)
    analytics_cache.set(project_id, "products", filters, results)
    return results


@router.post("/{project_id}/customers-analytics")
def get_customers_analytics(
    project_id: int,
    filters: FilterSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    cached_val = analytics_cache.get(project_id, "customers", filters)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    df_filtered = apply_filters(df, filters)
    results = CustomerEngine.run_analysis(df_filtered)
    analytics_cache.set(project_id, "customers", filters, results)
    return results


@router.post("/{project_id}/regional-analytics")
def get_regional_analytics(
    project_id: int,
    filters: FilterSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    cached_val = analytics_cache.get(project_id, "regional", filters)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    df_filtered = apply_filters(df, filters)
    results = RegionalEngine.run_analysis(df_filtered)
    analytics_cache.set(project_id, "regional", filters, results)
    return results


@router.post("/{project_id}/executive-summary")
def get_executive_summary(
    project_id: int,
    filters: FilterSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    cached_val = analytics_cache.get(project_id, "executive_summary", filters)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    df_filtered = apply_filters(df, filters)
    results = ExecutiveSummaryEngine.run_analysis(df_filtered)
    analytics_cache.set(project_id, "executive_summary", filters, results)
    return results


@router.post("/{project_id}/business-questions")
def get_business_questions(
    project_id: int,
    filters: FilterSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    cached_val = analytics_cache.get(project_id, "business_questions", filters)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    df_filtered = apply_filters(df, filters)
    
    # Calculate child metrics for dynamic answers
    bi_metrics = AnalyticsEngine.calculate_bi_metrics(df_filtered)
    prod_metrics = ProductEngine.run_analysis(df_filtered)
    reg_metrics = RegionalEngine.run_analysis(df_filtered)
    
    # Retrieve top customers
    top_custs = sorted(bi_metrics.get("customers", []), key=lambda x: x["totalSpend"], reverse=True)[:3]
    top_custs_str = ", ".join([f"{c['name']} (${c['totalSpend']:,.2f})" for c in top_custs]) if top_custs else "None detected"

    # Best & Worst Products
    best_prods = prod_metrics.get("top_selling", [])[:3]
    best_prods_str = ", ".join([f"{p['product_name']} (${p['revenue']:,.2f})" for p in best_prods]) if best_prods else "None"
    
    worst_prods = prod_metrics.get("least_selling", [])[:3]
    worst_prods_str = ", ".join([f"{p['product_name']} (${p['revenue']:,.2f})" for p in worst_prods]) if worst_prods else "None"

    # Region Revenue
    top_reg = reg_metrics.get("top_region", {})
    top_reg_str = f"{top_reg.get('region', 'N/A')} (${top_reg.get('revenue', 0.0):,.2f})" if top_reg else "N/A"

    # Segment
    rfm_list = bi_metrics.get("rfm", [])
    segment_revs = {}
    for r in rfm_list:
        segment_revs[r["segment"]] = segment_revs.get(r["segment"], 0.0) + r["monetary"]
    valuable_seg = max(segment_revs.items(), key=lambda x: x[1])[0] if segment_revs else "N/A"

    # Cross sell
    recommendations = MLEngine.generate_product_recommendations(df_filtered)
    cross_sell_str = ", ".join([f"{r['product']} with {r['recommended']} ({r['confidence']*100:.0f}% match)" for r in recommendations[:3]]) if recommendations else "Bundle standard accessories with primary electronic purchases."

    results = {
        "top_customers": f"Our top-spending customers are: {top_custs_str}.",
        "best_products": f"The top performing products by total revenue are: {best_prods_str}.",
        "worst_products": f"The lowest performing products by revenue are: {worst_prods_str}.",
        "top_regions": f"The region generating the highest net sales is: {top_reg_str}.",
        "valuable_segment": f"The customer segment contributing the highest cumulative spend is the: '{valuable_seg}' segment.",
        "improve_retention": "To boost customer retention, launch automated reactivation emails for buyers reaching 45+ days of inactivity and offer custom discount triggers.",
        "increase_sales": "To increase gross sales, upsell with bundle offers on the product page and increase pricing thresholds for free shipping promotions.",
        "cross_sell": f"Recommended items to cross-sell: {cross_sell_str}."
    }
    analytics_cache.set(project_id, "business_questions", filters, results)
    return results
