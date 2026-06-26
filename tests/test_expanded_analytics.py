import unittest
import pandas as pd
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")

from app.analytics.eda_engine import EdaEngine
from app.analytics.product_engine import ProductEngine
from app.analytics.customer_engine import CustomerEngine
from app.analytics.regional_engine import RegionalEngine
from app.analytics.executive_summary_engine import ExecutiveSummaryEngine

class TestExpandedAnalytics(unittest.TestCase):
    def setUp(self):
        data = {
            "customer_id": ["CUST-01", "CUST-01", "CUST-02", "CUST-03"],
            "customer_name": ["Alice", "Alice", "Bob", "Charlie"],
            "region": ["East", "East", "West", "East"],
            "product_category": ["Electronics", "Furniture", "Electronics", "Apparel"],
            "product_name": ["Smartphone", "Desk", "Smartphone", "Jacket"],
            "order_id": ["ORD-101", "ORD-102", "ORD-103", "ORD-104"],
            "order_date": ["2026-01-01", "2026-01-10", "2026-01-05", "2026-01-15"],
            "quantity": [1, 2, 1, 1],
            "sales_amount": [500.0, 300.0, 500.0, 100.0],
            "profit": [200.0, 50.0, 200.0, -10.0],
            "discount": [0.0, 0.1, 0.0, 0.2],
            "customer_type": ["Retail", "Retail", "Corporate", "Retail"],
            "order_status": ["Completed", "Completed", "Completed", "Returned"]
        }
        self.df = pd.DataFrame(data)

    def test_eda_engine(self):
        result = EdaEngine.run_profiling(self.df)
        overview = result["overview"]
        self.assertEqual(overview["row_count"], 4)
        self.assertEqual(overview["column_count"], 13)
        self.assertEqual(overview["duplicate_count"], 0)
        self.assertIn("sales_amount", result["stats_summary"])
        self.assertIn("region", result["category_frequencies"])

    def test_product_engine(self):
        # Returned item (Jacket, ORD-104, sales 100) must be excluded from revenue calculations
        # Non-returned sales sum = 500 (Smartphone) + 300 (Desk) + 500 (Smartphone) = 1300.0
        result = ProductEngine.run_analysis(self.df)
        top_selling = result["top_selling"]
        
        smartphone_rev = next(p["revenue"] for p in top_selling if p["product_name"] == "Smartphone")
        self.assertEqual(smartphone_rev, 1000.0) # ORD-101 + ORD-103
        
        desk_rev = next(p["revenue"] for p in top_selling if p["product_name"] == "Desk")
        self.assertEqual(desk_rev, 300.0) # ORD-102
        
        # Contribution of Smartphone = 1000 / 1300 = ~76.9%
        smartphone_contrib = next(p["contribution_pct"] for p in top_selling if p["product_name"] == "Smartphone")
        self.assertAlmostEqual(smartphone_contrib, 76.92, places=1)

    def test_customer_engine(self):
        result = CustomerEngine.run_analysis(self.df)
        kpis = result["kpis"]
        self.assertEqual(kpis["total_customers"], 3)
        self.assertEqual(kpis["new_customers"], 3) # All 3 customers are new in this window
        self.assertEqual(kpis["returning_customers"], 1) # CUST-01 has 2 orders
        self.assertAlmostEqual(kpis["repeat_purchase_rate"], 33.33, places=1)

    def test_regional_engine(self):
        # Excludes returned order ORD-104 (East, sales 100)
        # Non-returned sales by region: East (ORD-101 (500) + ORD-102 (300) = 800), West (ORD-103 (500))
        result = RegionalEngine.run_analysis(self.df)
        summary = result["region_summary"]
        
        east_rev = next(r["revenue"] for r in summary if r["region"] == "East")
        self.assertEqual(east_rev, 800.0)
        
        west_rev = next(r["revenue"] for r in summary if r["region"] == "West")
        self.assertEqual(west_rev, 500.0)

    def test_executive_summary_engine(self):
        result = ExecutiveSummaryEngine.run_analysis(self.df)
        kpis = result["kpis"]
        self.assertEqual(kpis["total_revenue"], 1300.0)
        self.assertEqual(kpis["total_orders"], 4)
        self.assertEqual(kpis["total_customers"], 3)
        self.assertIn("insights", result)
        self.assertIn("recommendations", result)

if __name__ == "__main__":
    unittest.main()
