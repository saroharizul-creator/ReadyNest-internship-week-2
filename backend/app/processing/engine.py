import pandas as pd
import numpy as np
import os
import json
from io import StringIO
from typing import Tuple, Dict, Any

class DataProcessingEngine:
    REQUIRED_COLUMNS = [
        "customer_id", "customer_name", "region", "product_category", "product_name",
        "order_id", "order_date", "quantity", "sales_amount", "profit", "discount",
        "customer_type", "order_status"
    ]

    COLUMN_MAP_TEMPLATES = {
        "customer_id": ["customer id", "customer_id", "cust_id", "cust id", "customerid", "customer_key", "customer key"],
        "customer_name": ["customer name", "customer_name", "cust_name", "cust name", "customername", "name", "client"],
        "region": ["region", "region_name", "territory", "location", "zone", "state", "country"],
        "product_category": ["product category", "product_category", "category", "prod_cat", "category_name"],
        "product_name": ["product name", "product_name", "prod_name", "product", "item_name", "item"],
        "order_id": ["order id", "order_id", "invoice_id", "invoice", "receipt", "orderid"],
        "order_date": ["order date", "order_date", "date", "orderdate", "invoice_date"],
        "quantity": ["quantity", "qty", "units", "quantity_ordered", "amount_sold"],
        "sales_amount": ["sales amount", "sales_amount", "sales", "revenue", "amount", "total_sales", "turnover", "total amount", "total_amount", "totalamount"],
        "profit": ["profit", "net_profit", "earnings", "margin_profit", "margin"],
        "discount": ["discount", "discount_amount", "disc", "discount_rate"],
        "customer_type": ["customer type", "customer_type", "segment", "client_type", "buyer_type"],
        "order_status": ["order status", "order_status", "status", "delivery_status", "state_status"]
    }

    @classmethod
    def auto_map_columns(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """
        Attempts to map columns of the input DataFrame to standard required columns
        based on template lists, renaming matching columns.
        """
        renamed_df = df.copy()
        column_mapping = {}
        
        # Helper to normalize strings for comparison (lowercase, strip, remove spaces, underscores, and dashes)
        def normalize(s: str) -> str:
            return s.strip().lower().replace(" ", "").replace("_", "").replace("-", "")

        normalized_cols = {normalize(col): col for col in df.columns}

        for target_col, variations in cls.COLUMN_MAP_TEMPLATES.items():
            for var in variations:
                norm_var = normalize(var)
                if norm_var in normalized_cols:
                    original_col = normalized_cols[norm_var]
                    renamed_df = renamed_df.rename(columns={original_col: target_col})
                    column_mapping[original_col] = target_col
                    break
        
        return renamed_df, column_mapping

    @classmethod
    def validate_dataset(cls, df: pd.DataFrame) -> Tuple[float, Dict[str, Any]]:
        """
        Runs the validation engine and returns a quality score (0-100)
        and a detailed JSON-compatible validation report.
        """
        total_rows = len(df)
        if total_rows == 0:
            return 0.0, {"error": "Dataset is empty."}

        report = {
            "total_rows": total_rows,
            "total_columns": len(df.columns),
            "missing_values": {},
            "duplicate_rows": 0,
            "invalid_types": {},
            "outliers_count": 0,
            "mapped_columns": []
        }

        # 1. Missing Values check
        missing_counts = df.isnull().sum()
        total_missing = 0
        for col, count in missing_counts.items():
            if count > 0:
                report["missing_values"][col] = int(count)
                total_missing += count

        # 2. Duplicate rows check
        duplicates = int(df.duplicated().sum())
        report["duplicate_rows"] = duplicates

        # 3. Mapped required columns check
        mapped_count = 0
        for req in cls.REQUIRED_COLUMNS:
            if req in df.columns:
                report["mapped_columns"].append(req)
                mapped_count += 1

        # 4. Outliers check (using Interquartile Range on numeric columns)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        outliers_total = 0
        for col in numeric_cols:
            q25 = df[col].quantile(0.25)
            q75 = df[col].quantile(0.75)
            iqr = q75 - q25
            cut_off = iqr * 1.5
            lower, upper = q25 - cut_off, q75 + cut_off
            outliers = df[(df[col] < lower) | (df[col] > upper)]
            outliers_count = len(outliers)
            if outliers_count > 0:
                outliers_total += outliers_count
        report["outliers_count"] = outliers_total

        # 5. Quality Score Calculation Logic
        # Penalty values:
        # - Missing values: penalty of 0.1% per missing cell relative to total cells
        # - Duplicates: penalty of 1% per duplicate row relative to total rows
        # - Outliers: penalty of 0.2% per outlier relative to total rows
        # - Unmapped columns: penalty of 3% per missing required analysis column
        total_cells = total_rows * len(df.columns)
        missing_penalty = (total_missing / total_cells) * 100 if total_cells > 0 else 0
        duplicate_penalty = (duplicates / total_rows) * 100 if total_rows > 0 else 0
        outlier_penalty = (outliers_total / total_rows) * 50 if total_rows > 0 else 0
        missing_schema_penalty = (len(cls.REQUIRED_COLUMNS) - mapped_count) * 3

        quality_score = max(5.0, 100.0 - (missing_penalty + duplicate_penalty + outlier_penalty + missing_schema_penalty))
        
        return round(float(quality_score), 2), report

    @classmethod
    def clean_dataset(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Runs the cleaning pipeline (fills missing values, standardizes dates, removes duplicates)
        and returns the cleaned DataFrame and a cleaning log.
        """
        cleaned_df = df.copy()
        log = {
            "duplicates_removed": 0,
            "missing_values_filled": {},
            "dates_standardized": 0,
            "invalid_rows_removed": 0
        }

        # 1. Remove duplicates
        initial_rows = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates()
        log["duplicates_removed"] = initial_rows - len(cleaned_df)

        # 2. Handle missing values
        # Numeric: fill with median. Categorical: fill with "Unknown" or mode
        for col in cleaned_df.columns:
            null_count = int(cleaned_df[col].isnull().sum())
            if null_count > 0:
                log["missing_values_filled"][col] = null_count
                if cleaned_df[col].dtype in [np.float64, np.int64]:
                    median_val = cleaned_df[col].median()
                    cleaned_df[col] = cleaned_df[col].fillna(median_val if pd.notna(median_val) else 0.0)
                else:
                    cleaned_df[col] = cleaned_df[col].fillna("Unknown")

        # 3. Standardize dates
        # Search for date-like columns, particularly 'order_date'
        if "order_date" in cleaned_df.columns:
            initial_nulls = cleaned_df["order_date"].isnull().sum()
            cleaned_df["order_date"] = pd.to_datetime(cleaned_df["order_date"], errors="coerce")
            
            # Format to clean string YYYY-MM-DD
            # Fill NaT (invalid dates) with current date or drop
            invalid_dates = cleaned_df["order_date"].isnull().sum() - initial_nulls
            cleaned_df["order_date"] = cleaned_df["order_date"].fillna(pd.Timestamp.now())
            cleaned_df["order_date"] = cleaned_df["order_date"].dt.strftime("%Y-%m-%d")
            log["dates_standardized"] = int(len(cleaned_df))
            log["invalid_rows_removed"] = int(invalid_dates)

        return cleaned_df, log
