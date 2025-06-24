from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class UserRole(str, enum.Enum):
    USER = "user"
    SCHOLAR = "scholar"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recitations = relationship("Recitation", back_populates="user")
    comments_given = relationship(
        "Comment", foreign_keys="Comment.scholar_id", back_populates="scholar")
    comments_received = relationship(
        "Comment", foreign_keys="Comment.user_id", back_populates="user")
    created_communities = relationship(
        "Community", foreign_keys="Community.created_by", back_populates="creator")
    community_memberships = relationship(
        "CommunityMembership", back_populates="user")
    communities = relationship(
        "Community", secondary="community_memberships", back_populates="members", viewonly=True)
    donations = relationship("Donation", back_populates="user")
