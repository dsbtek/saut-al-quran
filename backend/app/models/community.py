from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    address = Column(Text)
    location = Column(String)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_communities")
    memberships = relationship("CommunityMembership", back_populates="community", cascade="all, delete-orphan")
    members = relationship("User", secondary="community_memberships", back_populates="communities", viewonly=True)

class CommunityMembership(Base):
    __tablename__ = "community_memberships"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # member, scholar, admin
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True))

    # Relationships
    community = relationship("Community", back_populates="memberships")
    user = relationship("User", back_populates="community_memberships")

class CommunityInvitation(Base):
    __tablename__ = "community_invitations"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, default="member")
    token = Column(String, unique=True, nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    community = relationship("Community")
    inviter = relationship("User")
