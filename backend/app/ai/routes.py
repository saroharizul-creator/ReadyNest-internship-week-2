from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.database.models import Project, User
from app.auth.routes import get_current_user
from app.analytics.routes import load_project_df
from app.analytics.engine import AnalyticsEngine
from app.ai.engine import AIEngine

router = APIRouter(prefix="/projects", tags=["AI Insights & Assistant"])

class ChatRequestSchema(BaseModel):
    question: str

@router.post("/{project_id}/ai/insights")
def get_ai_insights(
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
        
    df = load_project_df(project_id, db)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data available. Please upload a dataset first."
        )
        
    metrics = AnalyticsEngine.calculate_bi_metrics(df)
    insights = AIEngine.generate_dashboard_insights(
        metrics["kpis"],
        metrics["monthly_trends"],
        metrics["regions"]
    )
    return insights

@router.post("/{project_id}/ai/chat")
def ask_ai_analyst(
    project_id: int,
    request: ChatRequestSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
        
    df = load_project_df(project_id, db)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data available. Please upload a dataset first."
        )
        
    answer = AIEngine.ask_chat_assistant(request.question, df)
    return {"answer": answer}
