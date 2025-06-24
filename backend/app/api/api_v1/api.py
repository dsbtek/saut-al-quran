from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, recitations, comments, markers

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(recitations.router, prefix="/recitations", tags=["recitations"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
api_router.include_router(markers.router, prefix="/markers", tags=["markers"])
