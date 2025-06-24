from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.marker import Marker
from app.models.recitation import Recitation
from app.schemas.marker import (
    MarkerCreate, 
    Marker as MarkerSchema, 
    MarkerUpdate
)

router = APIRouter()

@router.post("/", response_model=MarkerSchema)
def create_marker(
    marker: MarkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify recitation exists and belongs to user
    recitation = db.query(Recitation).filter(Recitation.id == marker.recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")
    
    if recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_marker = Marker(
        recitation_id=marker.recitation_id,
        timestamp=marker.timestamp,
        label=marker.label,
        description=marker.description
    )
    db.add(db_marker)
    db.commit()
    db.refresh(db_marker)
    return db_marker

@router.get("/recitation/{recitation_id}", response_model=List[MarkerSchema])
def read_markers_for_recitation(
    recitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify recitation exists and user has access
    recitation = db.query(Recitation).filter(Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")
    
    if recitation.user_id != current_user.id and current_user.role.value not in ["scholar", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    markers = db.query(Marker).filter(Marker.recitation_id == recitation_id).all()
    return markers

@router.put("/{marker_id}", response_model=MarkerSchema)
def update_marker(
    marker_id: int,
    marker_update: MarkerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if marker is None:
        raise HTTPException(status_code=404, detail="Marker not found")
    
    # Verify user owns the recitation
    recitation = db.query(Recitation).filter(Recitation.id == marker.recitation_id).first()
    if recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = marker_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(marker, field, value)
    
    db.commit()
    db.refresh(marker)
    return marker

@router.delete("/{marker_id}")
def delete_marker(
    marker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if marker is None:
        raise HTTPException(status_code=404, detail="Marker not found")
    
    # Verify user owns the recitation
    recitation = db.query(Recitation).filter(Recitation.id == marker.recitation_id).first()
    if recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(marker)
    db.commit()
    return {"message": "Marker deleted successfully"}
