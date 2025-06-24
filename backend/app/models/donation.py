from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Numeric, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class DonationStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class DonationType(str, enum.Enum):
    ONE_TIME = "one_time"
    RECURRING = "recurring"

class PaymentProvider(str, enum.Enum):
    PAYSTACK = "paystack"
    STRIPE = "stripe"
    BANK_TRANSFER = "bank_transfer"

class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Allow anonymous donations
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="NGN")
    donation_type = Column(Enum(DonationType), default=DonationType.ONE_TIME)
    status = Column(Enum(DonationStatus), default=DonationStatus.PENDING)
    payment_provider = Column(Enum(PaymentProvider), nullable=False)
    
    # Payment details
    transaction_id = Column(String, unique=True, nullable=False)
    payment_reference = Column(String, unique=True)
    payment_url = Column(String)
    
    # Donor information (for anonymous donations)
    donor_name = Column(String)
    donor_email = Column(String)
    donor_phone = Column(String)
    
    # Additional information
    message = Column(Text)  # Optional message from donor
    is_anonymous = Column(Boolean, default=False)
    
    # Recurring donation details
    recurring_interval = Column(String)  # monthly, yearly
    next_payment_date = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="donations")

class DonationCampaign(Base):
    __tablename__ = "donation_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    target_amount = Column(Numeric(10, 2))
    current_amount = Column(Numeric(10, 2), default=0)
    currency = Column(String, default="NGN")
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User")

class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Allow anonymous feedback
    feedback_type = Column(String, nullable=False)  # bug_report, feature_request, general
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, default="medium")  # low, medium, high, critical
    status = Column(String, default="open")  # open, in_progress, resolved, closed
    
    # Contact information (for anonymous feedback)
    contact_email = Column(String)
    contact_name = Column(String)
    
    # Additional details
    browser_info = Column(Text)
    device_info = Column(Text)
    screenshot_url = Column(String)
    
    # Admin response
    admin_response = Column(Text)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    resolver = relationship("User", foreign_keys=[resolved_by])
