import unittest
import pandas as pd
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")

from app.analytics.engine import AnalyticsEngine

class TestAnalyticsEngine(unittest.TestCase):
    def setUp(self):
        # Create a mock eCommerce transactions DataFrame
        data = {
            "customer_id": ["CUST-01", "CUST-01", "CUST-02", "CUST-03"],
            "customer_name": ["Alice", "Alice", "Bob", "Charlie"],
            "region": ["East", "East", "West", "South"],
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

    def test_calculate_bi_metrics_kpis(self):
        results = AnalyticsEngine.calculate_bi_metrics(self.df)
        kpis = results["kpis"]
        
        # Returned item (Charlie, ORD-104, sales 100) must be excluded from Sales & Profit
        # Total Sales = 500 + 300 + 500 = 1300
        # Total Profit = 200 + 50 + 200 = 450
        self.assertEqual(kpis["sales"], 1300.0)
        self.assertEqual(kpis["profit"], 450.0)
        self.assertEqual(kpis["orders"], 4) # Count of unique order IDs includes returned
        self.assertEqual(kpis["customers"], 3) # Count of unique customer IDs includes returned
        self.assertEqual(kpis["margin"], 450.0 / 1300.0)

    def test_calculate_bi_metrics_regions(self):
        results = AnalyticsEngine.calculate_bi_metrics(self.df)
        regions = results["regions"]
        
        # Regions must exclude 'Returned' order ORD-104 (South, 100)
        # Expected: East (800.0), West (500.0)
        east_sales = next(r["sales"] for r in regions if r["region"] == "East")
        self.assertEqual(east_sales, 800.0)
        
        west_sales = next(r["sales"] for r in regions if r["region"] == "West")
        self.assertEqual(west_sales, 500.0)
        
        # South region has only returned transaction, so should not be in non-returned sales
        south_sales = [r["sales"] for r in regions if r["region"] == "South"]
        self.assertEqual(len(south_sales), 0)

    def test_calculate_bi_metrics_rfm(self):
        results = AnalyticsEngine.calculate_bi_metrics(self.df)
        rfm = results["rfm"]
        
        # CUST-01 has 2 orders, CUST-02 has 1 order, CUST-03 (Charlie) has only 1 returned order (0 spend)
        cust_01_rfm = next(r for r in rfm if r["customerId"] == "CUST-01")
        self.assertEqual(cust_01_rfm["frequency"], 2)
        self.assertEqual(cust_01_rfm["monetary"], 800.0)
        
        cust_03_rfm = next(r for r in rfm if r["customerId"] == "CUST-03")
        self.assertEqual(cust_03_rfm["monetary"], 0.0)

if __name__ == "__main__":
    unittest.main()
