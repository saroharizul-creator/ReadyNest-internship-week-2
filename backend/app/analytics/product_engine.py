import pandas as pd
import numpy as np
from typing import Dict, Any, List

class ProductEngine:
    @staticmethod
    def run_analysis(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs product performance analysis on transactional DataFrame.
        """
        if df.empty or "product_name" not in df.columns:
            return {}

        df["sales_amount"] = pd.to_numeric(df["sales_amount"], errors='coerce').fillna(0.0)
        df["profit"] = pd.to_numeric(df["profit"], errors='coerce').fillna(0.0)
        df["quantity"] = pd.to_numeric(df["quantity"], errors='coerce').fillna(0).astype(int)

        non_returned = df[df["order_status"] != "Returned"]
        total_sales = float(non_returned["sales_amount"].sum())

        prod_group = non_returned.groupby("product_name").agg(
            revenue=("sales_amount", "sum"),
            quantity_sold=("quantity", "sum"),
            profit_generated=("profit", "sum"),
            category=("product_category", "first")
        ).reset_index()

        if prod_group.empty:
            return {}

        prod_group["contribution_pct"] = prod_group["revenue"] / total_sales * 100 if total_sales > 0 else 0.0
        
        top_selling = prod_group.sort_values(by="revenue", ascending=False).head(10).to_dict(orient="records")
        least_selling = prod_group.sort_values(by="revenue", ascending=True).head(10).to_dict(orient="records")

        cat_group = non_returned.groupby("product_category").agg(
            revenue=("sales_amount", "sum"),
            quantity_sold=("quantity", "sum"),
            profit_generated=("profit", "sum"),
            product_count=("product_name", "nunique")
        ).reset_index()
        
        cat_group["contribution_pct"] = cat_group["revenue"] / total_sales * 100 if total_sales > 0 else 0.0
        category_analysis = cat_group.to_dict(orient="records")

        product_trends = []
        if "order_date" in df.columns:
            df["month"] = pd.to_datetime(df["order_date"], errors="coerce").dt.strftime("%Y-%m")
            non_returned_with_month = df[(df["order_status"] != "Returned") & df["month"].notna()]
            
            top_5_names = prod_group.sort_values(by="revenue", ascending=False).head(5)["product_name"].tolist()
            
            if top_5_names and not non_returned_with_month.empty:
                trend_grouped = non_returned_with_month[non_returned_with_month["product_name"].isin(top_5_names)].groupby(["month", "product_name"])["sales_amount"].sum().unstack().fillna(0.0).reset_index()
                product_trends = trend_grouped.to_dict(orient="records")

        best_performing = []
        underperforming = []
        recommendations = []

        if len(prod_group) > 0:
            top_prod = prod_group.sort_values(by="revenue", ascending=False).iloc[0]
            best_performing.append(f"Top revenue generator is '{top_prod['product_name']}' which generated ${top_prod['revenue']:,.2f} ({top_prod['contribution_pct']:.1f}% contribution).")
            
            top_qty = prod_group.sort_values(by="quantity_sold", ascending=False).iloc[0]
            if top_qty["product_name"] != top_prod["product_name"]:
                best_performing.append(f"'{top_qty['product_name']}' is the most popular product in units sold, moving {top_qty['quantity_sold']:,} units.")

            low_profit = prod_group.sort_values(by="profit_generated", ascending=True).iloc[0]
            if low_profit["profit_generated"] < 0:
                underperforming.append(f"'{low_profit['product_name']}' is operating at a net loss, generating ${low_profit['profit_generated']:,.2f} in net profit.")
            else:
                underperforming.append(f"'{low_profit['product_name']}' is the lowest-performing product, contributing just ${low_profit['revenue']:,.2f} in gross sales.")

            recommendations.append(f"Bundle low-selling products with high-volume products like '{top_qty['product_name']}' to clear excess warehouse stock.")
            recommendations.append(f"Increase pricing margins or review supplier contracts for product '{low_profit['product_name']}' to resolve negative margin issues.")
            
            if category_analysis:
                top_cat = cat_group.sort_values(by="revenue", ascending=False).iloc[0]
                recommendations.append(f"Allocate 25% more advertising budget to Category '{top_cat['product_category']}' since it represents {top_cat['contribution_pct']:.1f}% of total enterprise revenue.")

        return {
            "top_selling": top_selling,
            "least_selling": least_selling,
            "category_analysis": category_analysis,
            "product_trends": product_trends,
            "insights": {
                "best_performing": best_performing,
                "underperforming": underperforming,
                "recommendations": recommendations
            }
        }
