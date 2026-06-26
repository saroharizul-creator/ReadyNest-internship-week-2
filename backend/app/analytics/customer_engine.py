import pandas as pd
import numpy as np
from typing import Dict, Any, List

class CustomerEngine:
    @staticmethod
    def run_analysis(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs cohort, growth, and retention metrics on customer data.
        """
        if df.empty or "customer_id" not in df.columns or "order_date" not in df.columns:
            return {}

        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
        df = df.dropna(subset=["order_date"])

        if df.empty:
            return {}

        total_customers = int(df["customer_id"].nunique())
        
        first_orders = df.groupby("customer_id")["order_date"].min().reset_index()
        first_orders.columns = ["customer_id", "first_order_date"]
        
        merged_df = pd.merge(df, first_orders, on="customer_id")
        
        merged_df["transaction_type"] = np.where(
            merged_df["order_date"] == merged_df["first_order_date"], 
            "New", 
            "Returning"
        )

        order_counts = df.groupby("customer_id")["order_id"].nunique()
        repeat_buyers_count = int((order_counts > 1).sum())
        single_buyers_count = total_customers - repeat_buyers_count
        repeat_purchase_rate = (repeat_buyers_count / total_customers * 100) if total_customers > 0 else 0.0

        merged_df["first_order_month"] = merged_df["first_order_date"].dt.strftime("%Y-%m")
        merged_df["order_month"] = merged_df["order_date"].dt.strftime("%Y-%m")
        
        acquisition = first_orders.copy()
        acquisition["month"] = acquisition["first_order_date"].dt.strftime("%Y-%m")
        acq_timeline = acquisition.groupby("month")["customer_id"].nunique().reset_index()
        acq_timeline.columns = ["month", "new_customers"]
        acq_timeline = acq_timeline.sort_values(by="month").to_dict(orient="records")

        all_months = sorted(merged_df["order_month"].unique())
        
        first_orders["month"] = first_orders["first_order_date"].dt.strftime("%Y-%m")
        new_cust_series = first_orders.groupby("month")["customer_id"].nunique()
        active_cust_series = merged_df.groupby("order_month")["customer_id"].nunique()

        months_df = pd.DataFrame({"month": all_months})
        months_df = months_df.merge(active_cust_series.rename("active_customers"), left_on="month", right_index=True, how="left").fillna(0)
        months_df = months_df.merge(new_cust_series.rename("new_customers"), left_on="month", right_index=True, how="left").fillna(0)
        months_df["new_customers"] = months_df["new_customers"].astype(int)
        months_df["active_customers"] = months_df["active_customers"].astype(int)
        months_df["cumulative_customers"] = months_df["new_customers"].cumsum().astype(int)
        growth_trends = months_df.to_dict(orient="records")

        growth_rate = 0.0
        if len(growth_trends) > 1:
            prev = growth_trends[-2]["cumulative_customers"]
            curr = growth_trends[-1]["cumulative_customers"]
            growth_rate = ((curr - prev) / prev * 100) if prev > 0 else 0.0

        new_vs_returning = {
            "new": int(first_orders["customer_id"].nunique()),
            "returning": int(repeat_buyers_count)
        }

        returning_df = merged_df[merged_df["transaction_type"] == "Returning"]
        active_repeat_series = returning_df.groupby("order_month")["customer_id"].nunique()
        
        ret_df = pd.DataFrame({"month": all_months})
        ret_df = ret_df.merge(active_repeat_series.rename("active_repeat"), left_on="month", right_index=True, how="left").fillna(0)
        ret_df["active_repeat"] = ret_df["active_repeat"].astype(int)
        ret_df["retention_rate"] = (ret_df["active_repeat"] / total_customers * 100) if total_customers > 0 else 0.0
        ret_df["retention_rate"] = ret_df["retention_rate"].astype(float)
        retention_trend = ret_df.to_dict(orient="records")

        cohort_matrix = []
        try:
            merged_df["cohort_index"] = (merged_df["order_date"].dt.year - merged_df["first_order_date"].dt.year) * 12 + \
                                        (merged_df["order_date"].dt.month - merged_df["first_order_date"].dt.month)
            
            cohort_group = merged_df.groupby(["first_order_month", "cohort_index"])["customer_id"].nunique().reset_index()
            
            cohort_pivot = cohort_group.pivot(index="first_order_month", columns="cohort_index", values="customer_id").fillna(0)
            
            cohort_sizes = cohort_pivot[0] if 0 in cohort_pivot.columns else pd.Series(dtype=float)
            
            if not cohort_sizes.empty:
                cohort_retention = cohort_pivot.divide(cohort_sizes, axis=0) * 100
                
                for c_month in cohort_pivot.index:
                    size = int(cohort_sizes.loc[c_month])
                    rates = []
                    max_idx = int(cohort_pivot.columns.max()) if not cohort_pivot.columns.empty else 0
                    for idx in range(12):
                        if idx in cohort_retention.columns:
                            rates.append(round(float(cohort_retention.loc[c_month, idx]), 1))
                        else:
                            rates.append(0.0)
                    cohort_matrix.append({
                        "cohort": c_month,
                        "size": size,
                        "rates": rates
                    })
        except Exception as e:
            print(f"Cohort Matrix calculation failed: {e}")

        acquisition_analysis = []
        retention_analysis = []
        growth_recommendations = []

        acquisition_analysis.append(f"Total Customer acquisition pool is {total_customers:,} unique buyers.")
        if acq_timeline:
            max_acq = max(acq_timeline, key=lambda x: x["new_customers"])
            acquisition_analysis.append(f"Peak acquisition month occurred in {max_acq['month']} with {max_acq['new_customers']} new customers onboarded.")

        retention_analysis.append(f"Platform Customer Repeat Purchase Rate is {repeat_purchase_rate:.1f}%.")
        retention_analysis.append(f"Out of the total buyer pool, {repeat_buyers_count} are repeat shoppers, while {single_buyers_count} shopped only once.")

        if repeat_purchase_rate < 30.0:
            growth_recommendations.append("First-purchase churn is elevated. Launch a triggered 2nd-purchase coupon campaign to convert single-purchase users.")
        else:
            growth_recommendations.append("Repeat customer cohort is healthy. Upsell VIP members with early access product catalogs.")

        growth_recommendations.append("Establish a reactivation email flows for customers reaching 45+ days of inactivity.")

        return {
            "kpis": {
                "total_customers": total_customers,
                "new_customers": int(first_orders["customer_id"].nunique()),
                "returning_customers": repeat_buyers_count,
                "growth_rate": round(growth_rate, 2),
                "retention_rate": round(repeat_purchase_rate, 2),
                "repeat_purchase_rate": round(repeat_purchase_rate, 2)
            },
            "growth_trend": growth_trends,
            "new_vs_returning": new_vs_returning,
            "acquisition_timeline": acq_timeline,
            "retention_trend": retention_trend,
            "cohort_matrix": cohort_matrix,
            "insights": {
                "acquisition_analysis": acquisition_analysis,
                "retention_analysis": retention_analysis,
                "growth_recommendations": growth_recommendations
            }
        }
