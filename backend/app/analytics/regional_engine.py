import pandas as pd
import numpy as np
from typing import Dict, Any, List

class RegionalEngine:
    @staticmethod
    def run_analysis(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs detailed regional performance analysis.
        """
        if df.empty or "region" not in df.columns:
            return {}

        df["sales_amount"] = pd.to_numeric(df["sales_amount"], errors='coerce').fillna(0.0)
        df["profit"] = pd.to_numeric(df["profit"], errors='coerce').fillna(0.0)
        df["quantity"] = pd.to_numeric(df["quantity"], errors='coerce').fillna(0).astype(int)

        non_returned = df[df["order_status"] != "Returned"]

        region_group = non_returned.groupby("region").agg(
            revenue=("sales_amount", "sum"),
            profit=("profit", "sum"),
            orders=("order_id", "nunique"),
            quantity_sold=("quantity", "sum")
        ).reset_index()

        if region_group.empty:
            return {}

        region_group["margin"] = region_group["profit"] / region_group["revenue"] * 100
        region_group["margin"] = region_group["margin"].fillna(0.0)
        
        sorted_rev = region_group.sort_values(by="revenue", ascending=False)
        top_region = sorted_rev.iloc[0].to_dict()
        lowest_region = sorted_rev.iloc[-1].to_dict()

        growth_trends = []
        if "order_date" in df.columns:
            df["month"] = pd.to_datetime(df["order_date"], errors="coerce").dt.strftime("%Y-%m")
            non_returned_with_month = df[(df["order_status"] != "Returned") & df["month"].notna()]
            
            if not non_returned_with_month.empty:
                trend_grouped = non_returned_with_month.groupby(["month", "region"])["sales_amount"].sum().unstack().fillna(0.0).reset_index()
                growth_trends = trend_grouped.to_dict(orient="records")

        insights = []
        insights.append(f"Top revenue region is '{top_region['region']}' generating ${top_region['revenue']:,.2f} over {top_region['orders']:,} orders.")
        insights.append(f"Lowest revenue region is '{lowest_region['region']}' contributing ${lowest_region['revenue']:,.2f}.")
        
        sorted_margin = region_group.sort_values(by="margin", ascending=False)
        top_margin = sorted_margin.iloc[0]
        insights.append(f"Region '{top_margin['region']}' operates at the highest efficiency with a {top_margin['margin']:.1f}% profit margin.")

        return {
            "region_summary": region_group.to_dict(orient="records"),
            "top_region": top_region,
            "lowest_region": lowest_region,
            "growth_trends": growth_trends,
            "insights": insights
        }
