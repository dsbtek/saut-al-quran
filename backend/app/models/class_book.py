from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class ClassBook(Base):
    __tablename__ = "class_books"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("islamiyya_classes.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    author = Column(String)
    description = Column(Text)
    session_name = Column(String, nullable=False)  # e.g., "2026 Term 1"
    available_from = Column(DateTime(timezone=True), nullable=True)
    available_until = Column(DateTime(timezone=True), nullable=True)
    is_free = Column(Boolean, default=True, nullable=False)
    price = Column(Numeric(10, 2), default=0)
    currency = Column(String, default="NGN")
    file_path = Column(String)
    external_url = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    islamiyya_class = relationship("IslamiyyaClass")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    purchases = relationship("BookPurchase", back_populates="book", cascade="all, delete-orphan")


class BookPurchase(Base):
    __tablename__ = "book_purchases"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("class_books.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="NGN")
    payment_provider = Column(String, default="paystack")
    transaction_id = Column(String, unique=True, nullable=False)
    status = Column(String, default="pending")  # pending, completed, failed
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    book = relationship("ClassBook", back_populates="purchases")
    user = relationship("User", foreign_keys=[user_id])
