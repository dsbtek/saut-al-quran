from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.donation import DonationStatus, DonationType, PaymentProvider

class DonationBase(BaseModel):
    amount: Decimal
    currency: str = "NGN"
    donation_type: DonationType = DonationType.ONE_TIME
    payment_provider: PaymentProvider
    donor_name: Optional[str] = None
    donor_email: Optional[EmailStr] = None
    donor_phone: Optional[str] = None
    message: Optional[str] = None
    is_anonymous: bool = False
    recurring_interval: Optional[str] = None

    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class DonationCreate(DonationBase):
    pass

class DonationUpdate(BaseModel):
    status: Optional[DonationStatus] = None
    payment_reference: Optional[str] = None
    payment_url: Optional[str] = None
    completed_at: Optional[datetime] = None

class Donation(DonationBase):
    id: int
    user_id: Optional[int] = None
    status: DonationStatus
    transaction_id: str
    payment_reference: Optional[str] = None
    payment_url: Optional[str] = None
    next_payment_date: Optional[datetime] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DonationCampaignBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: Optional[Decimal] = None
    currency: str = "NGN"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class DonationCampaignCreate(DonationCampaignBase):
    pass

class DonationCampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[Decimal] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class DonationCampaign(DonationCampaignBase):
    id: int
    current_amount: Decimal
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    progress_percentage: Optional[float] = None

    class Config:
        from_attributes = True

class UserFeedbackBase(BaseModel):
    feedback_type: str  # bug_report, feature_request, general
    title: str
    description: str
    priority: str = "medium"
    contact_email: Optional[EmailStr] = None
    contact_name: Optional[str] = None
    browser_info: Optional[str] = None
    device_info: Optional[str] = None

class UserFeedbackCreate(UserFeedbackBase):
    pass

class UserFeedbackUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    admin_response: Optional[str] = None

class UserFeedback(UserFeedbackBase):
    id: int
    user_id: Optional[int] = None
    status: str
    admin_response: Optional[str] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentInitiationResponse(BaseModel):
    payment_url: str
    transaction_id: str
    reference: str

class DonationStats(BaseModel):
    total_donations: Decimal
    total_donors: int
    monthly_donations: Decimal
    yearly_donations: Decimal
    average_donation: Decimal
    top_donation: Decimal
    recent_donations: int
