from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.auth.routes import router as auth_router
from app.projects.routes import router as projects_router
from app.processing.routes import router as processing_router
from app.analytics.routes import router as analytics_router
from app.ml.routes import router as ml_router
from app.ai.routes import router as ai_router
from app.reports.routes import router as reports_router

# Initialize all database tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Warning: Database initialization failed: {e}")

app = FastAPI(
    title="InsightFlow AI - Core API Engine",
    description="Backend engine driving AI insights, data profiling, customer RFM segmentation, and report downloads.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(processing_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(ml_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

@app.get("/")
def api_health_check():
    return {
        "status": "healthy",
        "service": "InsightFlow AI Backend Engine",
        "version": "1.0.0"
    }
