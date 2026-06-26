from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="User", nullable=False)  # Admin or User
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String(50), nullable=True)  # e.g. Retail, SaaS, Health
    dataset_type = Column(String(50), nullable=True)  # e.g. Customer + Sales
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    owner = relationship("User", back_populates="projects")
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="project", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(200), nullable=False)
    file_path = Column(String(500), nullable=False)  # Path to saved file on disk/S3
    quality_score = Column(Float, nullable=True)
    validation_report = Column(JSON, nullable=True)
    cleaning_report = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="datasets")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(100), nullable=True, index=True)
    customer_name = Column(String(200), nullable=True)
    region = Column(String(100), nullable=True, index=True)
    product_category = Column(String(100), nullable=True)
    product_name = Column(String(250), nullable=True, index=True)
    order_id = Column(String(100), nullable=True, index=True)
    order_date = Column(String(100), nullable=True, index=True)
    quantity = Column(Integer, nullable=True)
    sales_amount = Column(Float, nullable=True)
    profit = Column(Float, nullable=True)
    discount = Column(Float, nullable=True)
    customer_type = Column(String(100), nullable=True)
    order_status = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="transactions")
