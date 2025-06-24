from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.db.database import get_db
from app.core.deps import get_current_user, get_current_admin_or_scholar
from app.models.user import User, UserRole
from app.models.community import Community, CommunityMembership
from app.schemas.community import (
    Community as CommunitySchema,
    CommunityCreate,
    CommunityUpdate,
    CommunityWithMembers,
    CommunityMembershipCreate,
    CommunityMembershipUpdate,
    CommunityJoinRequest,
    CommunityStats
)

router = APIRouter()


@router.post("/", response_model=CommunitySchema)
def create_community(
    community: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_scholar)
):
    """Create a new community (Admin or Scholar only)"""
    db_community = Community(
        **community.dict(),
        created_by=current_user.id
    )
    db.add(db_community)
    db.commit()
    db.refresh(db_community)

    # Add creator as admin member
    membership = CommunityMembership(
        community_id=db_community.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(membership)
    db.commit()

    return db_community


@router.get("/", response_model=List[CommunitySchema])
def list_communities(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active communities"""
    query = db.query(Community).filter(Community.is_active == True)

    if search:
        query = query.filter(
            or_(
                Community.name.ilike(f"%{search}%"),
                Community.description.ilike(f"%{search}%"),
                Community.location.ilike(f"%{search}%")
            )
        )

    communities = query.offset(skip).limit(limit).all()
    return communities


@router.get("/my-communities", response_model=List[CommunityWithMembers])
def get_my_communities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get communities where current user is a member"""
    memberships = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.user_id == current_user.id,
            CommunityMembership.is_active == True
        )
    ).all()

    communities = []
    for membership in memberships:
        community = membership.community
        # Add member counts
        member_count = db.query(CommunityMembership).filter(
            and_(
                CommunityMembership.community_id == community.id,
                CommunityMembership.is_active == True
            )
        ).count()

        scholar_count = db.query(CommunityMembership).join(User).filter(
            and_(
                CommunityMembership.community_id == community.id,
                CommunityMembership.is_active == True,
                or_(User.role == UserRole.SCHOLAR, User.role == UserRole.ADMIN)
            )
        ).count()

        community_dict = community.__dict__.copy()
        community_dict['member_count'] = member_count
        community_dict['scholar_count'] = scholar_count
        communities.append(community_dict)

    return communities


@router.get("/{community_id}", response_model=CommunityWithMembers)
def get_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get community details"""
    community = db.query(Community).filter(
        Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Check if user has access (member or public view)
    membership = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == current_user.id,
            CommunityMembership.is_active == True
        )
    ).first()

    # Get member counts
    member_count = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.is_active == True
        )
    ).count()

    scholar_count = db.query(CommunityMembership).join(User).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.is_active == True,
            or_(User.role == UserRole.SCHOLAR, User.role == UserRole.ADMIN)
        )
    ).count()

    community_dict = community.__dict__.copy()
    community_dict['member_count'] = member_count
    community_dict['scholar_count'] = scholar_count

    # Include members list if user is a member
    if membership:
        members = db.query(User).join(CommunityMembership).filter(
            and_(
                CommunityMembership.community_id == community_id,
                CommunityMembership.is_active == True
            )
        ).all()
        community_dict['members'] = members

    return community_dict


@router.put("/{community_id}", response_model=CommunitySchema)
def update_community(
    community_id: int,
    community_update: CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update community (Admin or community admin only)"""
    community = db.query(Community).filter(
        Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Check permissions
    if current_user.role != UserRole.ADMIN:
        membership = db.query(CommunityMembership).filter(
            and_(
                CommunityMembership.community_id == community_id,
                CommunityMembership.user_id == current_user.id,
                CommunityMembership.role == "admin",
                CommunityMembership.is_active == True
            )
        ).first()
        if not membership:
            raise HTTPException(
                status_code=403, detail="Not authorized to update this community")

    # Update community
    for field, value in community_update.dict(exclude_unset=True).items():
        setattr(community, field, value)

    db.commit()
    db.refresh(community)
    return community


@router.post("/{community_id}/join", response_model=dict)
def join_community(
    community_id: int,
    join_request: CommunityJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join a community"""
    community = db.query(Community).filter(
        Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Check if already a member
    existing_membership = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == current_user.id
        )
    ).first()

    if existing_membership:
        if existing_membership.is_active:
            raise HTTPException(
                status_code=400, detail="Already a member of this community")
        else:
            # Reactivate membership
            existing_membership.is_active = True
            existing_membership.left_at = None
            db.commit()
            return {"message": "Successfully rejoined the community"}

    # Create new membership
    membership = CommunityMembership(
        community_id=community_id,
        user_id=current_user.id,
        role="member"
    )
    db.add(membership)
    db.commit()

    return {"message": "Successfully joined the community"}


@router.delete("/{community_id}/leave", response_model=dict)
def leave_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Leave a community"""
    membership = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == current_user.id,
            CommunityMembership.is_active == True
        )
    ).first()

    if not membership:
        raise HTTPException(
            status_code=404, detail="Not a member of this community")

    # Deactivate membership
    membership.is_active = False
    membership.left_at = func.now()
    db.commit()

    return {"message": "Successfully left the community"}


@router.get("/{community_id}/stats", response_model=CommunityStats)
def get_community_stats(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get community statistics"""
    community = db.query(Community).filter(
        Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Check if user has access
    membership = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == current_user.id,
            CommunityMembership.is_active == True
        )
    ).first()

    if not membership and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="Not authorized to view community stats")

    # Calculate stats
    total_members = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.is_active == True
        )
    ).count()

    total_scholars = db.query(CommunityMembership).join(User).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.is_active == True,
            or_(User.role == UserRole.SCHOLAR, User.role == UserRole.ADMIN)
        )
    ).count()

    # TODO: Add recitation and review stats when recitation model is updated

    return CommunityStats(
        total_members=total_members,
        total_scholars=total_scholars,
        total_recitations=0,  # Placeholder
        pending_reviews=0,    # Placeholder
        active_members=total_members
    )
