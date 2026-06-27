from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
import sqlite3
from app.config import settings

engine = None
db_url = settings.DATABASE_URL

if db_url.startswith("postgresql"):
    try:
        # Create a temporary engine and test connection with a short timeout
        test_engine = create_engine(
            db_url,
            pool_size=20,
            max_overflow=10,
            pool_recycle=1800,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        print("Connected to PostgreSQL database successfully.")
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}. Falling back to SQLite ('sqlite:///data.db').")
        db_url = "sqlite:///data.db"

if engine is None:
    # Use standard connection pooling (QueuePool) for SQLite to leverage WAL mode concurrency
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False, "timeout": 30} if "sqlite" in db_url else {}
    )

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

