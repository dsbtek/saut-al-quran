from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    recitation_id = Column(Integer, ForeignKey("recitations.id"), nullable=False)
    scholar_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # The user who owns the recitation
    timestamp = Column(Float, nullable=False)  # Timestamp in seconds where comment applies
    text_comment = Column(Text)
    audio_comment_path = Column(String)  # Path to audio feedback file
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recitation = relationship("Recitation", back_populates="comments")
    scholar = relationship("User", foreign_keys=[scholar_id], back_populates="comments_given")
    user = relationship("User", foreign_keys=[user_id], back_populates="comments_received")
