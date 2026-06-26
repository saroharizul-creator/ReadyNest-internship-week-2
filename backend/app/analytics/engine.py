import pandas as pd
import numpy as np
from typing import Dict, Any, List

class AnalyticsEngine:
    @staticmethod
    def calculate_bi_metrics(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculates all eCommerce metrics from a clean pandas DataFrame.
        Expected columns: customer_id, customer_name, region, product_category,
        product_name, order_id, order_date, quantity, sales_amount, profit,
        discount, customer_type, order_status
        """
        if df.empty:
            return {
                "kpis": {}, "monthly_trends": {}, "regions": {}, "categories": {},
                "customers": [], "products": [], "rfm": []
            }

        df = df.copy()
        # Ensure all expected columns are present with fallback defaults
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

        df["sales_amount"] = pd.to_numeric(df["sales_amount"], errors='coerce').fillna(0.0)
        df["profit"] = pd.to_numeric(df["profit"], errors='coerce').fillna(0.0)
        df["quantity"] = pd.to_numeric(df["quantity"], errors='coerce').fillna(0).astype(int)
        df["discount"] = pd.to_numeric(df["discount"], errors='coerce').fillna(0.0)
        df["order_date"] = pd.to_datetime(df["order_date"], errors='coerce')

        non_returned = df[df["order_status"] != "Returned"]
        total_sales = float(non_returned["sales_amount"].sum())
        total_profit = float(non_returned["profit"].sum())

        orders_count = int(df["order_id"].nunique())
        customers_count = int(df["customer_id"].nunique())
        aov = total_sales / orders_count if orders_count > 0 else 0.0
        margin = total_profit / total_sales if total_sales > 0 else 0.0

        # Vectorized Customer aggregations
        agg_df = df.groupby("customer_id").agg(
            name=("customer_name", "first"),
            type=("customer_type", "first"),
            region=("region", "first"),
            orderCount=("order_id", "nunique"),
            firstOrderDate=("order_date", "min"),
            lastOrderDate=("order_date", "max")
        )

        agg_non_returned = non_returned.groupby("customer_id").agg(
            totalSpend=("sales_amount", "sum"),
            totalProfit=("profit", "sum")
        )

        customer_metrics = agg_df.join(agg_non_returned, how="left").fillna({"totalSpend": 0.0, "totalProfit": 0.0})

        repeat_buyers = int((customer_metrics["orderCount"] > 1).sum())
        single_buyers = int((customer_metrics["orderCount"] == 1).sum())

        if not customer_metrics.empty:
            idx_max = customer_metrics["totalSpend"].idxmax()
            max_clv = float(customer_metrics.loc[idx_max, "totalSpend"])
            top_clv_name = str(customer_metrics.loc[idx_max, "name"])
        else:
            max_clv = 0.0
            top_clv_name = "-"

        first_dates = customer_metrics["firstOrderDate"].dt.strftime("%Y-%m-%d").fillna("").astype(str)
        last_dates = customer_metrics["lastOrderDate"].dt.strftime("%Y-%m-%d").fillna("").astype(str)

        if not customer_metrics.empty:
            global_max_date = df["order_date"].max()
            customer_metrics["recency"] = (global_max_date - customer_metrics["lastOrderDate"]).dt.days
            customer_metrics["recency"] = customer_metrics["recency"].clip(lower=0).fillna(999).astype(int)
        else:
            customer_metrics["recency"] = pd.Series(dtype=int)

        first_dates = customer_metrics["firstOrderDate"].dt.strftime("%Y-%m-%d").fillna("").astype(str)
        last_dates = customer_metrics["lastOrderDate"].dt.strftime("%Y-%m-%d").fillna("").astype(str)

        customer_metrics["id"] = customer_metrics.index.astype(str)
        customer_metrics["firstOrderDate"] = first_dates
        customer_metrics["lastOrderDate"] = last_dates

        customer_metrics["name"] = customer_metrics["name"].fillna("").astype(str)
        customer_metrics["type"] = customer_metrics["type"].fillna("").astype(str)
        customer_metrics["region"] = customer_metrics["region"].fillna("").astype(str)
        customer_metrics["orderCount"] = customer_metrics["orderCount"].astype(int)
        customer_metrics["totalSpend"] = customer_metrics["totalSpend"].astype(float)
        customer_metrics["totalProfit"] = customer_metrics["totalProfit"].astype(float)

        customer_profiles = customer_metrics[[
            "id", "name", "type", "region", "orderCount", "totalSpend", "totalProfit", "lastOrderDate", "firstOrderDate"
        ]].to_dict(orient="records")

        retention = repeat_buyers / customers_count if customers_count > 0 else 0.0

        kpis = {
            "sales": total_sales,
            "profit": total_profit,
            "orders": orders_count,
            "customers": customers_count,
            "aov": aov,
            "margin": margin,
            "retention": retention,
            "repeatBuyers": repeat_buyers,
            "singleBuyers": single_buyers,
            "topCLVName": top_clv_name
        }

        monthly_trends = []
        df["month"] = df["order_date"].dt.strftime("%Y-%m")
        non_returned_monthly = df[df["order_status"] != "Returned"]
        if not non_returned_monthly.empty:
            non_returned_monthly = non_returned_monthly.copy()
            non_returned_monthly["month"] = non_returned_monthly["order_date"].dt.strftime("%Y-%m")
            monthly_group = non_returned_monthly.groupby("month").agg(
                sales=("sales_amount", "sum"),
                profit=("profit", "sum")
            ).reset_index()
            monthly_group["month"] = monthly_group["month"].astype(str)
            monthly_group["sales"] = monthly_group["sales"].astype(float)
            monthly_group["profit"] = monthly_group["profit"].astype(float)
            monthly_trends = monthly_group[["month", "sales", "profit"]].to_dict(orient="records")
        monthly_trends = sorted(monthly_trends, key=lambda x: x["month"])

        regions = []
        if not non_returned.empty:
            region_group = non_returned.groupby("region")["sales_amount"].sum().reset_index()
            region_group.rename(columns={"sales_amount": "sales"}, inplace=True)
            region_group["region"] = region_group["region"].astype(str)
            region_group["sales"] = region_group["sales"].astype(float)
            regions = region_group[["region", "sales"]].to_dict(orient="records")

        categories = []
        if not non_returned.empty:
            cat_group = non_returned.groupby("product_category")["sales_amount"].sum().reset_index()
            cat_group.rename(columns={"product_category": "category", "sales_amount": "sales"}, inplace=True)
            cat_group["category"] = cat_group["category"].astype(str)
            cat_group["sales"] = cat_group["sales"].astype(float)
            categories = cat_group[["category", "sales"]].to_dict(orient="records")

        # Vectorized product calculations
        prod_agg = df.groupby("product_name").agg(
            category=("product_category", "first"),
            quantity=("quantity", "sum"),
            sales=("sales_amount", "sum"),
            profit=("profit", "sum"),
            discountSum=("discount", "sum"),
            count=("order_id", "size")
        ).reset_index()
        prod_agg.rename(columns={"product_name": "name"}, inplace=True)
        prod_agg["name"] = prod_agg["name"].astype(str)
        prod_agg["category"] = prod_agg["category"].astype(str)
        prod_agg["quantity"] = prod_agg["quantity"].astype(int)
        prod_agg["sales"] = prod_agg["sales"].astype(float)
        prod_agg["profit"] = prod_agg["profit"].astype(float)
        prod_agg["discountSum"] = prod_agg["discountSum"].astype(float)
        prod_agg["count"] = prod_agg["count"].astype(int)
        products_list = prod_agg[["name", "category", "quantity", "sales", "profit", "discountSum", "count"]].to_dict(orient="records")

        rfm_list = []
        if customer_profiles:
            n = len(customer_metrics)
            recency_rank = customer_metrics["recency"].rank(method="first") - 1
            frequency_rank = (-customer_metrics["orderCount"]).rank(method="first") - 1
            monetary_rank = (-customer_metrics["totalSpend"]).rank(method="first") - 1

            def get_rank_score_vector(rank_series):
                t1 = n // 3
                t2 = (2 * n) // 3
                return np.where(rank_series < t1, 3, np.where(rank_series < t2, 2, 1))

            if n >= 3:
                r_score = get_rank_score_vector(recency_rank)
                f_score = get_rank_score_vector(frequency_rank)
                m_score = get_rank_score_vector(monetary_rank)
            else:
                r_score = np.where(customer_metrics["recency"] < 30, 3, np.where(customer_metrics["recency"] < 60, 2, 1))
                f_score = np.where(customer_metrics["orderCount"] > 3, 3, np.where(customer_metrics["orderCount"] > 1, 2, 1))
                m_score = np.where(customer_metrics["totalSpend"] > 500, 3, np.where(customer_metrics["totalSpend"] > 150, 2, 1))

            score_sum = r_score + f_score + m_score
            segment = np.where(score_sum >= 8, "High Value", np.where(score_sum >= 4, "Medium Value", "Low Value"))

            rfm_df = pd.DataFrame({
                "customerId": customer_metrics["id"],
                "name": customer_metrics["name"],
                "recency": customer_metrics["recency"],
                "frequency": customer_metrics["orderCount"],
                "monetary": customer_metrics["totalSpend"],
                "rScore": r_score,
                "fScore": f_score,
                "mScore": m_score,
                "scoreSum": score_sum,
                "segment": segment
            })
            
            rfm_df["customerId"] = rfm_df["customerId"].astype(str)
            rfm_df["name"] = rfm_df["name"].astype(str)
            rfm_df["recency"] = rfm_df["recency"].astype(int)
            rfm_df["frequency"] = rfm_df["frequency"].astype(int)
            rfm_df["monetary"] = rfm_df["monetary"].astype(float)
            rfm_df["rScore"] = rfm_df["rScore"].astype(int)
            rfm_df["fScore"] = rfm_df["fScore"].astype(int)
            rfm_df["mScore"] = rfm_df["mScore"].astype(int)
            rfm_df["scoreSum"] = rfm_df["scoreSum"].astype(int)
            rfm_df["segment"] = rfm_df["segment"].astype(str)
            
            rfm_list = rfm_df.to_dict(orient="records")

        return {
            "kpis": kpis,
            "monthly_trends": monthly_trends,
            "regions": regions,
            "categories": categories,
            "customers": customer_profiles,
            "products": products_list,
            "rfm": rfm_list
        }
