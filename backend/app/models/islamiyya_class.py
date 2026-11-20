import enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class ClassCategory(str, enum.Enum):
    CHILDREN = "children"
    ADULT_MALE = "adult_male"
    ADULT_WOMEN = "adult_women"
    YOUTH = "youth"
    GENERAL = "general"


class IslamicSubject(str, enum.Enum):
    QURAN_TAJWEED = "quran_tajweed"
    FIQH = "fiqh"
    AQIDAH = "aqidah"
    HADITH = "hadith"
    SEERAH = "seerah"
    TAFSIR = "tafsir"
    ARABIC = "arabic"
    AKHLAQ = "akhlaq"
    GENERAL = "general"


class IslamiyyaClass(Base):
    __tablename__ = "islamiyya_classes"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    scholar_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    subject = Column(Enum(IslamicSubject), default=IslamicSubject.QURAN_TAJWEED, nullable=False)
    category = Column(Enum(ClassCategory), default=ClassCategory.GENERAL, nullable=False)
    schedule_days = Column(String)  # e.g., "Sat, Sun"
    start_time = Column(String)     # e.g., "09:00"
    end_time = Column(String)       # e.g., "10:30"
    surah_focus = Column(String)    # e.g., "Juz Amma"
    max_students = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    community = relationship("Community")
    scholar = relationship("User", foreign_keys=[scholar_id])
    creator = relationship("User", foreign_keys=[created_by])
    enrollments = relationship("ClassEnrollment", back_populates="islamiyya_class", cascade="all, delete-orphan")


class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("islamiyya_classes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    islamiyya_class = relationship("IslamiyyaClass", back_populates="enrollments")
    student = relationship("User", foreign_keys=[student_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
