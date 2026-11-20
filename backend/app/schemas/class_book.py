from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ClassBookOut(BaseModel):
    id: int
    class_id: int
    uploaded_by: int
    title: str
    author: Optional[str] = None
    description: Optional[str] = None
    session_name: str
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    is_free: bool
    price: Decimal
    currency: str
    file_path: Optional[str] = None
    external_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    has_access: bool = False
    purchase_status: Optional[str] = None
    purchase_id: Optional[int] = None

    class Config:
        from_attributes = True


class BookPurchaseCreate(BaseModel):
    payment_provider: str = "paystack"  # paystack, stripe, bank_transfer


class BookPurchaseOut(BaseModel):
    id: int
    book_id: int
    user_id: int
    amount: Decimal
    currency: str
    payment_provider: str
    transaction_id: str
    status: str
    purchased_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
