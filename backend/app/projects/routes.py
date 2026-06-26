from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db
from app.database.models import Project, User
from app.auth.routes import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

# Pydantic Schemas
class ProjectCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    dataset_type: Optional[str] = None

class ProjectUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    dataset_type: Optional[str] = None

class ProjectOutSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    industry: Optional[str]
    dataset_type: Optional[str]
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

@router.post("", response_model=ProjectOutSchema, status_code=status.HTTP_201_CREATED)
def create_project(project_data: ProjectCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        new_project = Project(
            name=project_data.name,
            description=project_data.description,
            industry=project_data.industry,
            dataset_type=project_data.dataset_type,
            user_id=current_user.id
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        return new_project
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )

@router.get("", response_model=List[ProjectOutSchema])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()
    return projects

@router.get("/{project_id}", response_model=ProjectOutSchema)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
    return project

@router.put("/{project_id}", response_model=ProjectOutSchema)
def update_project(project_id: int, project_data: ProjectUpdateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
    
    try:
        # Update fields if provided
        for key, value in project_data.model_dump(exclude_unset=True).items():
            setattr(project, key, value)
            
        db.commit()
        db.refresh(project)
        return project
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
    try:
        db.delete(project)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )
