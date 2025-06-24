from app.schemas.marker import Marker
from app.schemas.comment import Comment
from app.schemas.user import User
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.recitation import RecitationStatus


class RecitationBase(BaseModel):
    surah_name: str
    ayah_start: int
    ayah_end: int


class RecitationCreate(RecitationBase):
    audio_data: Optional[str] = None  # Base64 encoded audio
    duration: Optional[float] = None


class RecitationUpdate(BaseModel):
    status: Optional[RecitationStatus] = None


class RecitationInDB(RecitationBase):
    id: int
    user_id: int
    audio_file_path: Optional[str] = None
    duration: Optional[float] = None
    status: RecitationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Recitation(RecitationInDB):
    pass


class RecitationWithDetails(Recitation):
    user: Optional[dict] = None
    comments: Optional[List[dict]] = None
    markers: Optional[List[dict]] = None
