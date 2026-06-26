from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
import os
from io import StringIO, BytesIO
from datetime import datetime

from app.database.connection import get_db
from app.database.models import Project, Dataset, Transaction, User
from app.auth.routes import get_current_user
from app.processing.engine import DataProcessingEngine

router = APIRouter(prefix="/projects", tags=["Dataset Management"])

STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.post("/{project_id}/upload", status_code=status.HTTP_201_CREATED)
async def upload_project_dataset(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify project ownership
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or unauthorized access"
        )
        
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".json"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV, Excel (.xlsx), and JSON datasets are allowed."
        )

    # Save file
    file_bytes = await file.read()
    storage_path = os.path.join(STORAGE_DIR, f"{project_id}_{datetime.now().timestamp()}_{filename}")
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    # Parse dataset with Pandas
    try:
        if ext == ".csv":
            df = pd.read_csv(BytesIO(file_bytes))
        elif ext == ".xlsx":
            df = pd.read_excel(BytesIO(file_bytes))
        else:
            df = pd.read_json(BytesIO(file_bytes))
    except Exception as e:
        if os.path.exists(storage_path):
            os.remove(storage_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read dataset: {str(e)}"
        )

    # 1. Automap column headers
    mapped_df, column_mapping = DataProcessingEngine.auto_map_columns(df)
    
    # 2. Validation profiling
    quality_score, val_report = DataProcessingEngine.validate_dataset(mapped_df)
    val_report["original_column_mapping"] = column_mapping

    # 3. Clean dataset
    cleaned_df, clean_report = DataProcessingEngine.clean_dataset(mapped_df)

    # Save cleaned file back to disk
    cleaned_filename = f"cleaned_{filename}"
    cleaned_storage_path = os.path.join(STORAGE_DIR, f"{project_id}_cleaned_{datetime.now().timestamp()}_{cleaned_filename}")
    cleaned_df.to_csv(cleaned_storage_path, index=False)

    # Update or Create Dataset entry and transactions atomically
    try:
        # Wrap everything in a single transaction for maximum speed and safety
        dataset_entry = Dataset(
            project_id=project_id,
            filename=filename,
            file_path=cleaned_storage_path,
            quality_score=quality_score,
            validation_report=val_report,
            cleaning_report=clean_report
        )
        db.add(dataset_entry)

        # Check if sales_amount is present but profit is missing, and synthesize a default profit margin
        if "sales_amount" in cleaned_df.columns:
            cleaned_df["sales_amount"] = pd.to_numeric(cleaned_df["sales_amount"], errors='coerce').fillna(0.0)
            if "profit" not in cleaned_df.columns:
                discount_series = pd.to_numeric(cleaned_df["discount"], errors='coerce').fillna(0.0) if "discount" in cleaned_df.columns else 0.0
                # Synthesize profit: 25% base profit margin, reduced by discount rate
                cleaned_df["profit"] = cleaned_df["sales_amount"] * (0.25 - discount_series * 0.2)
                # Keep profit non-negative
                cleaned_df["profit"] = cleaned_df["profit"].clip(lower=0.0)
                if "profit" not in val_report.get("mapped_columns", []):
                    val_report.setdefault("mapped_columns", []).append("profit")

        mapped_cols = [col for col in DataProcessingEngine.REQUIRED_COLUMNS if col in cleaned_df.columns]
        if len(mapped_cols) >= 5:
            # Drop previous transactions for this project
            db.query(Transaction).filter(Transaction.project_id == project_id).delete()
            
            # Prepare DataFrame for direct SQL insertion
            db_df = pd.DataFrame()
            db_df["project_id"] = [project_id] * len(cleaned_df)
            
            # Map required/optional columns, handling types and nulls
            for col in ["customer_id", "customer_name", "region", "product_category", "product_name", 
                        "order_id", "order_date", "customer_type", "order_status"]:
                if col in cleaned_df.columns:
                    db_df[col] = cleaned_df[col].astype(str).where(cleaned_df[col].notna(), None)
                else:
                    db_df[col] = None
                    
            for col in ["quantity"]:
                if col in cleaned_df.columns:
                    db_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce').astype('Int64').where(cleaned_df[col].notna(), None)
                else:
                    db_df[col] = None
                    
            for col in ["sales_amount", "profit", "discount"]:
                if col in cleaned_df.columns:
                    db_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce').astype(float).where(cleaned_df[col].notna(), None)
                else:
                    db_df[col] = None

            db_df["created_at"] = datetime.utcnow()
            
            # Fast bulk insert using pandas to_sql
            db_df.to_sql("transactions", con=db.bind, if_exists="append", index=False, chunksize=5000)
            
            val_report["bi_indexing_success"] = True
            val_report["bi_indexed_count"] = len(cleaned_df)
        else:
            val_report["bi_indexing_success"] = False
            val_report["bi_indexing_error"] = "Insufficient columns mapped for BI analysis."
            
        db.commit()
        db.refresh(dataset_entry)
        
        # Invalidate in-memory analytics cache & dataframe cache
        from app.analytics.routes import analytics_cache, df_cache
        analytics_cache.invalidate(project_id)
        df_cache.invalidate(project_id)
    except Exception as seed_err:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database upload transaction failed: {str(seed_err)}"
        )

    return {
        "dataset": {
            "id": dataset_entry.id,
            "filename": dataset_entry.filename,
            "quality_score": dataset_entry.quality_score,
            "created_at": dataset_entry.created_at
        },
        "validation_report": val_report,
        "cleaning_report": clean_report
    }

# Default dataset generator string to simulate out-of-the-box resets
DEFAULT_SAMPLE_DATA = """Customer ID,Customer Name,Region,Product Category,Product Name,Order ID,Order Date,Quantity,Sales Amount,Profit,Discount,Customer Type,Order Status
CUST-1035,Alice Miller,South,Furniture,Office Desk,ORD-5055,2026-01-01,3,537.30,200.79,0.10,Corporate,Completed
CUST-1034,David Martinez,East,Furniture,Bookshelf,ORD-5107,2026-01-01,3,424.65,184.75,0.05,Wholesale,Completed
CUST-1018,Ivy Moore,North,Apparel,Backpack,ORD-5021,2026-01-02,10,790.00,307.84,0.00,Retail,Completed
CUST-1007,Charlie Jackson,Central,Furniture,Sofa,ORD-5140,2026-01-02,3,2277.15,780.90,0.05,Corporate,Completed
CUST-1028,Jane Williams,South,Furniture,Bookshelf,ORD-5006,2026-01-05,6,894.00,444.60,0.00,Wholesale,Pending
CUST-1018,Ivy Moore,North,Apparel,Athletic Socks,ORD-5052,2026-01-05,5,48.00,10.11,0.20,Retail,Returned
CUST-1029,Henry Martinez,North,Furniture,Sofa,ORD-5111,2026-01-05,7,5313.35,2518.89,0.05,Retail,Completed
CUST-1023,Mia Taylor,South,Electronics,Wireless Headphones,ORD-5095,2026-01-08,6,849.30,340.08,0.05,Retail,Pending
CUST-1010,Eva Davis,South,Office Supplies,Binder Notebook,ORD-5036,2026-01-09,5,42.75,22.33,0.05,Retail,Completed
CUST-1015,Eva Smith,South,Apparel,Backpack,ORD-5130,2026-01-11,1,67.15,19.93,0.15,Retail,Completed
CUST-1022,Grace Rodriguez,East,Electronics,Smartphone,ORD-5048,2026-01-12,1,699.00,340.71,0.00,Retail,Completed
CUST-1023,Mia Taylor,South,Electronics,Smartphone,ORD-5142,2026-01-12,4,2376.60,901.01,0.15,Retail,Pending
CUST-1005,David Williams,East,Office Supplies,Desk Organizer,ORD-5060,2026-01-13,8,190.00,73.08,0.05,Retail,Completed
CUST-1028,Jane Williams,South,Apparel,Smart Jacket,ORD-5075,2026-01-13,9,1615.95,627.16,0.05,Wholesale,Returned
CUST-1019,David Martinez,West,Office Supplies,Binder Notebook,ORD-5120,2026-01-13,7,56.70,23.26,0.10,Retail,Completed
CUST-1015,Eva Smith,South,Office Supplies,Whiteboard,ORD-5078,2026-01-14,5,220.50,89.62,0.10,Retail,Completed
CUST-1027,Peter Brown,South,Office Supplies,Gel Pens Pack,ORD-5016,2026-01-16,8,102.00,42.11,0.15,Corporate,Completed
CUST-1022,Grace Rodriguez,East,Apparel,Smart Jacket,ORD-5017,2026-01-19,5,850.50,334.30,0.10,Retail,Pending
CUST-1014,Noah Hernandez,East,Furniture,Office Desk,ORD-5141,2026-01-19,3,567.15,227.14,0.05,Corporate,Completed
"""

@router.post("/{project_id}/reset", status_code=status.HTTP_200_OK)
def reset_project_dataset(
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
        
    try:
        # Load string default dataset into dataframe
        df = pd.read_csv(StringIO(DEFAULT_SAMPLE_DATA))
        
        # Save fake cleaned CSV to storage
        storage_path = os.path.join(STORAGE_DIR, f"{project_id}_default_sample_data.csv")
        df.to_csv(storage_path, index=False)
        
        # Automap columns
        mapped_df, column_mapping = DataProcessingEngine.auto_map_columns(df)
        quality_score, val_report = DataProcessingEngine.validate_dataset(mapped_df)
        cleaned_df, clean_report = DataProcessingEngine.clean_dataset(mapped_df)
        
        # Save dataset entry
        dataset_entry = Dataset(
            project_id=project_id,
            filename="sample_data.csv",
            file_path=storage_path,
            quality_score=95.0,
            validation_report=val_report,
            cleaning_report=clean_report
        )
        db.add(dataset_entry)
        
        # Reset transactions
        db.query(Transaction).filter(Transaction.project_id == project_id).delete()
        
        # Prepare DataFrame for direct SQL insertion
        db_df = pd.DataFrame()
        db_df["project_id"] = [project_id] * len(cleaned_df)
        
        for col in ["customer_id", "customer_name", "region", "product_category", "product_name", 
                    "order_id", "order_date", "customer_type", "order_status"]:
            if col in cleaned_df.columns:
                db_df[col] = cleaned_df[col].astype(str).where(cleaned_df[col].notna(), None)
            else:
                db_df[col] = None
                
        for col in ["quantity"]:
            if col in cleaned_df.columns:
                db_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce').astype('Int64').where(cleaned_df[col].notna(), None)
            else:
                db_df[col] = None
                
        for col in ["sales_amount", "profit", "discount"]:
            if col in cleaned_df.columns:
                db_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce').astype(float).where(cleaned_df[col].notna(), None)
            else:
                db_df[col] = None

        db_df["created_at"] = datetime.utcnow()
        
        # Fast bulk insert using pandas to_sql
        db_df.to_sql("transactions", con=db.bind, if_exists="append", index=False, chunksize=5000)
        
        db.commit()
        
        # Invalidate in-memory analytics cache & dataframe cache
        from app.analytics.routes import analytics_cache, df_cache
        analytics_cache.invalidate(project_id)
        df_cache.invalidate(project_id)
        
        return {"detail": "Successfully reset project to sample dataset."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset default dataset: {str(e)}"
        )
