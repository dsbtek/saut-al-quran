from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from app.db.database import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.donation import Donation, DonationCampaign, UserFeedback, DonationStatus
from app.schemas.donation import (
    Donation as DonationSchema,
    DonationCreate,
    DonationUpdate,
    DonationCampaign as DonationCampaignSchema,
    DonationCampaignCreate,
    DonationCampaignUpdate,
    UserFeedback as UserFeedbackSchema,
    UserFeedbackCreate,
    UserFeedbackUpdate,
    PaymentInitiationResponse,
    DonationStats
)
import uuid
import secrets
from decimal import Decimal

router = APIRouter()


@router.post("/", response_model=PaymentInitiationResponse)
def initiate_donation(
    donation: DonationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Initiate a donation payment"""
    # Generate unique transaction ID
    transaction_id = f"SAQ_{uuid.uuid4().hex[:12].upper()}"
    payment_reference = f"REF_{secrets.token_hex(8).upper()}"

    # Create donation record
    db_donation = Donation(
        **donation.dict(),
        user_id=current_user.id if current_user else None,
        transaction_id=transaction_id,
        payment_reference=payment_reference,
        status=DonationStatus.PENDING
    )
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)

    # TODO: Integrate with actual payment provider (Paystack/Stripe)
    # For now, return a mock payment URL
    payment_url = f"https://payment-gateway.com/pay/{payment_reference}"

    return PaymentInitiationResponse(
        payment_url=payment_url,
        transaction_id=transaction_id,
        reference=payment_reference
    )


@router.get("/", response_model=List[DonationSchema])
def list_donations(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List user's donations"""
    query = db.query(Donation).filter(Donation.user_id == current_user.id)

    if status:
        query = query.filter(Donation.status == status)

    donations = query.order_by(desc(Donation.created_at)).offset(
        skip).limit(limit).all()
    return donations


@router.get("/public", response_model=List[DonationSchema])
def list_public_donations(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List recent public donations (non-anonymous)"""
    donations = db.query(Donation).filter(
        and_(
            Donation.status == DonationStatus.COMPLETED,
            Donation.is_anonymous == False
        )
    ).order_by(desc(Donation.completed_at)).offset(skip).limit(limit).all()
    return donations


@router.get("/stats", response_model=DonationStats)
def get_donation_stats(
    db: Session = Depends(get_db)
):
    """Get public donation statistics"""
    total_donations = db.query(func.sum(Donation.amount)).filter(
        Donation.status == DonationStatus.COMPLETED
    ).scalar() or Decimal('0')

    total_donors = db.query(func.count(func.distinct(Donation.user_id))).filter(
        Donation.status == DonationStatus.COMPLETED
    ).scalar() or 0

    # Monthly donations (current month)
    monthly_donations = db.query(func.sum(Donation.amount)).filter(
        and_(
            Donation.status == DonationStatus.COMPLETED,
            func.extract('month', Donation.completed_at) == func.extract(
                'month', func.now()),
            func.extract('year', Donation.completed_at) == func.extract(
                'year', func.now())
        )
    ).scalar() or Decimal('0')

    # Yearly donations (current year)
    yearly_donations = db.query(func.sum(Donation.amount)).filter(
        and_(
            Donation.status == DonationStatus.COMPLETED,
            func.extract('year', Donation.completed_at) == func.extract(
                'year', func.now())
        )
    ).scalar() or Decimal('0')

    # Average donation
    avg_donation = db.query(func.avg(Donation.amount)).filter(
        Donation.status == DonationStatus.COMPLETED
    ).scalar() or Decimal('0')

    # Top donation
    top_donation = db.query(func.max(Donation.amount)).filter(
        Donation.status == DonationStatus.COMPLETED
    ).scalar() or Decimal('0')

    # Recent donations count (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_donations = db.query(func.count(Donation.id)).filter(
        and_(
            Donation.status == DonationStatus.COMPLETED,
            Donation.completed_at >= thirty_days_ago
        )
    ).scalar() or 0

    return DonationStats(
        total_donations=total_donations,
        total_donors=total_donors,
        monthly_donations=monthly_donations,
        yearly_donations=yearly_donations,
        average_donation=avg_donation,
        top_donation=top_donation,
        recent_donations=recent_donations
    )


@router.put("/{donation_id}", response_model=DonationSchema)
def update_donation(
    donation_id: int,
    donation_update: DonationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update donation status (Admin only)"""
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    for field, value in donation_update.dict(exclude_unset=True).items():
        setattr(donation, field, value)

    db.commit()
    db.refresh(donation)
    return donation

# Donation Campaigns


@router.post("/campaigns/", response_model=DonationCampaignSchema)
def create_campaign(
    campaign: DonationCampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a donation campaign (Admin only)"""
    db_campaign = DonationCampaign(
        **campaign.dict(),
        created_by=current_user.id
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign


@router.get("/campaigns/", response_model=List[DonationCampaignSchema])
def list_campaigns(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List donation campaigns"""
    query = db.query(DonationCampaign)

    if active_only:
        query = query.filter(DonationCampaign.is_active == True)

    campaigns = query.order_by(desc(DonationCampaign.created_at)).offset(
        skip).limit(limit).all()

    # Calculate progress percentage for each campaign
    for campaign in campaigns:
        if campaign.target_amount and campaign.target_amount > 0:
            campaign.progress_percentage = float(
                campaign.current_amount / campaign.target_amount * 100)
        else:
            campaign.progress_percentage = 0

    return campaigns

# User Feedback


@router.post("/feedback/", response_model=UserFeedbackSchema)
def submit_feedback(
    feedback: UserFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Submit user feedback"""
    db_feedback = UserFeedback(
        **feedback.dict(),
        user_id=current_user.id if current_user else None
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@router.get("/feedback/", response_model=List[UserFeedbackSchema])
def list_feedback(
    skip: int = 0,
    limit: int = 100,
    feedback_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """List user feedback (Admin only)"""
    query = db.query(UserFeedback)

    if feedback_type:
        query = query.filter(UserFeedback.feedback_type == feedback_type)

    if status:
        query = query.filter(UserFeedback.status == status)

    feedback_list = query.order_by(
        desc(UserFeedback.created_at)).offset(skip).limit(limit).all()
    return feedback_list


@router.put("/feedback/{feedback_id}", response_model=UserFeedbackSchema)
def update_feedback(
    feedback_id: int,
    feedback_update: UserFeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update feedback status (Admin only)"""
    feedback = db.query(UserFeedback).filter(
        UserFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    for field, value in feedback_update.dict(exclude_unset=True).items():
        setattr(feedback, field, value)

    if feedback_update.admin_response:
        feedback.resolved_by = current_user.id
        feedback.resolved_at = func.now()

    db.commit()
    db.refresh(feedback)
    return feedback
