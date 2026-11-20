import os
import uuid
import base64
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.core.deps import get_current_active_user, get_current_scholar
from app.models.user import User, UserRole
from app.models.recitation import Recitation, RecitationStatus
from app.models.comment import Comment
from app.schemas.recitation import (
    RecitationCreate,
    Recitation as RecitationSchema,
    RecitationUpdate,
    RecitationWithDetails,
    StudentProgressStats,
)

router = APIRouter()

# Configure upload directory - anchored to app/uploads/audio
APP_DIR = Path(__file__).resolve().parents[3]  # points to backend/app/
UPLOAD_DIR = APP_DIR / "uploads" / "audio"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_AUDIO_EXTENSIONS = {".webm", ".mp3", ".wav", ".ogg", ".m4a", ".mp4"}
MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


def _serialize_recitation_with_details(recitation: Recitation) -> dict:
    """Serialize a Recitation ORM object with user, comments, markers, and loop_regions."""
    return {
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
            "updated_at": recitation.user.updated_at,
        } if recitation.user else None,
        "comments": [
            {
                "id": c.id,
                "recitation_id": c.recitation_id,
                "scholar_id": c.scholar_id,
                "user_id": c.user_id,
                "timestamp": c.timestamp,
                "text_comment": c.text_comment,
                "audio_comment_path": c.audio_comment_path,
                "is_resolved": c.is_resolved,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "scholar": {
                    "id": c.scholar.id,
                    "username": c.scholar.username,
                    "full_name": c.scholar.full_name,
                } if c.scholar else None,
            }
            for c in (recitation.comments or [])
        ],
        "markers": [
            {
                "id": m.id,
                "recitation_id": m.recitation_id,
                "scholar_id": m.scholar_id,
                "timestamp": m.timestamp,
                "label": m.label,
                "description": m.description,
                "category": m.category,
                "color": m.color,
                "created_at": m.created_at,
                "updated_at": m.updated_at,
            }
            for m in (recitation.markers or [])
        ],
        "loop_regions": [
            {
                "id": lr.id,
                "recitation_id": lr.recitation_id,
                "scholar_id": lr.scholar_id,
                "start_time": lr.start_time,
                "end_time": lr.end_time,
                "label": lr.label,
                "color": lr.color,
                "is_active": lr.is_active,
                "created_at": lr.created_at,
                "updated_at": lr.updated_at,
            }
            for lr in (recitation.loop_regions or [])
        ],
    }


def _resolve_audio_path(audio_file_path: str) -> Path:
    """Resolve stored relative audio_file_path safely within UPLOAD_DIR."""
    clean_rel = audio_file_path.replace("\\", "/")
    if clean_rel.startswith("uploads/audio/"):
        clean_rel = clean_rel[len("uploads/audio/"):]
    elif clean_rel.startswith("uploads/"):
        clean_rel = clean_rel[len("uploads/"):]
    elif clean_rel.startswith("audio/"):
        clean_rel = clean_rel[len("audio/"):]
    resolved = (UPLOAD_DIR / Path(clean_rel).name).resolve()
    if UPLOAD_DIR.resolve() not in resolved.parents:
        raise HTTPException(status_code=400, detail="Invalid audio file path")
    return resolved


@router.post("/upload", response_model=RecitationSchema)
async def upload_recitation_multipart(
    surah_name: str = Form(...),
    ayah_start: int = Form(...),
    ayah_end: int = Form(...),
    duration: Optional[float] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Primary endpoint: upload recitation audio via multipart/form-data."""
    if ayah_start < 1 or ayah_end < ayah_start:
        raise HTTPException(status_code=400, detail="Invalid ayah range")

    ext = Path(file.filename or "recording.webm").suffix.lower() or ".webm"
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {ext}")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(contents) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 50MB limit")

    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / unique_filename
    with open(file_path, "wb") as f:
        f.write(contents)

    db_recitation = Recitation(
        user_id=current_user.id,
        surah_name=surah_name,
        ayah_start=ayah_start,
        ayah_end=ayah_end,
        audio_file_path=f"uploads/audio/{unique_filename}",
        duration=duration,
    )
    db.add(db_recitation)
    db.commit()
    db.refresh(db_recitation)
    return db_recitation


@router.post("/", response_model=RecitationSchema)
def create_recitation(
    recitation: RecitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Fallback JSON/base64 endpoint (used by offline background sync or legacy clients)."""
    if recitation.ayah_start < 1 or recitation.ayah_end < recitation.ayah_start:
        raise HTTPException(status_code=400, detail="Invalid ayah range")

    audio_file_path = None
    if recitation.audio_data:
        try:
            payload = recitation.audio_data
            if "," in payload and payload.startswith("data:"):
                payload = payload.split(",", 1)[1]
            audio_bytes = base64.b64decode(payload)
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
        duration=recitation.duration,
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
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(Recitation)
        .filter(Recitation.user_id == current_user.id)
        .order_by(desc(Recitation.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/stats/me", response_model=StudentProgressStats)
def get_my_progress_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get recitation and feedback progress statistics for the current student."""
    recitations = db.query(Recitation).filter(Recitation.user_id == current_user.id).all()
    comments = db.query(Comment).filter(Comment.user_id == current_user.id).all()

    surahs = sorted({r.surah_name for r in recitations})
    pending_count = sum(1 for r in recitations if r.status == RecitationStatus.PENDING)
    reviewed_count = sum(1 for r in recitations if r.status == RecitationStatus.REVIEWED)
    needs_revision_count = sum(1 for r in recitations if r.status == RecitationStatus.NEEDS_REVISION)
    total_duration = sum((r.duration or 0.0) for r in recitations)

    resolved_comments = sum(1 for c in comments if c.is_resolved)
    unresolved_comments = len(comments) - resolved_comments

    return StudentProgressStats(
        total_recitations=len(recitations),
        pending_count=pending_count,
        reviewed_count=reviewed_count,
        needs_revision_count=needs_revision_count,
        surahs_practiced_count=len(surahs),
        surahs_practiced=surahs,
        total_comments=len(comments),
        resolved_comments=resolved_comments,
        unresolved_comments=unresolved_comments,
        total_duration_seconds=round(total_duration, 1),
    )


@router.get("/pending", response_model=List[RecitationWithDetails])
def read_pending_recitations(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[RecitationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar),
):
    """Get recitations for scholar review. Defaults to pending; pass status_filter to filter."""
    query = db.query(Recitation)
    if status_filter is not None:
        query = query.filter(Recitation.status == status_filter)
    else:
        query = query.filter(Recitation.status == RecitationStatus.PENDING)

    recitations = query.order_by(desc(Recitation.created_at)).offset(skip).limit(limit).all()
    return [_serialize_recitation_with_details(r) for r in recitations]


@router.get("/scholar/all", response_model=List[RecitationWithDetails])
def read_all_recitations_for_scholar(
    skip: int = 0,
    limit: int = 100,
    status: Optional[RecitationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar),
):
    """List all recitations for scholars/admins with optional status filter."""
    query = db.query(Recitation)
    if status is not None:
        query = query.filter(Recitation.status == status)
    recitations = query.order_by(desc(Recitation.created_at)).offset(skip).limit(limit).all()
    return [_serialize_recitation_with_details(r) for r in recitations]


@router.get("/{recitation_id}", response_model=RecitationWithDetails)
def read_recitation(
    recitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    recitation = db.query(Recitation).filter(Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")

    if current_user.role not in [UserRole.SCHOLAR, UserRole.ADMIN] and recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return _serialize_recitation_with_details(recitation)


@router.put("/{recitation_id}", response_model=RecitationSchema)
def update_recitation(
    recitation_id: int,
    recitation_update: RecitationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar),
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


@router.get("/audio/{recitation_id}")
async def get_recitation_audio(
    recitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Stream audio file for a specific recitation with ownership/scholar authorization."""
    recitation = db.query(Recitation).filter(Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")

    if current_user.role not in [UserRole.SCHOLAR, UserRole.ADMIN] and recitation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not recitation.audio_file_path:
        raise HTTPException(status_code=404, detail="No audio file for this recitation")

    file_path = _resolve_audio_path(recitation.audio_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    ext = file_path.suffix.lower()
    media_type_map = {
        ".webm": "audio/webm",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".mp4": "audio/mp4",
    }
    return FileResponse(
        path=file_path,
        media_type=media_type_map.get(ext, "audio/webm"),
        filename=f"recitation_{recitation_id}{ext or '.webm'}",
    )
