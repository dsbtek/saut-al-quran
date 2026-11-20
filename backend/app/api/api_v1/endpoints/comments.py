import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import get_current_active_user, get_current_scholar
from app.models.user import User, UserRole
from app.models.comment import Comment
from app.models.recitation import Recitation
from app.schemas.comment import (
    CommentCreate,
    Comment as CommentSchema,
    CommentUpdate,
    CommentWithDetails,
)

router = APIRouter()

APP_DIR = Path(__file__).resolve().parents[3]
COMMENTS_UPLOAD_DIR = APP_DIR / "uploads" / "comments"
COMMENTS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _serialize_comment(c: Comment) -> dict:
    return {
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
        "recitation": {
            "id": c.recitation.id,
            "surah_name": c.recitation.surah_name,
            "ayah_start": c.recitation.ayah_start,
            "ayah_end": c.recitation.ayah_end,
        } if c.recitation else None,
    }


@router.post("/", response_model=CommentWithDetails)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar),
):
    recitation = db.query(Recitation).filter(Recitation.id == comment.recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")

    db_comment = Comment(
        recitation_id=comment.recitation_id,
        scholar_id=current_user.id,
        user_id=recitation.user_id,
        timestamp=comment.timestamp,
        text_comment=comment.text_comment,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return _serialize_comment(db_comment)


@router.post("/with-audio", response_model=CommentWithDetails)
async def create_comment_with_audio(
    recitation_id: int = Form(...),
    timestamp: float = Form(...),
    text_comment: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar),
):
    """Create a scholar comment with optional multipart voice feedback."""
    recitation = db.query(Recitation).filter(Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")

    if not text_comment and not audio_file:
        raise HTTPException(status_code=400, detail="Provide text_comment or audio_file")

    audio_comment_path = None
    if audio_file is not None:
        ext = Path(audio_file.filename or "comment.webm").suffix.lower() or ".webm"
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = COMMENTS_UPLOAD_DIR / unique_name
        contents = await audio_file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty audio comment file")
        with open(file_path, "wb") as f:
            f.write(contents)
        audio_comment_path = f"uploads/comments/{unique_name}"

    db_comment = Comment(
        recitation_id=recitation_id,
        scholar_id=current_user.id,
        user_id=recitation.user_id,
        timestamp=timestamp,
        text_comment=text_comment,
        audio_comment_path=audio_comment_path,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return _serialize_comment(db_comment)


@router.get("/audio/{comment_id}")
async def get_comment_audio(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Stream voice feedback audio for a comment with ownership/scholar authorization."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    if current_user.role not in [UserRole.SCHOLAR, UserRole.ADMIN] and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not comment.audio_comment_path:
        raise HTTPException(status_code=404, detail="No audio feedback for this comment")

    filename = Path(comment.audio_comment_path).name
    file_path = (COMMENTS_UPLOAD_DIR / filename).resolve()
    if COMMENTS_UPLOAD_DIR.resolve() not in file_path.parents or not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    return FileResponse(
        path=file_path,
        media_type="audio/webm",
        filename=f"comment_{comment_id}{file_path.suffix or '.webm'}",
    )


@router.get("/recitation/{recitation_id}", response_model=List[CommentWithDetails])
def read_comments_for_recitation(
    recitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    recitation = db.query(Recitation).filter(Recitation.id == recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")

    if recitation.user_id != current_user.id and current_user.role not in [UserRole.SCHOLAR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    comments = db.query(Comment).filter(Comment.recitation_id == recitation_id).order_by(Comment.timestamp).all()
    return [_serialize_comment(c) for c in comments]


@router.get("/my-comments", response_model=List[CommentWithDetails])
def read_my_comments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comments = (
        db.query(Comment)
        .filter(Comment.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_comment(c) for c in comments]


@router.put("/{comment_id}", response_model=CommentSchema)
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id and comment.scholar_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = comment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comment, field, value)

    db.commit()
    db.refresh(comment)
    return comment
