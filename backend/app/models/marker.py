from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Marker(Base):
    __tablename__ = "markers"

    id = Column(Integer, primary_key=True, index=True)
    recitation_id = Column(Integer, ForeignKey(
        "recitations.id"), nullable=False)
    scholar_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(Float, nullable=False)  # Timestamp in seconds
    label = Column(String, nullable=False)  # User-defined label for the marker
    description = Column(Text)  # Optional description
    # pronunciation, tajweed, rhythm, general
    category = Column(String, default="general")
    color = Column(String, default="#f59e0b")  # Hex color for UI display
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recitation = relationship("Recitation", back_populates="markers")
    scholar = relationship("User", foreign_keys=[scholar_id])


class LoopRegion(Base):
    __tablename__ = "loop_regions"

    id = Column(Integer, primary_key=True, index=True)
    recitation_id = Column(Integer, ForeignKey(
        "recitations.id"), nullable=False)
    scholar_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(Float, nullable=False)  # Start timestamp in seconds
    end_time = Column(Float, nullable=False)  # End timestamp in seconds
    label = Column(String, nullable=False)  # Label for the loop region
    color = Column(String, default="#10b981")  # Hex color for UI display
    # Whether loop is currently active
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recitation = relationship("Recitation", back_populates="loop_regions")
    scholar = relationship("User", foreign_keys=[scholar_id])
