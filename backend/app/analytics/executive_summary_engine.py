import pandas as pd
import json
from typing import Dict, Any, List
from app.ai.engine import AIEngine

class ExecutiveSummaryEngine:
    @staticmethod
    def run_analysis(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculates executive KPIs and uses AIEngine (or rule-based fallback)
        to generate detailed insights, recommendations, opportunities, risks, and strategies.
        """
        if df.empty:
            return {
                "kpis": {
                    "total_customers": 0,
                    "total_revenue": 0.0,
                    "total_orders": 0,
                    "aov": 0.0,
                    "profit_margin": 0.0,
                    "retention_rate": 0.0
                },
                "insights": [],
                "recommendations": [],
                "risks": [],
                "opportunities": [],
                "revenue_suggestions": [],
                "retention_suggestions": []
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

        non_returned = df[df["order_status"] != "Returned"]
        
        total_revenue = float(non_returned["sales_amount"].sum())
        total_profit = float(non_returned["profit"].sum())
        total_orders = int(df["order_id"].nunique())
        total_customers = int(df["customer_id"].nunique())
        
        aov = total_revenue / total_orders if total_orders > 0 else 0.0
        profit_margin = total_profit / total_revenue if total_revenue > 0 else 0.0
        
        order_counts = df.groupby("customer_id")["order_id"].nunique()
        repeat_buyers = int((order_counts > 1).sum())
        retention_rate = repeat_buyers / total_customers if total_customers > 0 else 0.0

        kpis = {
            "total_customers": total_customers,
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "aov": aov,
            "profit_margin": profit_margin,
            "retention_rate": retention_rate
        }

        top_regions = non_returned.groupby("region")["sales_amount"].sum().sort_values(ascending=False).head(3).to_dict()
        top_products = non_returned.groupby("product_name")["sales_amount"].sum().sort_values(ascending=False).head(3).to_dict()

        context_summary = f"""
        Revenue: ${total_revenue:,.2f}
        Profit: ${total_profit:,.2f} (Margin: {profit_margin*100:.1f}%)
        Orders: {total_orders:,}
        Customers: {total_customers:,} (Retention: {retention_rate*100:.1f}%)
        AOV: ${aov:,.2f}
        Top Regions: {', '.join([f'{k} (${v:,.2f})' for k, v in top_regions.items()])}
        Top Products: {', '.join([f'{k} (${v:,.2f})' for k, v in top_products.items()])}
        """

        client = AIEngine.get_client()
        ai_response = None
        
        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system", 
                            "content": (
                                "You are an elite enterprise CFO and business intelligence strategist. "
                                "Analyze the provided KPIs and metrics. You must return a clean, valid JSON object "
                                "containing exactly the following keys, with exactly 5 items for insights and recommendations, "
                                "and 3 items for risks, opportunities, revenue, and retention suggestions: "
                                "{'insights': ['...'], 'recommendations': ['...'], 'risks': ['...'], 'opportunities': ['...'], "
                                "'revenue_suggestions': ['...'], 'retention_suggestions': ['...']}. "
                                "Do not include any markdown styling or conversational text."
                            )
                        },
                        {"role": "user", "content": f"Context: {context_summary}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                ai_response = json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"OpenAI Executive Summary generation failed: {e}. Running fallback.")

        if not ai_response:
            insights = [
                f"Gross revenue reaches ${total_revenue:,.2f} with an average order value of ${aov:,.2f}.",
                f"Net operating margin stands at {profit_margin*100:.1f}%. High profit levels indicate strong market product fit.",
                f"Customer pool has a repeat purchase rate of {retention_rate*100:.1f}%. High single-purchase volumes indicate a retention leak.",
                f"Region '{list(top_regions.keys())[0] if top_regions else 'N/A'}' is the leading driver of sales volume.",
                f"Product '{list(top_products.keys())[0] if top_products else 'N/A'}' leads the catalog in contribution."
            ]
            recommendations = [
                "Establish a customer loyalty program with tier incentives to increase repeat purchases.",
                "Review marketing spending in lower-performing regions to reallocate budget to top regions.",
                "Promote cross-selling bundles involving your top product categories.",
                "Offer free shipping thresholds slightly above current AOV to raise average invoice sizes.",
                "Launch reactivation email flows targeting customers inactive for 45+ days."
            ]
            risks = [
                "Low repeat purchase rate indicates risk of customer churn and rising acquisition costs.",
                "High concentration of sales in top categories/regions exposes the catalog to local logistics bottlenecks.",
                "Operating margins could erode if discount rates exceed 15% on low-margin goods."
            ]
            opportunities = [
                "Expand marketing campaigns in high-margin categories.",
                "Convert corporate wholesale accounts into subscription-based contracts.",
                "Relocate inventory hubs closer to top revenue regions to minimize shipping overheads."
            ]
            revenue_suggestions = [
                "Implement smart price increases on top-selling items.",
                "Create value-add accessory bundles to increase unit numbers per order.",
                "Charge premium shipping options for expedited deliveries."
            ]
            retention_suggestions = [
                "Offer a $10 credit to single-purchase customers valid for their next 30 days.",
                "Collect post-purchase survey feedback from churned cohorts to address catalog gaps.",
                "Provide early access programs to VIP customers with high lifetime value."
            ]
            ai_response = {
                "insights": insights,
                "recommendations": recommendations,
                "risks": risks,
                "opportunities": opportunities,
                "revenue_suggestions": revenue_suggestions,
                "retention_suggestions": retention_suggestions
            }

        return {
            "kpis": kpis,
            "insights": ai_response.get("insights", []),
            "recommendations": ai_response.get("recommendations", []),
            "risks": ai_response.get("risks", []),
            "opportunities": ai_response.get("opportunities", []),
            "revenue_suggestions": ai_response.get("revenue_suggestions", []),
            "retention_suggestions": ai_response.get("retention_suggestions", [])
        }
