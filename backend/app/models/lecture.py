import enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class LectureStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"


class PublicLecture(Base):
    __tablename__ = "public_lectures"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    speaker_name = Column(String, nullable=False)
    description = Column(Text)
    topic = Column(String)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(LectureStatus), default=LectureStatus.SCHEDULED, nullable=False)
    stream_embed_url = Column(String)  # YouTube/Facebook/HLS embed URL
    recording_url = Column(String)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    community = relationship("Community")
    host = relationship("User", foreign_keys=[host_id])
    stream_targets = relationship("LectureStreamTarget", back_populates="lecture", cascade="all, delete-orphan")


class LectureStreamTarget(Base):
    __tablename__ = "lecture_stream_targets"

    id = Column(Integer, primary_key=True, index=True)
    lecture_id = Column(Integer, ForeignKey("public_lectures.id"), nullable=False)
    platform = Column(String, nullable=False)  # facebook, youtube, instagram, x, custom_rtmp
    watch_url = Column(String)                 # Public social watch URL
    rtmp_url = Column(String)                  # OBS / Restream ingest URL (manager/host only)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lecture = relationship("PublicLecture", back_populates="stream_targets")
