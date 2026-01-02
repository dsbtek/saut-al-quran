import os
import uuid
import base64
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import get_current_active_user, get_current_scholar
from app.models.user import User
from app.models.recitation import Recitation
from app.schemas.recitation import (
    RecitationCreate,
    Recitation as RecitationSchema,
    RecitationUpdate,
    RecitationWithDetails
)
router = APIRouter()

# Configure upload directory - use absolute path anchored to backend root
BASE_DIR = Path(__file__).resolve().parents[3]  # points to backend/
UPLOAD_DIR = BASE_DIR / "uploads" / "audio"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Verify directory is writable
if not os.access(UPLOAD_DIR, os.W_OK):
    raise PermissionError(f"Upload directory not writable: {UPLOAD_DIR}")


async def save_audio_file(file: UploadFile) -> str:
    """Save uploaded audio file and return the file path"""
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return str(file_path)


@router.post("/", response_model=RecitationSchema)
def create_recitation(
    recitation: RecitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    audio_file_path = None
    
    if recitation.audio_data:
        try:
            # Decode base64 and save
            audio_bytes = base64.b64decode(recitation.audio_data)
            unique_filename = f"{uuid.uuid4()}.webm"
            file_path = UPLOAD_DIR / unique_filename
            
            with open(file_path, "wb") as f:
                f.write(audio_bytes)
            
            audio_file_path = f"uploads/audio/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid audio data: {str(e)}")
    
    db_recitation = Recitation(
        user_id=current_user.id,
        surah_name=recitation.surah_name,
        ayah_start=recitation.ayah_start,
        ayah_end=recitation.ayah_end,
        audio_file_path=audio_file_path,
        duration=recitation.duration
    )
    db.add(db_recitation)
    db.commit()
    db.refresh(db_recitation)
    return db_recitation


@router.get("/", response_model=List[RecitationSchema])
def read_recitations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    recitations = db.query(Recitation).filter(
        Recitation.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return recitations


@router.get("/pending", response_model=List[RecitationWithDetails])
def read_pending_recitations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar)
):
    from app.models.recitation import RecitationStatus
    recitations = db.query(Recitation).filter(
        Recitation.status == RecitationStatus.PENDING
    ).offset(skip).limit(limit).all()

    # Convert to response format with serialized relationships
    result = []
    for recitation in recitations:
        recitation_dict = {
            "id": recitation.id,
            "user_id": recitation.user_id,
            "surah_name": recitation.surah_name,
            "ayah_start": recitation.ayah_start,
            "ayah_end": recitation.ayah_end,
            "audio_file_path": recitation.audio_file_path,
            "audio_data": recitation.audio_data,
            "duration": recitation.duration,
            "status": recitation.status,
            "created_at": recitation.created_at,
            "updated_at": recitation.updated_at,
            "user": {
                "id": recitation.user.id,
                "email": recitation.user.email,
                "username": recitation.user.username,
                "full_name": recitation.user.full_name,
                "role": recitation.user.role,
                "is_active": recitation.user.is_active,
                "is_verified": recitation.user.is_verified,
                "created_at": recitation.user.created_at,
                "updated_at": recitation.user.updated_at
            } if recitation.user else None,
            "comments": [
                {
                    "id": comment.id,
                    "recitation_id": comment.recitation_id,
                    "scholar_id": comment.scholar_id,
                    "user_id": comment.user_id,
                    "timestamp": comment.timestamp,
                    "text_comment": comment.text_comment,
                    "audio_comment_path": comment.audio_comment_path,
                    "is_resolved": comment.is_resolved,
                    "created_at": comment.created_at,
                    "updated_at": comment.updated_at
                } for comment in recitation.comments
            ] if hasattr(recitation, 'comments') else [],
            "markers": [
                {
                    "id": marker.id,
                    "recitation_id": marker.recitation_id,
                    "scholar_id": marker.scholar_id,
                    "timestamp": marker.timestamp,
                    "label": marker.label,
                    "description": marker.description,
                    "category": marker.category,
                    "color": marker.color,
                    "created_at": marker.created_at,
                    "updated_at": marker.updated_at
                } for marker in recitation.markers
            ] if hasattr(recitation, 'markers') else []
        }
        result.append(recitation_dict)

    return result


@router.get("/{recitation_id}", response_model=RecitationWithDetails)
def read_recitation(
    recitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    recitation = db.query(Recitation).filter(
        Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")

    # Users can only access their own recitations, scholars can access any
    if current_user.role not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return recitation


@router.put("/{recitation_id}", response_model=RecitationSchema)
def update_recitation(
    recitation_id: int,
    recitation_update: RecitationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar)
):
    recitation = db.query(Recitation).filter(
        Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")

    update_data = recitation_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(recitation, field, value)

    db.commit()
    db.refresh(recitation)
    return recitation


@router.get("/audio/{recitation_id}")
async def get_recitation_audio(
    recitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get audio file for a specific recitation.
    Returns the audio file as a streaming response.
    """
    from fastapi.responses import FileResponse
    
    recitation = db.query(Recitation).filter(
        Recitation.id == recitation_id
    ).first()
    print(f"Fetching recitation ID: {recitation_id} for user ID: {current_user.id}")
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")
    
    # Authorization: user can access their own recitations, scholars/admins can access any
    if current_user.role not in ["scholar", "admin"] and recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if not recitation.audio_file_path:
        raise HTTPException(status_code=404, detail="No audio file for this recitation")
    print(f"Recitation audio file path: {UPLOAD_DIR.parent}")
    # Construct full file path 
    file_path = UPLOAD_DIR.parent / recitation.audio_file_path.replace("uploads/", "")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")
    return FileResponse(
        path=file_path,
        media_type="audio/webm",
        filename=f"recitation_{recitation_id}.webm"
    )
