import pandas as pd
import numpy as np
from typing import Dict, Any, List

class EdaEngine:
    @staticmethod
    def run_profiling(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs comprehensive dataset profiling and returns stats and chart vectors.
        """
        if df.empty:
            return {}

        total_rows = len(df)
        total_cols = len(df.columns)
        memory_usage_bytes = int(df.memory_usage(index=True, deep=True).sum())
        
        col_types = {}
        numeric_cols = []
        categorical_cols = []
        date_cols = []
        
        for col in df.columns:
            dtype_str = str(df[col].dtype)
            if "int" in dtype_str or "float" in dtype_str:
                col_types[col] = "Numeric"
                numeric_cols.append(col)
            elif "datetime" in dtype_str or "date" in col.lower() or col == "order_date":
                col_types[col] = "Date"
                date_cols.append(col)
            else:
                col_types[col] = "Categorical"
                categorical_cols.append(col)
                
        missing_report = df.isnull().sum().to_dict()
        missing_pct = {k: float(v / total_rows * 100) for k, v in missing_report.items()}
        duplicate_count = int(df.duplicated().sum())
        
        total_cells = total_rows * total_cols
        total_missing = sum(missing_report.values())
        missing_penalty = (total_missing / total_cells * 100) if total_cells > 0 else 0
        duplicate_penalty = (duplicate_count / total_rows * 100) if total_rows > 0 else 0
        
        required_cols = [
            "customer_id", "customer_name", "region", "product_category", "product_name",
            "order_id", "order_date", "quantity", "sales_amount", "profit", "discount",
            "customer_type", "order_status"
        ]
        mapped_count = sum(1 for c in required_cols if c in df.columns)
        schema_penalty = (len(required_cols) - mapped_count) * 4
        
        quality_score = max(5.0, 100.0 - (missing_penalty + duplicate_penalty + schema_penalty))

        stats_summary = {}
        for col in numeric_cols:
            col_series = df[col].dropna()
            if col_series.empty:
                continue
            
            mode_series = col_series.mode()
            mode_val = float(mode_series.iloc[0]) if not mode_series.empty else 0.0
            
            stats_summary[col] = {
                "mean": float(col_series.mean()),
                "median": float(col_series.median()),
                "mode": mode_val,
                "std_dev": float(col_series.std()) if len(col_series) > 1 else 0.0,
                "min": float(col_series.min()),
                "max": float(col_series.max()),
                "q25": float(col_series.quantile(0.25)),
                "q50": float(col_series.quantile(0.50)),
                "q75": float(col_series.quantile(0.75))
            }

        histograms = {}
        target_numeric = ["sales_amount", "profit", "quantity"]
        for col in target_numeric:
            if col in df.columns:
                series = pd.to_numeric(df[col], errors="coerce").dropna()
                if not series.empty:
                    counts, bin_edges = np.histogram(series, bins=10)
                    histograms[col] = [
                        {"bin_start": float(bin_edges[i]), "bin_end": float(bin_edges[i+1]), "count": int(counts[i])}
                        for i in range(len(counts))
                    ]

        boxplots = {}
        outlier_list = []
        for col in target_numeric:
            if col in df.columns:
                series = pd.to_numeric(df[col], errors="coerce").dropna()
                if not series.empty:
                    q25 = float(series.quantile(0.25))
                    q75 = float(series.quantile(0.75))
                    iqr = q75 - q25
                    lower_bound = q25 - 1.5 * iqr
                    upper_bound = q75 + 1.5 * iqr
                    
                    clean_vals = series[(series >= lower_bound) & (series <= upper_bound)]
                    outliers_series = series[(series < lower_bound) | (series > upper_bound)]
                    
                    boxplots[col] = {
                        "min": float(clean_vals.min()) if not clean_vals.empty else q25,
                        "q1": q25,
                        "median": float(series.median()),
                        "q3": q75,
                        "max": float(clean_vals.max()) if not clean_vals.empty else q75,
                        "outlier_count": len(outliers_series)
                    }
                    
                    if not outliers_series.empty:
                        outliers_df = df.loc[outliers_series.index].head(10)
                        for idx, row in outliers_df.iterrows():
                            outlier_list.append({
                                "customer_name": str(row.get("customer_name", "Unknown")),
                                "order_id": str(row.get("order_id", "N/A")),
                                "sales_amount": float(row.get("sales_amount", 0.0)),
                                "profit": float(row.get("profit", 0.0)),
                                "column_name": col,
                                "value": float(row[col])
                            })

        correlation_matrix = {}
        if len(numeric_cols) > 1:
            corr_df = df[numeric_cols].corr().fillna(0.0)
            correlation_matrix = {
                "columns": list(corr_df.columns),
                "data": corr_df.values.tolist()
            }

        pairwise_scatter = []
        if len(numeric_cols) >= 2:
            sample_df = df[numeric_cols].dropna().head(300)
            pairwise_scatter = sample_df.to_dict(orient="records")

        category_frequencies = {}
        target_cats = ["region", "product_category", "customer_type", "order_status"]
        for col in target_cats:
            if col in df.columns:
                counts = df[col].value_counts().head(10).to_dict()
                category_frequencies[col] = [
                    {"label": str(k), "value": int(v)} for k, v in counts.items()
                ]

        return {
            "overview": {
                "row_count": total_rows,
                "column_count": total_cols,
                "dataset_size_bytes": memory_usage_bytes,
                "columns": list(df.columns),
                "types": col_types,
                "missing_values": missing_report,
                "missing_percentages": missing_pct,
                "duplicate_count": duplicate_count,
                "quality_score": round(quality_score, 2)
            },
            "stats_summary": stats_summary,
            "histograms": histograms,
            "boxplots": boxplots,
            "correlation": correlation_matrix,
            "pairwise": pairwise_scatter,
            "category_frequencies": category_frequencies,
            "outliers_report": {
                "total_outliers": len(outlier_list),
                "list": outlier_list
            }
        }
