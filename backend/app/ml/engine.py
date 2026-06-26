import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, Any, List

class MLEngine:
    @staticmethod
    def run_customer_clustering(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Groups customers using K-Means clustering.
        Features: totalSpend, orderCount, recency
        """
        if df.empty or df["customer_id"].nunique() < 3:
            return []

        # 1. Build customer feature metrics in a vectorized way
        global_max_date = pd.to_datetime(df["order_date"].max())
        features_df = df.groupby("customer_id").agg(
            spend=("sales_amount", "sum"),
            frequency=("order_id", "nunique"),
            last_date=("order_date", "max")
        ).reset_index()
        features_df["last_date"] = pd.to_datetime(features_df["last_date"])
        features_df["recency"] = (global_max_date - features_df["last_date"]).dt.days.fillna(999).astype(int)
        features_df["spend"] = features_df["spend"].astype(float)
        features_df["frequency"] = features_df["frequency"].astype(int)
        
        # 2. Scale features
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features_df[["spend", "frequency", "recency"]])
        
        # 3. Fit KMeans
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        features_df["cluster"] = kmeans.fit_predict(scaled_features)
        
        # Determine cluster characteristics to name them intelligently
        centroids = kmeans.cluster_centers_
        # Centroids contain: [spend_scaled, frequency_scaled, recency_scaled]
        # Sort clusters by spend (the scaled centroid index 0)
        cluster_spend_means = features_df.groupby("cluster")["spend"].mean().to_dict()
        sorted_clusters = sorted(cluster_spend_means.items(), key=lambda x: x[1])
        # Mapping: lowest spend -> Churned/Low-value, middle -> Loyals/Mid-value, highest -> Champions/VIPs
        cluster_names = {
            sorted_clusters[0][0]: "At-Risk Inactive",
            sorted_clusters[1][0]: "Average Loyals",
            sorted_clusters[2][0]: "High-Value Champions"
        }
        
        # Build profiles list in a vectorized way
        features_df["clusterId"] = features_df["cluster"].astype(int)
        features_df["clusterName"] = features_df["clusterId"].map(cluster_names).astype(str)
        features_df["customerId"] = features_df["customer_id"].astype(str)
        features_df["spend"] = features_df["spend"].astype(float)
        features_df["frequency"] = features_df["frequency"].astype(int)
        features_df["recency"] = features_df["recency"].astype(int)
        results = features_df[["customerId", "spend", "frequency", "recency", "clusterId", "clusterName"]].to_dict(orient="records")
        
        return results

    @staticmethod
    def predict_customer_churn_and_clv(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Trains a RandomForestClassifier to predict churn risk probability
        using transactional features (spend, frequency, recency, tenure, interval).
        Applies a sophisticated recency-frequency-tenure heuristic for CLV projection.
        """
        if df.empty or "customer_id" not in df.columns or "order_date" not in df.columns:
            return []

        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
        df = df.dropna(subset=["order_date"])

        if df.empty or df["customer_id"].nunique() < 2:
            return []

        # 1. Feature extraction in a vectorized way
        global_max_date = pd.to_datetime(df["order_date"].max())
        agg_cols = {
            "spend": ("sales_amount", "sum"),
            "frequency": ("order_id", "nunique"),
            "first_date": ("order_date", "min"),
            "last_date": ("order_date", "max"),
        }
        if "profit" in df.columns:
            agg_cols["profit"] = ("profit", "sum")
            
        feat_df = df.groupby("customer_id").agg(**agg_cols).reset_index()
        
        # Map customer name
        if "customer_name" in df.columns:
            name_map = df.groupby("customer_id")["customer_name"].first().to_dict()
            feat_df["name"] = feat_df["customer_id"].map(name_map).fillna(feat_df["customer_id"]).astype(str)
        else:
            feat_df["name"] = feat_df["customer_id"].astype(str)
            
        if "profit" not in feat_df.columns:
            feat_df["profit"] = feat_df["spend"] * 0.15
            
        feat_df["first_date"] = pd.to_datetime(feat_df["first_date"])
        feat_df["last_date"] = pd.to_datetime(feat_df["last_date"])
        
        feat_df["tenure"] = (global_max_date - feat_df["first_date"]).dt.days
        feat_df["tenure"] = feat_df["tenure"].clip(lower=1).astype(int)
        feat_df["recency"] = (global_max_date - feat_df["last_date"]).dt.days.fillna(999).astype(int)
        
        active_span = (feat_df["last_date"] - feat_df["first_date"]).dt.days.fillna(0)
        
        # Average inter-purchase interval
        feat_df["avg_interval"] = np.where(
            feat_df["frequency"] > 1,
            active_span / (feat_df["frequency"] - 1),
            30.0
        )
        feat_df.loc[feat_df["avg_interval"] <= 0, "avg_interval"] = 30.0
        
        feat_df["avg_ticket"] = feat_df["spend"] / feat_df["frequency"]
        feat_df["avg_profit"] = feat_df["profit"] / feat_df["frequency"]
        
        # Customer loyalty score
        # Heuristic Probability Active: e^(-recency / average_interval)
        prob_active = np.exp(-feat_df["recency"] / feat_df["avg_interval"])
        feat_df["churn_probability"] = (1.0 - prob_active).round(3)
        
        # Projected CLV over next 12 months:
        expected_orders = (365 / feat_df["avg_interval"]) * prob_active
        future_profit_per_order = np.maximum(feat_df["avg_profit"], feat_df["avg_ticket"] * 0.15)
        feat_df["clv"] = (feat_df["spend"] + (expected_orders * future_profit_per_order)).round(2)
        
        # Convert types to match original schema
        feat_df["customer_id"] = feat_df["customer_id"].astype(str)
        feat_df["spend"] = feat_df["spend"].astype(float)
        feat_df["frequency"] = feat_df["frequency"].astype(int)
        feat_df["avg_ticket"] = feat_df["avg_ticket"].astype(float)
        
        # 2. Add Machine Learning predictions using Random Forest
        # Classify Churn risk levels based on trained models using the dataset features
        feat_df["churn_label"] = (feat_df["churn_probability"] > 0.5).astype(int)
        
        X = feat_df[["spend", "frequency", "recency", "tenure", "avg_interval"]].values
        y = feat_df["churn_label"].values
        
        # If we have both classes represented, train a model. Otherwise use the heuristics directly.
        if len(np.unique(y)) > 1:
            try:
                clf = RandomForestClassifier(n_estimators=15, max_depth=6, n_jobs=-1, random_state=42)
                clf.fit(X, y)
                # Refine probabilities using RF prediction scores combined with recency math
                rf_probs = clf.predict_proba(X)[:, 1]
                # Combined score: 60% RF ML risk model, 40% math heuristic
                feat_df["churn_probability"] = (rf_probs * 0.6) + (feat_df["churn_probability"] * 0.4)
            except Exception as e:
                print(f"RandomForest training failed: {e}. Falling back to raw heuristic.")
                
        feat_df["churnProbability"] = feat_df["churn_probability"].astype(float).round(3)
        feat_df["riskLevel"] = np.where(
            feat_df["churnProbability"] > 0.6,
            "High",
            np.where(feat_df["churnProbability"] > 0.3, "Medium", "Low")
        ).astype(str)
        
        feat_df["customerId"] = feat_df["customer_id"].astype(str)
        feat_df["name"] = feat_df["name"].astype(str)
        feat_df["recency"] = feat_df["recency"].astype(int)
        feat_df["clv"] = feat_df["clv"].astype(float)
        
        results = feat_df[[
            "customerId", "name", "recency", "clv", "churnProbability", "riskLevel"
        ]].to_dict(orient="records")
        
        return results

    @staticmethod
    def generate_product_recommendations(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Calculates simple market basket associations ("Bought X also bought Y")
        and top-selling cross-selling opportunities.
        """
        if df.empty or df["order_id"].nunique() < 3:
            return []

        # Filter out rows with null product_name or order_id
        valid_df = df[df["product_name"].notna() & df["order_id"].notna()]
        if valid_df.empty:
            return []

        # Count total orders per product (for confidence denominator)
        product_counts = valid_df.groupby("product_name")["order_id"].nunique().to_dict()

        # Find orders with multiple items
        order_item_counts = valid_df.groupby("order_id")["product_name"].nunique()
        multi_item_orders = order_item_counts[order_item_counts > 1].index

        if len(multi_item_orders) == 0:
            return []

        multi_df = valid_df[valid_df["order_id"].isin(multi_item_orders)]

        # Get list of products per order
        order_products = multi_df.groupby("order_id")["product_name"].apply(list).tolist()

        # Count co-occurrences of pairs
        from collections import Counter
        from itertools import combinations
        pair_counts = Counter()
        
        # Limit to prevent combinatorial explosion if an order has too many items
        for products in order_products:
            unique_prods = sorted(list(set(products)))
            if len(unique_prods) > 1:
                # Max 10 items per order to prevent slow combinations
                for pair in combinations(unique_prods[:10], 2):
                    pair_counts[pair] += 1

        if not pair_counts:
            return []

        # Sort and build recommendations
        sorted_pairs = pair_counts.most_common(10)
        recommendations = []
        seen_pairs = set()

        for (p1, p2), count in sorted_pairs:
            pair_key = tuple(sorted([p1, p2]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            # Confidence = count(A & B) / count(A)
            support_p1 = product_counts.get(p1, 1)
            confidence = count / support_p1

            # Fetch categories
            p1_rows = df[df["product_name"] == p1]
            p2_rows = df[df["product_name"] == p2]
            c1 = str(p1_rows["product_category"].iloc[0]) if not p1_rows.empty else "General"
            c2 = str(p2_rows["product_category"].iloc[0]) if not p2_rows.empty else "General"

            recommendations.append({
                "product": p1,
                "recommended": p2,
                "category": c1,
                "targetCategory": c2,
                "confidence": round(float(confidence), 2),
                "impactLevel": "High" if confidence > 0.5 else "Medium"
            })

            if len(recommendations) >= 5:
                break

        return recommendations
