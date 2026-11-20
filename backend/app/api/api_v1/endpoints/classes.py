from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.community import Community, CommunityMembership
from app.models.islamiyya_class import IslamiyyaClass, ClassEnrollment, ClassCategory, IslamicSubject
from app.schemas.islamiyya_class import (
    IslamiyyaClassCreate,
    IslamiyyaClassUpdate,
    IslamiyyaClassOut,
    ClassEnrollmentOut,
    EnrollmentDecisionRequest,
)

router = APIRouter()


def _can_manage_community_classes(db: Session, community_id: int, user: User) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    membership = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == community_id,
        CommunityMembership.user_id == user.id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
        CommunityMembership.role.in_(["admin", "scholar"]),
    ).first()
    return membership is not None


def _serialize_enrollment(e: ClassEnrollment) -> dict:
    return {
        "id": e.id,
        "class_id": e.class_id,
        "student_id": e.student_id,
        "status": e.status,
        "created_at": e.created_at,
        "student": {
            "id": e.student.id,
            "username": e.student.username,
            "full_name": e.student.full_name,
        } if e.student else None,
    }


def _serialize_class(db: Session, cls: IslamiyyaClass, current_user: User, include_enrollments: bool = False) -> dict:
    enrollments = cls.enrollments or []
    enrolled_count = sum(1 for e in enrollments if e.status == "approved")
    pending_count = sum(1 for e in enrollments if e.status == "pending")
    my_enrollment = next((e for e in enrollments if e.student_id == current_user.id), None)

    data = {
        "id": cls.id,
        "community_id": cls.community_id,
        "scholar_id": cls.scholar_id,
        "created_by": cls.created_by,
        "title": cls.title,
        "description": cls.description,
        "subject": cls.subject,
        "category": cls.category,
        "schedule_days": cls.schedule_days,
        "start_time": cls.start_time,
        "end_time": cls.end_time,
        "surah_focus": cls.surah_focus,
        "max_students": cls.max_students,
        "is_active": cls.is_active,
        "created_at": cls.created_at,
        "scholar": {
            "id": cls.scholar.id,
            "username": cls.scholar.username,
            "full_name": cls.scholar.full_name,
        } if cls.scholar else None,
        "enrolled_count": enrolled_count,
        "pending_count": pending_count,
        "my_enrollment_status": my_enrollment.status if my_enrollment else None,
        "enrollments": None,
    }
    if include_enrollments:
        data["enrollments"] = [_serialize_enrollment(e) for e in enrollments]
    return data


@router.post("/", response_model=IslamiyyaClassOut)
def create_class(
    class_in: IslamiyyaClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create & schedule an Islamiyya class (Manager, Admin, or accepted Scholar)."""
    community = db.query(Community).filter(Community.id == class_in.community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if not _can_manage_community_classes(db, class_in.community_id, current_user):
        raise HTTPException(
            status_code=403,
            detail="Only Islamiyya Managers or accepted Scholars can create classes",
        )

    scholar_id = class_in.scholar_id or current_user.id
    db_class = IslamiyyaClass(
        community_id=class_in.community_id,
        scholar_id=scholar_id,
        created_by=current_user.id,
        title=class_in.title,
        description=class_in.description,
        subject=class_in.subject,
        category=class_in.category,
        schedule_days=class_in.schedule_days,
        start_time=class_in.start_time,
        end_time=class_in.end_time,
        surah_focus=class_in.surah_focus,
        max_students=class_in.max_students,
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return _serialize_class(db, db_class, current_user, include_enrollments=True)


@router.get("/community/{community_id}", response_model=List[IslamiyyaClassOut])
def list_community_classes(
    community_id: int,
    category: Optional[ClassCategory] = None,
    subject: Optional[IslamicSubject] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List classes for an Islamiyya, optionally filtered by category or Islamic subject."""
    query = db.query(IslamiyyaClass).filter(
        IslamiyyaClass.community_id == community_id,
        IslamiyyaClass.is_active == True,
    )
    if category is not None:
        query = query.filter(IslamiyyaClass.category == category)
    if subject is not None:
        query = query.filter(IslamiyyaClass.subject == subject)

    classes = query.all()
    can_manage = _can_manage_community_classes(db, community_id, current_user)
    return [_serialize_class(db, c, current_user, include_enrollments=can_manage) for c in classes]


@router.get("/my-classes", response_model=List[IslamiyyaClassOut])
def get_my_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get classes the current user is enrolled in or teaching."""
    enrolled_ids = [
        e.class_id
        for e in db.query(ClassEnrollment)
        .filter(ClassEnrollment.student_id == current_user.id)
        .all()
    ]
    teaching = db.query(IslamiyyaClass).filter(IslamiyyaClass.scholar_id == current_user.id).all()
    enrolled = (
        db.query(IslamiyyaClass).filter(IslamiyyaClass.id.in_(enrolled_ids)).all()
        if enrolled_ids
        else []
    )
    seen = {}
    for c in teaching + enrolled:
        seen[c.id] = _serialize_class(db, c, current_user, include_enrollments=(c.scholar_id == current_user.id))
    return list(seen.values())


@router.post("/{class_id}/enroll", response_model=ClassEnrollmentOut)
def request_class_enrollment(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Student requests to enroll in an Islamiyya class."""
    cls = db.query(IslamiyyaClass).filter(IslamiyyaClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Must be an approved member of the Islamiyya
    membership = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == cls.community_id,
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
    ).first()
    if not membership and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="You must be an approved member of this Islamiyya first")

    existing = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == class_id,
        ClassEnrollment.student_id == current_user.id,
    ).first()
    if existing:
        if existing.status in ("pending", "approved"):
            raise HTTPException(status_code=400, detail=f"Enrollment already {existing.status}")
        existing.status = "pending"
        db.commit()
        db.refresh(existing)
        return _serialize_enrollment(existing)

    enrollment = ClassEnrollment(
        class_id=class_id,
        student_id=current_user.id,
        status="pending",
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return _serialize_enrollment(enrollment)


@router.post("/{class_id}/enrollments/{enrollment_id}/decide", response_model=ClassEnrollmentOut)
def decide_class_enrollment(
    class_id: int,
    enrollment_id: int,
    body: EnrollmentDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Accepted Scholar or Islamiyya Manager approves or rejects a student enrollment."""
    cls = db.query(IslamiyyaClass).filter(IslamiyyaClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    if not _can_manage_community_classes(db, cls.community_id, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to manage enrollments")

    enrollment = db.query(ClassEnrollment).filter(
        ClassEnrollment.id == enrollment_id,
        ClassEnrollment.class_id == class_id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment request not found")

    if body.decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Decision must be 'approve' or 'reject'")

    enrollment.status = "approved" if body.decision == "approve" else "rejected"
    enrollment.reviewed_by = current_user.id
    enrollment.reviewed_at = func.now()
    db.commit()
    db.refresh(enrollment)
    return _serialize_enrollment(enrollment)
