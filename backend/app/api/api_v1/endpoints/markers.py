from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.marker import Marker, LoopRegion
from app.models.recitation import Recitation
from app.models.user import User
from app.schemas.marker import (
    MarkerCreate, MarkerUpdate, Marker as MarkerSchema,
    LoopRegionCreate, LoopRegionUpdate, LoopRegion as LoopRegionSchema
)
from app.core import deps

router = APIRouter()


@router.post("/", response_model=MarkerSchema)
def create_marker(
    *,
    db: Session = Depends(get_db),
    marker_in: MarkerCreate,
    current_user: User = Depends(deps.get_current_scholar)
) -> Marker:
    """
    Create a new marker. Only scholars can create markers.
    """
    # Verify recitation exists
    recitation = db.query(Recitation).filter(
        Recitation.id == marker_in.recitation_id).first()
    if not recitation:
        raise HTTPException(status_code=404, detail="Recitation not found")

    marker_data = marker_in.dict()
    marker_data["scholar_id"] = current_user.id
    marker = Marker(**marker_data)
    db.add(marker)
    db.commit()
    db.refresh(marker)
    return marker


@router.get("/recitation/{recitation_id}", response_model=List[MarkerSchema])
def get_markers_by_recitation(
    *,
    db: Session = Depends(get_db),
    recitation_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> List[Marker]:
    """
    Get all markers for a specific recitation.
    """
    # Verify recitation exists and user has access
    recitation = db.query(Recitation).filter(
        Recitation.id == recitation_id).first()
    if not recitation:
        raise HTTPException(status_code=404, detail="Recitation not found")

    # Users can only see markers on their own recitations, scholars can see all
    if current_user.role not in ["scholar", "admin"] and recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    markers = db.query(Marker).filter(
        Marker.recitation_id == recitation_id).all()
    return markers


@router.put("/{marker_id}", response_model=MarkerSchema)
def update_marker(
    marker_id: int,
    marker_update: MarkerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if marker is None:
        raise HTTPException(status_code=404, detail="Marker not found")

    # Verify user owns the recitation
    recitation = db.query(Recitation).filter(
        Recitation.id == marker.recitation_id).first()
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
    *,
    db: Session = Depends(get_db),
    marker_id: int,
    current_user: User = Depends(deps.get_current_scholar)
) -> dict:
    """
    Delete a marker. Only the scholar who created it can delete.
    """
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="Marker not found")

    # Only the scholar who created the marker or admin can delete
    if marker.scholar_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(marker)
    db.commit()
    return {"message": "Marker deleted successfully"}


# Loop Region endpoints
@router.post("/loops/", response_model=LoopRegionSchema)
def create_loop_region(
    *,
    db: Session = Depends(get_db),
    loop_in: LoopRegionCreate,
    current_user: User = Depends(deps.get_current_scholar)
) -> LoopRegion:
    """
    Create a new loop region. Only scholars can create loop regions.
    """
    # Verify recitation exists
    recitation = db.query(Recitation).filter(
        Recitation.id == loop_in.recitation_id).first()
    if not recitation:
        raise HTTPException(status_code=404, detail="Recitation not found")

    # Validate time range
    if loop_in.start_time >= loop_in.end_time:
        raise HTTPException(
            status_code=400, detail="Start time must be less than end time")

    loop_data = loop_in.dict()
    loop_data["scholar_id"] = current_user.id
    loop_region = LoopRegion(**loop_data)
    db.add(loop_region)
    db.commit()
    db.refresh(loop_region)
    return loop_region


@router.get("/loops/recitation/{recitation_id}", response_model=List[LoopRegionSchema])
def get_loop_regions_by_recitation(
    *,
    db: Session = Depends(get_db),
    recitation_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> List[LoopRegion]:
    """
    Get all loop regions for a specific recitation.
    """
    # Verify recitation exists and user has access
    recitation = db.query(Recitation).filter(
        Recitation.id == recitation_id).first()
    if not recitation:
        raise HTTPException(status_code=404, detail="Recitation not found")

    # Users can only see loop regions on their own recitations, scholars can see all
    if current_user.role not in ["scholar", "admin"] and recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    loop_regions = db.query(LoopRegion).filter(
        LoopRegion.recitation_id == recitation_id).all()
    return loop_regions


@router.put("/loops/{loop_id}", response_model=LoopRegionSchema)
def update_loop_region(
    *,
    db: Session = Depends(get_db),
    loop_id: int,
    loop_in: LoopRegionUpdate,
    current_user: User = Depends(deps.get_current_scholar)
) -> LoopRegion:
    """
    Update a loop region. Only the scholar who created it can update.
    """
    loop_region = db.query(LoopRegion).filter(LoopRegion.id == loop_id).first()
    if not loop_region:
        raise HTTPException(status_code=404, detail="Loop region not found")

    # Only the scholar who created the loop region or admin can update
    if loop_region.scholar_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = loop_in.dict(exclude_unset=True)

    # Validate time range if both times are being updated
    if "start_time" in update_data or "end_time" in update_data:
        start_time = update_data.get("start_time", loop_region.start_time)
        end_time = update_data.get("end_time", loop_region.end_time)
        if start_time >= end_time:
            raise HTTPException(
                status_code=400, detail="Start time must be less than end time")

    for field, value in update_data.items():
        setattr(loop_region, field, value)

    db.commit()
    db.refresh(loop_region)
    return loop_region


@router.delete("/loops/{loop_id}")
def delete_loop_region(
    *,
    db: Session = Depends(get_db),
    loop_id: int,
    current_user: User = Depends(deps.get_current_scholar)
) -> dict:
    """
    Delete a loop region. Only the scholar who created it can delete.
    """
    loop_region = db.query(LoopRegion).filter(LoopRegion.id == loop_id).first()
    if not loop_region:
        raise HTTPException(status_code=404, detail="Loop region not found")

    # Only the scholar who created the loop region or admin can delete
    if loop_region.scholar_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(loop_region)
    db.commit()
    return {"message": "Loop region deleted successfully"}
