from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.db.init_db import create_tables, create_initial_data
from app.db.database import SessionLocal

app = FastAPI(
    title="Saut Al-Qur'an API",
    description="API for Qur'an recitation recording and scholar feedback",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Direct frontend access
        "http://localhost",       # Nginx proxy access
        "http://localhost:80",    # Explicit port 80
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_tables()
    db = SessionLocal()
    try:
        create_initial_data(db)
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "Saut Al-Qur'an API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
