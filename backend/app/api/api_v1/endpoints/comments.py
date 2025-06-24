from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import get_current_active_user, get_current_scholar
from app.models.user import User
from app.models.comment import Comment
from app.models.recitation import Recitation
from app.schemas.comment import (
    CommentCreate, 
    Comment as CommentSchema, 
    CommentUpdate,
    CommentWithDetails
)

router = APIRouter()

@router.post("/", response_model=CommentSchema)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scholar)
):
    # Verify recitation exists
    recitation = db.query(Recitation).filter(Recitation.id == comment.recitation_id).first()
    if recitation is None:
        raise HTTPException(status_code=404, detail="Recitation not found")
    
    db_comment = Comment(
        recitation_id=comment.recitation_id,
        scholar_id=current_user.id,
        user_id=recitation.user_id,
        timestamp=comment.timestamp,
        text_comment=comment.text_comment
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.get("/recitation/{recitation_id}", response_model=List[CommentWithDetails])
def read_comments_for_recitation(
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
    
    comments = db.query(Comment).filter(Comment.recitation_id == recitation_id).all()
    return comments

@router.get("/my-comments", response_model=List[CommentWithDetails])
def read_my_comments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comments = db.query(Comment).filter(
        Comment.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return comments

@router.put("/{comment_id}", response_model=CommentSchema)
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only the comment owner (user) can mark as resolved, or scholar can edit their comment
    if comment.user_id != current_user.id and comment.scholar_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = comment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comment, field, value)
    
    db.commit()
    db.refresh(comment)
    return comment
