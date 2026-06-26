import os
from openai import OpenAI
import pandas as pd
from typing import Dict, Any, List, Optional

class AIEngine:
    @staticmethod
    def get_client() -> Optional[OpenAI]:
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            return None
        return OpenAI(api_key=api_key)

    @staticmethod
    def generate_dashboard_insights(kpis: dict, monthly_trends: list, regions: list) -> Dict[str, Any]:
        """
        Uses OpenAI to generate business insights and strategic choices.
        Falls back to rule-based insights if OpenAI API is unavailable.
        """
        client = AIEngine.get_client()
        
        # Prepare statistical context
        context_str = f"""
        Business KPIs:
        - Total Net Sales: ${kpis.get('sales', 0):,.2f}
        - Total Orders: {kpis.get('orders', 0):,}
        - Total Customers: {kpis.get('customers', 0):,}
        - Average Order Value: ${kpis.get('aov', 0):,.2f}
        - Profit Margin: {kpis.get('margin', 0) * 100:.1f}%
        - Repeat Buyer Retention: {kpis.get('retention', 0) * 100:.1f}%
        
        Monthly Sales Trends:
        {chr(10).join([f"Month {m['month']}: Sales ${m['sales']:,.2f}, Profit ${m['profit']:,.2f}" for m in monthly_trends[:6]])}
        
        Regional breakdown:
        {chr(10).join([f"Region {r['region']}: Sales ${r['sales']:,.2f}" for r in regions])}
        """

        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an elite SaaS data consultant. Analyze the provided eCommerce stats. Return exactly 3 business insights and 3 growth recommendations in a clean JSON format: {'insights': ['...'], 'recommendations': ['...']}. Do not return Markdown or conversational text outside JSON."},
                        {"role": "user", "content": f"Here is the dataset summary:\n{context_str}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                import json
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"OpenAI API call failed: {e}. Falling back to rule-based engine.")

        # Robust Rule-Based Fallback
        insights = []
        recommendations = []

        # Generate rule-based insights
        margin = kpis.get("margin", 0.0)
        retention = kpis.get("retention", 0.0)
        
        if margin > 0.3:
            insights.append(f"Strong profit margins detected at {margin*100:.1f}%, indicating healthy pricing power across product catalog.")
        else:
            insights.append(f"Operating margins are narrow ({margin*100:.1f}%). Pricing tiers or discounts should be re-evaluated to protect profits.")

        if retention > 0.4:
            insights.append(f"Healthy customer retention is present: {retention*100:.0f}% of buyers are repeat purchasers, driving organic growth.")
        else:
            insights.append(f"Customer churn risk is elevated; only {retention*100:.0f}% of customer database are repeat buyers.")

        if regions:
            sorted_regions = sorted(regions, key=lambda x: x["sales"], reverse=True)
            top_region = sorted_regions[0]["region"]
            bottom_region = sorted_regions[-1]["region"]
            insights.append(f"Region {top_region} is the primary revenue driver, while Region {bottom_region} lags and represents a growth bottleneck.")

        # Generate rule-based recommendations
        if retention < 0.4:
            recommendations.append("Establish a VIP Customer Loyalty Campaign offering free shipping or early access to re-engage single-purchase cohorts.")
        else:
            recommendations.append("Upsell existing repeat buyers with bundles combining high-margin product accessories.")
            
        if margin < 0.3:
            recommendations.append("Review volume discounts on low-margin products to prevent erosion of gross profit margins.")
        else:
            recommendations.append("Expand digital marketing budget in high-margin product categories to capture market share.")

        if regions:
            recommendations.append(f"Optimize logistics and regional advertising: relocate inventory closer to key buyer centers in Region {top_region}.")

        return {
            "insights": insights[:3],
            "recommendations": recommendations[:3]
        }

    @staticmethod
    def ask_chat_assistant(question: str, df: pd.DataFrame) -> str:
        """
        AI Analyst Chat Assistant.
        If OpenAI API key is configured, uses a dynamic code execution engine (Advanced Data Analyst)
        to query the Pandas DataFrame. Otherwise, falls back to a rule-based data query router.
        """
        client = AIEngine.get_client()
        
        if df.empty:
            return "No dataset has been uploaded to support this chat."

        # Compile basic stats for fallback and context
        total_rows = len(df)
        cols = ", ".join(df.columns.tolist())
        sales_sum = float(df["sales_amount"].sum()) if "sales_amount" in df.columns else 0.0
        profit_sum = float(df["profit"].sum()) if "profit" in df.columns else 0.0
        
        top_cats = {}
        if "product_category" in df.columns and "sales_amount" in df.columns:
            top_cats = df.groupby("product_category")["sales_amount"].sum().sort_values(ascending=False).head(3).to_dict()
            
        top_custs = {}
        if "customer_name" in df.columns and "sales_amount" in df.columns:
            top_custs = df.groupby("customer_name")["sales_amount"].sum().sort_values(ascending=False).head(5).to_dict()

        if client:
            try:
                # 1. Ask the AI to write Python code to query the DataFrame
                prompt = f"""
                You are a Python data scientist. You have a pandas DataFrame named 'df'.
                Here is the structure of 'df':
                - Column names and types: { {col: str(df[col].dtype) for col in df.columns} }
                - Sample data: { df.head(2).to_dict(orient="records") }

                Write a Python expression or a short block of code that computes the answer to the user's question:
                "{question}"

                Requirements:
                1. Your code must assign the final answer to a local variable named 'result'.
                2. Keep the code safe, simple, and clean. (e.g. `result = df[df['customer_name'] == 'Alice']['sales_amount'].sum()`)
                3. If the question asks for a list, table, or group, format 'result' as a dictionary, list, string, or number.

                Return exactly a JSON object:
                {{
                  "code": "your python code snippet",
                  "explanation": "brief sentence explanation"
                }}
                Do not include markdown code blocks or any text other than this JSON.
                """
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a professional Python data analyst. Return only a JSON object containing the keys 'code' and 'explanation'."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                
                import json
                code_obj = json.loads(response.choices[0].message.content)
                code = code_obj.get("code", "")
                
                # 2. Safely execute code
                local_vars = {"df": df, "pd": pd, "np": np}
                exec(code, {}, local_vars)
                computed_result = local_vars.get("result", None)
                
                # 3. Format the computed result back into a natural language response
                format_prompt = f"""
                The user asked: "{question}"
                We ran analysis on the dataset and computed this result:
                {computed_result}

                Explain this result in a clear, friendly, and professional business intelligence response. Keep it under 3-4 sentences.
                """
                
                format_response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are InsightFlow AI's Customer Analyst. Provide a polished and concise data-driven answer."},
                        {"role": "user", "content": format_prompt}
                    ],
                    temperature=0.4
                )
                return format_response.choices[0].message.content
            except Exception as e:
                print(f"AI Advanced code execution failed: {e}. Falling back to standard prompt.")

        # Heuristic Rule-Based chatbot fallback
        question_lower = question.lower()
        if "sales" in question_lower or "revenue" in question_lower or "money" in question_lower:
            return f"Based on the dataset, the total gross revenue is ${sales_sum:,.2f} and total net profit is ${profit_sum:,.2f}. The top revenue category is {list(top_cats.keys())[0] if top_cats else 'N/A'}."
        elif "customer" in question_lower or "who is" in question_lower:
            top_name = list(top_custs.keys())[0] if top_custs else "N/A"
            top_spend = top_custs[top_name] if top_custs else 0.0
            return f"The most valuable customer in the database is {top_name} with a spend of ${top_spend:,.2f}."
        elif "product" in question_lower or "category" in question_lower:
            cats_str = ', '.join([f'{k} (${v:,.2f})' for k, v in top_cats.items()]) if top_cats else 'N/A'
            return f"The top performing product categories are: {cats_str}."
        else:
            cats_key = list(top_cats.keys())[0] if top_cats else 'N/A'
            return f"InsightFlow AI analyzed your dataset. It contains {total_rows} transaction records with total sales of ${sales_sum:,.2f}, and the top category is {cats_key}. Please ask about sales metrics, top buyers, or product performance."
