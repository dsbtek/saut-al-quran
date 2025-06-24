from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.schemas.user import User

class CommunityBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None

class CommunityCreate(CommunityBase):
    pass

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class CommunityMembershipBase(BaseModel):
    role: str = "member"

class CommunityMembershipCreate(CommunityMembershipBase):
    user_id: int
    community_id: int

class CommunityMembershipUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

class CommunityMembership(CommunityMembershipBase):
    id: int
    community_id: int
    user_id: int
    is_active: bool
    joined_at: datetime
    left_at: Optional[datetime] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True

class Community(CommunityBase):
    id: int
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[User] = None
    memberships: Optional[List[CommunityMembership]] = None

    class Config:
        from_attributes = True

class CommunityWithMembers(Community):
    members: Optional[List[User]] = None
    member_count: Optional[int] = None
    scholar_count: Optional[int] = None

class CommunityInvitationBase(BaseModel):
    email: EmailStr
    role: str = "member"

class CommunityInvitationCreate(CommunityInvitationBase):
    community_id: int

class CommunityInvitation(CommunityInvitationBase):
    id: int
    community_id: int
    invited_by: int
    token: str
    is_used: bool
    expires_at: datetime
    created_at: datetime
    community: Optional[Community] = None
    inviter: Optional[User] = None

    class Config:
        from_attributes = True

class CommunityJoinRequest(BaseModel):
    community_id: int
    message: Optional[str] = None

class CommunityStats(BaseModel):
    total_members: int
    total_scholars: int
    total_recitations: int
    pending_reviews: int
    active_members: int
