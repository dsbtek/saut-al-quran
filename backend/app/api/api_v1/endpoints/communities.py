from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.db.database import get_db
from app.core.deps import get_current_user, get_current_manager_or_admin
from app.models.user import User, UserRole
from app.models.community import Community, CommunityMembership
from app.schemas.community import (
    Community as CommunitySchema,
    CommunityCreate,
    CommunityUpdate,
    CommunityWithMembers,
    CommunityJoinRequest,
    CommunityMembership as CommunityMembershipSchema,
    MembershipDecisionRequest,
    CommunityStats,
)

router = APIRouter()


def _is_community_manager(db: Session, community_id: int, user: User) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if user.role == UserRole.ISLAM_MANAGER:
        m = db.query(CommunityMembership).filter(
            CommunityMembership.community_id == community_id,
            CommunityMembership.user_id == user.id,
            CommunityMembership.status == "approved",
            CommunityMembership.is_active == True,
        ).first()
        community = db.query(Community).filter(Community.id == community_id).first()
        return bool(m and m.role == "admin") or bool(community and community.created_by == user.id)
    m = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.user_id == user.id,
        CommunityMembership.role == "admin",
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
    ).first()
    return m is not None


def _is_community_scholar(db: Session, community_id: int, user: User) -> bool:
    m = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.user_id == user.id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
        CommunityMembership.role.in_(["scholar", "admin"]),
    ).first()
    return m is not None


@router.post("/", response_model=CommunitySchema)
def create_community(
    community: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin),
):
    """Create a new Islamiyya community (Admin or approved Islamiyya Manager only)."""
    db_community = Community(**community.dict(), created_by=current_user.id)
    db.add(db_community)
    db.commit()
    db.refresh(db_community)

    membership = CommunityMembership(
        community_id=db_community.id,
        user_id=current_user.id,
        role="admin",
        requested_role="admin",
        status="approved",
        reviewed_by=current_user.id,
        reviewed_at=func.now(),
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
    current_user: User = Depends(get_current_user),
):
    """List all active Islamiyya communities."""
    query = db.query(Community).filter(Community.is_active == True)
    if search:
        query = query.filter(
            or_(
                Community.name.ilike(f"%{search}%"),
                Community.description.ilike(f"%{search}%"),
                Community.location.ilike(f"%{search}%"),
            )
        )
    return query.offset(skip).limit(limit).all()


@router.get("/my-communities", response_model=List[CommunityWithMembers])
def get_my_communities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get communities where current user is an approved member."""
    memberships = db.query(CommunityMembership).filter(
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
    ).all()

    communities = []
    for membership in memberships:
        community = membership.community
        member_count = db.query(CommunityMembership).filter(
            CommunityMembership.community_id == community.id,
            CommunityMembership.status == "approved",
            CommunityMembership.is_active == True,
        ).count()
        scholar_count = db.query(CommunityMembership).filter(
            CommunityMembership.community_id == community.id,
            CommunityMembership.status == "approved",
            CommunityMembership.is_active == True,
            CommunityMembership.role.in_(["scholar", "admin"]),
        ).count()

        community_dict = community.__dict__.copy()
        community_dict["member_count"] = member_count
        community_dict["scholar_count"] = scholar_count
        communities.append(community_dict)

    return communities


@router.get("/my-requests", response_model=List[CommunityMembershipSchema])
def get_my_join_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all community join requests submitted by the current user."""
    return db.query(CommunityMembership).filter(
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.is_active == True,
    ).all()


@router.get("/{community_id}", response_model=CommunityWithMembers)
def get_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    membership = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
    ).first()

    member_count = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
    ).count()

    scholar_count = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
        CommunityMembership.role.in_(["scholar", "admin"]),
    ).count()

    community_dict = community.__dict__.copy()
    community_dict["member_count"] = member_count
    community_dict["scholar_count"] = scholar_count

    if membership or current_user.role == UserRole.ADMIN:
        approved_memberships = db.query(CommunityMembership).filter(
            CommunityMembership.community_id == community_id,
            CommunityMembership.status == "approved",
            CommunityMembership.is_active == True,
        ).all()
        community_dict["memberships"] = approved_memberships
        community_dict["members"] = [m.user for m in approved_memberships if m.user]

    return community_dict


@router.put("/{community_id}", response_model=CommunitySchema)
def update_community(
    community_id: int,
    community_update: CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if not _is_community_manager(db, community_id, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update this community")

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
    current_user: User = Depends(get_current_user),
):
    """Submit a request to join an Islamiyya community as a student or scholar."""
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    req_role = join_request.requested_role if join_request.requested_role in ("member", "scholar") else "member"

    existing = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.user_id == current_user.id,
    ).first()

    if existing:
        if existing.is_active and existing.status == "approved":
            raise HTTPException(status_code=400, detail="Already an approved member of this community")
        if existing.is_active and existing.status == "pending":
            raise HTTPException(status_code=400, detail="Your join request is already pending approval")
        existing.is_active = True
        existing.status = "pending"
        existing.requested_role = req_role
        existing.request_message = join_request.message
        existing.left_at = None
        db.commit()
        return {"message": "Join request submitted for approval", "status": "pending"}

    membership = CommunityMembership(
        community_id=community_id,
        user_id=current_user.id,
        role="member",
        requested_role=req_role,
        status="pending",
        request_message=join_request.message,
    )
    db.add(membership)
    db.commit()
    return {"message": "Join request submitted for approval", "status": "pending"}


@router.get("/{community_id}/requests", response_model=List[CommunityMembershipSchema])
def list_community_join_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pending join requests for an Islamiyya (Managers see all; Scholars see student requests)."""
    is_mgr = _is_community_manager(db, community_id, current_user)
    is_sch = _is_community_scholar(db, community_id, current_user)
    if not is_mgr and not is_sch:
        raise HTTPException(status_code=403, detail="Not authorized to view join requests")

    query = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.status == "pending",
        CommunityMembership.is_active == True,
    )
    if not is_mgr:
        query = query.filter(CommunityMembership.requested_role == "member")

    return query.all()


@router.post("/{community_id}/requests/{membership_id}/decide", response_model=CommunityMembershipSchema)
def decide_community_request(
    community_id: int,
    membership_id: int,
    body: MembershipDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve or reject a pending scholar/student join request."""
    is_mgr = _is_community_manager(db, community_id, current_user)
    is_sch = _is_community_scholar(db, community_id, current_user)
    if not is_mgr and not is_sch:
        raise HTTPException(status_code=403, detail="Not authorized to review join requests")

    membership = db.query(CommunityMembership).filter(
        CommunityMembership.id == membership_id,
        CommunityMembership.community_id == community_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Join request not found")

    # Only managers/admins can approve scholar requests
    if membership.requested_role == "scholar" and not is_mgr:
        raise HTTPException(status_code=403, detail="Only Islamiyya Managers can approve scholar requests")

    if body.decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Decision must be 'approve' or 'reject'")

    if body.decision == "approve":
        membership.status = "approved"
        membership.role = body.assigned_role or membership.requested_role or "member"
        membership.is_active = True
        # Promote user's global role to SCHOLAR if approved as scholar and currently USER
        if membership.role == "scholar" and membership.user and membership.user.role == UserRole.USER:
            membership.user.role = UserRole.SCHOLAR
    else:
        membership.status = "rejected"
        membership.is_active = False

    membership.reviewed_by = current_user.id
    membership.reviewed_at = func.now()
    db.commit()
    db.refresh(membership)
    return membership


@router.delete("/{community_id}/leave", response_model=dict)
def leave_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.is_active == True,
    ).first()

    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this community")

    membership.is_active = False
    membership.left_at = func.now()
    db.commit()
    return {"message": "Successfully left the community"}


@router.get("/{community_id}/stats", response_model=CommunityStats)
def get_community_stats(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    total_members = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
    ).count()

    total_scholars = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
        CommunityMembership.role.in_(["scholar", "admin"]),
    ).count()

    return CommunityStats(
        total_members=total_members,
        total_scholars=total_scholars,
        total_recitations=0,
        pending_reviews=0,
        active_members=total_members,
    )
