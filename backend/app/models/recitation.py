from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class RecitationStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    NEEDS_REVISION = "needs_revision"


class Recitation(Base):
    __tablename__ = "recitations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    surah_name = Column(String, nullable=False)
    ayah_start = Column(Integer, nullable=False)
    ayah_end = Column(Integer, nullable=False)
    audio_file_path = Column(String)  # Path to stored audio file
    audio_data = Column(Text)  # Base64 encoded audio data (for smaller files)
    duration = Column(Float)  # Duration in seconds
    status = Column(Enum(RecitationStatus), default=RecitationStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="recitations")
    comments = relationship("Comment", back_populates="recitation")
    markers = relationship("Marker", back_populates="recitation")
    loop_regions = relationship("LoopRegion", back_populates="recitation")
