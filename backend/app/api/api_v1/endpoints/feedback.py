from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.core import deps
from app.models.user import User
from app.models.donation import UserFeedback
from app.schemas.donation import (
    UserFeedbackCreate,
    UserFeedback as UserFeedbackResponse,
    UserFeedbackUpdate
)
from app.db.database import get_db

router = APIRouter()


@router.post("/", response_model=UserFeedbackResponse)
def create_feedback(
    *,
    db: Session = Depends(get_db),
    feedback_in: UserFeedbackCreate,
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
) -> UserFeedback:
    """
    Create new user feedback.
    Can be submitted anonymously or by authenticated users.
    """
    feedback_data = feedback_in.dict()
    if current_user:
        feedback_data["user_id"] = current_user.id

    # Map schema field to model field
    if "category" in feedback_data:
        feedback_data["feedback_type"] = feedback_data.pop("category")

    feedback = UserFeedback(**feedback_data)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/", response_model=List[UserFeedbackResponse])
def get_feedback_list(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
) -> List[UserFeedback]:
    """
    Get feedback list. Requires authentication.
    Only admins can see all feedback, users can only see their own.
    """
    query = db.query(UserFeedback)

    # Non-admin users can only see their own feedback
    if current_user.role != "admin":
        query = query.filter(UserFeedback.user_id == current_user.id)

    # Apply filters
    if category:
        query = query.filter(UserFeedback.feedback_type == category)
    if priority:
        query = query.filter(UserFeedback.priority == priority)
    if status:
        query = query.filter(UserFeedback.status == status)
    if search:
        query = query.filter(
            or_(
                UserFeedback.title.ilike(f"%{search}%"),
                UserFeedback.description.ilike(f"%{search}%")
            )
        )

    return query.offset(skip).limit(limit).all()


@router.get("/{feedback_id}", response_model=UserFeedbackResponse)
def get_feedback(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> UserFeedback:
    """
    Get specific feedback by ID.
    """
    feedback = db.query(UserFeedback).filter(
        UserFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    # Non-admin users can only see their own feedback
    if current_user.role != "admin" and feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return feedback


@router.put("/{feedback_id}", response_model=UserFeedbackResponse)
def update_feedback(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    feedback_in: UserFeedbackUpdate,
    current_user: User = Depends(deps.get_current_active_user)
) -> UserFeedback:
    """
    Update feedback. Only admins can update feedback status and admin response.
    Users can only update their own feedback if it's still open.
    """
    feedback = db.query(UserFeedback).filter(
        UserFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    # Check permissions
    if current_user.role == "admin":
        # Admins can update any feedback
        update_data = feedback_in.dict(exclude_unset=True)
    else:
        # Users can only update their own feedback and only certain fields
        if feedback.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        if feedback.status != "open":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update closed feedback"
            )
        # Users can only update title and description
        update_data = feedback_in.dict(exclude_unset=True, include={
                                       "title", "description"})

    for field, value in update_data.items():
        setattr(feedback, field, value)

    db.commit()
    db.refresh(feedback)
    return feedback


@router.delete("/{feedback_id}")
def delete_feedback(
    *,
    db: Session = Depends(get_db),
    feedback_id: int,
    current_user: User = Depends(deps.get_current_active_user)
) -> dict:
    """
    Delete feedback. Only admins or feedback owners can delete.
    """
    feedback = db.query(UserFeedback).filter(
        UserFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    # Check permissions
    if current_user.role != "admin" and feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    db.delete(feedback)
    db.commit()
    return {"message": "Feedback deleted successfully"}


@router.get("/stats/summary")
def get_feedback_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> dict:
    """
    Get feedback statistics. Only admins can access this.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    total_feedback = db.query(func.count(UserFeedback.id)).scalar() or 0
    open_feedback = db.query(func.count(UserFeedback.id)).filter(
        UserFeedback.status == "open"
    ).scalar() or 0
    in_progress_feedback = db.query(func.count(UserFeedback.id)).filter(
        UserFeedback.status == "in_progress"
    ).scalar() or 0
    resolved_feedback = db.query(func.count(UserFeedback.id)).filter(
        UserFeedback.status == "resolved"
    ).scalar() or 0

    # Feedback by category
    bug_reports = db.query(func.count(UserFeedback.id)).filter(
        UserFeedback.feedback_type == "bug_report"
    ).scalar() or 0
    feature_requests = db.query(func.count(UserFeedback.id)).filter(
        UserFeedback.feedback_type == "feature_request"
    ).scalar() or 0
    general_feedback = db.query(func.count(UserFeedback.id)).filter(
        UserFeedback.feedback_type == "general"
    ).scalar() or 0

    # High priority feedback
    high_priority = db.query(func.count(UserFeedback.id)).filter(
        UserFeedback.priority == "high"
    ).scalar() or 0

    return {
        "total_feedback": total_feedback,
        "open_feedback": open_feedback,
        "in_progress_feedback": in_progress_feedback,
        "resolved_feedback": resolved_feedback,
        "bug_reports": bug_reports,
        "feature_requests": feature_requests,
        "general_feedback": general_feedback,
        "high_priority": high_priority
    }
