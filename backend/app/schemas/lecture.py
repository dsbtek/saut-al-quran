from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.lecture import LectureStatus


class StreamTargetCreate(BaseModel):
    platform: str  # facebook, youtube, instagram, x, custom_rtmp
    watch_url: Optional[str] = None
    rtmp_url: Optional[str] = None


class StreamTargetOut(BaseModel):
    id: int
    lecture_id: int
    platform: str
    watch_url: Optional[str] = None
    rtmp_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class PublicLectureCreate(BaseModel):
    community_id: int
    title: str
    speaker_name: str
    description: Optional[str] = None
    topic: Optional[str] = None
    scheduled_at: datetime
    stream_embed_url: Optional[str] = None
    is_public: bool = True
    stream_targets: List[StreamTargetCreate] = []


class PublicLectureStatusUpdate(BaseModel):
    status: LectureStatus
    stream_embed_url: Optional[str] = None
    recording_url: Optional[str] = None


class PublicLectureOut(BaseModel):
    id: int
    community_id: int
    host_id: int
    title: str
    speaker_name: str
    description: Optional[str] = None
    topic: Optional[str] = None
    scheduled_at: datetime
    status: LectureStatus
    stream_embed_url: Optional[str] = None
    recording_url: Optional[str] = None
    is_public: bool
    created_at: datetime
    community_name: Optional[str] = None
    stream_targets: List[StreamTargetOut] = []

    class Config:
        from_attributes = True
