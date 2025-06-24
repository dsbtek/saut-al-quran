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
    return recitations

@router.get("/{recitation_id}", response_model=RecitationWithDetails)
def read_recitation(
    recitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    recitation = db.query(Recitation).filter(Recitation.id == recitation_id).first()
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
    recitation = db.query(Recitation).filter(Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")
    
    update_data = recitation_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(recitation, field, value)
    
    db.commit()
    db.refresh(recitation)
    return recitation
