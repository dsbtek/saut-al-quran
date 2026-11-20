from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.islamiyya_class import ClassCategory, IslamicSubject


class IslamiyyaClassBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject: IslamicSubject = IslamicSubject.QURAN_TAJWEED
    category: ClassCategory = ClassCategory.GENERAL
    schedule_days: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    surah_focus: Optional[str] = None
    max_students: Optional[int] = 30


class IslamiyyaClassCreate(IslamiyyaClassBase):
    community_id: int
    scholar_id: Optional[int] = None


class IslamiyyaClassUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[IslamicSubject] = None
    category: Optional[ClassCategory] = None
    schedule_days: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    surah_focus: Optional[str] = None
    max_students: Optional[int] = None
    is_active: Optional[bool] = None
    scholar_id: Optional[int] = None


class ClassEnrollmentOut(BaseModel):
    id: int
    class_id: int
    student_id: int
    status: str
    created_at: datetime
    student: Optional[dict] = None

    class Config:
        from_attributes = True


class IslamiyyaClassOut(IslamiyyaClassBase):
    id: int
    community_id: int
    scholar_id: Optional[int] = None
    created_by: int
    is_active: bool
    created_at: datetime
    scholar: Optional[dict] = None
    enrolled_count: int = 0
    pending_count: int = 0
    my_enrollment_status: Optional[str] = None
    enrollments: Optional[List[ClassEnrollmentOut]] = None

    class Config:
        from_attributes = True


class EnrollmentDecisionRequest(BaseModel):
    decision: str  # "approve" or "reject"
