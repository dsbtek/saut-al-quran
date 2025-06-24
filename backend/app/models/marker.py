from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Marker(Base):
    __tablename__ = "markers"

    id = Column(Integer, primary_key=True, index=True)
    recitation_id = Column(Integer, ForeignKey("recitations.id"), nullable=False)
    timestamp = Column(Float, nullable=False)  # Timestamp in seconds
    label = Column(String, nullable=False)  # User-defined label for the marker
    description = Column(String)  # Optional description
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recitation = relationship("Recitation", back_populates="markers")
