from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CommentBase(BaseModel):
    timestamp: float
    text_comment: Optional[str] = None

class CommentCreate(CommentBase):
    recitation_id: int
    audio_comment_data: Optional[str] = None  # Base64 encoded audio

class CommentUpdate(BaseModel):
    text_comment: Optional[str] = None
    is_resolved: Optional[bool] = None

class CommentInDB(CommentBase):
    id: int
    recitation_id: int
    scholar_id: int
    user_id: int
    audio_comment_path: Optional[str] = None
    is_resolved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Comment(CommentInDB):
    pass

class CommentWithDetails(Comment):
    scholar: Optional[dict] = None
    recitation: Optional[dict] = None
