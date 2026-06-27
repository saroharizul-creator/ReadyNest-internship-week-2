import re
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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

# Compile regex pattern to match development (localhost) and production/preview environments on Vercel and Render
ALLOWED_ORIGIN_REGEX = re.compile(
    r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|"
    r"^https://.*\.vercel\.app$|"
    r"^https://.*\.onrender\.com$"
)

def is_allowed_origin(origin: str) -> bool:
    return bool(ALLOWED_ORIGIN_REGEX.match(origin))

@app.middleware("http")
async def custom_cors_middleware(request: Request, call_next):
    # Handle preflight OPTIONS requests manually
    if request.method == "OPTIONS":
        response = JSONResponse(content="OK", status_code=200)
        origin = request.headers.get("origin")
        if origin and is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        return response

    try:
        response = await call_next(request)
    except Exception as e:
        # Wrap unhandled exceptions in a standard JSON response with CORS headers
        # to prevent browsers from obscuring backend crashes as CORS blocked failures.
        response = JSONResponse(
            content={"detail": f"Internal Server Error: {str(e)}"},
            status_code=500
        )
        
    origin = request.headers.get("origin")
    if origin and is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        
    return response

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
