from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.db.init_db import create_tables, create_initial_data
from app.db.database import SessionLocal
import os

app = FastAPI(
    title="Saut Al-Qur'an API",
    description="API for Qur'an recitation recording and scholar feedback",
    version="2.0.0",
)

# Ensure uploads directories exist
os.makedirs("app/uploads/audio", exist_ok=True)
os.makedirs("app/uploads/comments", exist_ok=True)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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