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


@router.post("/", response_model=RecitationSchema)
def create_recitation(
    recitation: RecitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_recitation = Recitation(
        user_id=current_user.id,
        surah_name=recitation.surah_name,
        ayah_start=recitation.ayah_start,
        ayah_end=recitation.ayah_end,
        audio_data=recitation.audio_data,
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
    if recitation.user_id != current_user.id and current_user.role.value not in ["scholar", "admin"]:
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
