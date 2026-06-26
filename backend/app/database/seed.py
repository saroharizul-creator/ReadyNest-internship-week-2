import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.connection import SessionLocal, Base, engine
from app.database.models import User, Project, Transaction
from app.auth.utils import hash_password

def seed_database():
    db = SessionLocal()
    try:
        # Verify/create tables
        Base.metadata.create_all(bind=engine)
        
        # Check if admin user exists
        admin = db.query(User).filter(User.email == "admin@insightflow.com").first()
        if not admin:
            print("Seeding admin user...")
            admin = User(
                name="Admin Manager",
                email="admin@insightflow.com",
                hashed_password=hash_password("admin123"),
                role="Admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("Admin user seeded: admin@insightflow.com / admin123")
            
        # Check if project exists
        project = db.query(Project).filter(Project.user_id == admin.id).first()
        if not project:
            print("Seeding default eCommerce analysis project...")
            project = Project(
                name="Default Retail Workspace",
                description="Auto-generated analytical project for eCommerce sales data validation.",
                industry="Retail",
                dataset_type="Customer Transactions",
                user_id=admin.id
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            
            # Seed default transactions
            from io import StringIO
            import pandas as pd
            from app.processing.routes import DEFAULT_SAMPLE_DATA
            
            df = pd.read_csv(StringIO(DEFAULT_SAMPLE_DATA))
            # Clean headers: rename to snake_case
            df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
            
            tx_records = []
            for _, row in df.iterrows():
                tx = Transaction(
                    project_id=project.id,
                    customer_id=str(row.get("customer_id")),
                    customer_name=str(row.get("customer_name")),
                    region=str(row.get("region")),
                    product_category=str(row.get("product_category")),
                    product_name=str(row.get("product_name")),
                    order_id=str(row.get("order_id")),
                    order_date=str(row.get("order_date")),
                    quantity=int(row.get("quantity")),
                    sales_amount=float(row.get("sales_amount")),
                    profit=float(row.get("profit")),
                    discount=float(row.get("discount")),
                    customer_type=str(row.get("customer_type")),
                    order_status=str(row.get("order_status"))
                )
                tx_records.append(tx)
                
            db.bulk_save_objects(tx_records)
            db.commit()
            print(f"Seeded default project transactions ({len(tx_records)} records).")
            
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
