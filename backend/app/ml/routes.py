from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import os

from app.database.connection import get_db
from app.database.models import Project, Transaction, Dataset, User
from app.auth.routes import get_current_user
from app.analytics.routes import load_project_df, analytics_cache
from app.ml.engine import MLEngine

router = APIRouter(prefix="/projects", tags=["Machine Learning Predictions"])

@router.get("/{project_id}/ml/segmentation")
def get_ml_segmentation(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
        
    cached_val = analytics_cache.get(project_id, "ml_segmentation", None)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data available for this project. Please upload a dataset first."
        )
        
    clusters = MLEngine.run_customer_clustering(df)
    analytics_cache.set(project_id, "ml_segmentation", None, clusters)
    return clusters

@router.get("/{project_id}/ml/churn")
def get_ml_churn_predictions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
        
    cached_val = analytics_cache.get(project_id, "ml_churn", None)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data available for this project. Please upload a dataset first."
        )
        
    predictions = MLEngine.predict_customer_churn_and_clv(df)
    analytics_cache.set(project_id, "ml_churn", None, predictions)
    return predictions

@router.get("/{project_id}/ml/recommendations")
def get_ml_recommendations(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
        
    cached_val = analytics_cache.get(project_id, "ml_recommendations", None)
    if cached_val is not None:
        return cached_val

    df = load_project_df(project_id, db)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data available for this project. Please upload a dataset first."
        )
        
    recommendations = MLEngine.generate_product_recommendations(df)
    analytics_cache.set(project_id, "ml_recommendations", None, recommendations)
    return recommendations
