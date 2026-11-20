from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.database import engine, Base
from app.models import (
    User,
    UserRole,
    Recitation,
    Comment,
    Marker,
    Community,
    CommunityMembership,
    IslamiyyaClass,
    ClassCategory,
    PublicLecture,
    LectureStreamTarget,
    LectureStatus,
)
from app.core.security import get_password_hash


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def create_initial_data(db: Session):
    """Create initial demo users, Islamiyya, classes, and public lecture."""
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            email="admin@sautalquran.com",
            username="admin",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)

    manager_user = db.query(User).filter(User.username == "manager1").first()
    if not manager_user:
        manager_user = User(
            email="manager@sautalquran.com",
            username="manager1",
            full_name="Ustadh Ibrahim (Islamiyya Manager)",
            hashed_password=get_password_hash("manager123"),
            role=UserRole.ISLAM_MANAGER,
            is_active=True,
            is_verified=True,
        )
        db.add(manager_user)

    scholar_user = db.query(User).filter(User.username == "scholar1").first()
    if not scholar_user:
        scholar_user = User(
            email="scholar@sautalquran.com",
            username="scholar1",
            full_name="Sheikh Ahmad",
            hashed_password=get_password_hash("scholar123"),
            role=UserRole.SCHOLAR,
            is_active=True,
            is_verified=True,
        )
        db.add(scholar_user)

    sample_user = db.query(User).filter(User.username == "testuser").first()
    if not sample_user:
        sample_user = User(
            email="user@sautalquran.com",
            username="testuser",
            full_name="Test Student",
            hashed_password=get_password_hash("user123"),
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db.add(sample_user)

    db.commit()
    db.refresh(manager_user)
    db.refresh(scholar_user)
    db.refresh(sample_user)

    # Seed sample Islamiyya if none exists
    if db.query(Community).count() == 0:
        islamiyya = Community(
            name="Darul Hikmah Islamiyya",
            description="A dedicated Qur'an & Tajweed learning center offering structured classes for children, adult men, and adult women.",
            location="Lagos, Nigeria",
            address="123 Islamic Center Road",
            created_by=manager_user.id,
        )
        db.add(islamiyya)
        db.commit()
        db.refresh(islamiyya)

        db.add_all([
            CommunityMembership(
                community_id=islamiyya.id,
                user_id=manager_user.id,
                role="admin",
                requested_role="admin",
                status="approved",
            ),
            CommunityMembership(
                community_id=islamiyya.id,
                user_id=scholar_user.id,
                role="scholar",
                requested_role="scholar",
                status="approved",
            ),
            CommunityMembership(
                community_id=islamiyya.id,
                user_id=sample_user.id,
                role="member",
                requested_role="member",
                status="approved",
            ),
        ])

        db.add_all([
            IslamiyyaClass(
                community_id=islamiyya.id,
                scholar_id=scholar_user.id,
                created_by=manager_user.id,
                title="Children's Juz Amma & Makharij",
                description="Foundational Arabic letters, short surahs, and joyful memorization for ages 6–12.",
                category=ClassCategory.CHILDREN,
                schedule_days="Sat, Sun",
                start_time="09:00",
                end_time="10:30",
                surah_focus="Juz Amma",
            ),
            IslamiyyaClass(
                community_id=islamiyya.id,
                scholar_id=scholar_user.id,
                created_by=manager_user.id,
                title="Adult Brothers Tajweed Mastery",
                description="Applied Ahkam al-Tajweed with live recitation correction.",
                category=ClassCategory.ADULT_MALE,
                schedule_days="Tue, Thu",
                start_time="19:30",
                end_time="20:45",
                surah_focus="Surah Al-Baqarah",
            ),
            IslamiyyaClass(
                community_id=islamiyya.id,
                scholar_id=scholar_user.id,
                created_by=manager_user.id,
                title="Adult Sisters Hifz & Fluency Circle",
                description="Supportive recitation and memorization circle for adult sisters.",
                category=ClassCategory.ADULT_WOMEN,
                schedule_days="Wed, Sat",
                start_time="16:00",
                end_time="17:30",
                surah_focus="Surah Yasin & Al-Mulk",
            ),
        ])

        lecture = PublicLecture(
            community_id=islamiyya.id,
            host_id=manager_user.id,
            title="Beautifying Your Recitation: Practical Rules of Madd & Ghunnah",
            speaker_name="Sheikh Ahmad",
            description="Open community lecture streamed live across our social channels.",
            topic="Tajweed",
            scheduled_at=datetime.now(timezone.utc) + timedelta(hours=2),
            status=LectureStatus.LIVE,
            stream_embed_url="https://www.youtube.com/embed/live_stream?channel=UC4R8DWoMoI7CAwX8_LjQHig",
            is_public=True,
        )
        db.add(lecture)
        db.flush()
        db.add_all([
            LectureStreamTarget(
                lecture_id=lecture.id,
                platform="youtube",
                watch_url="https://youtube.com/live",
            ),
            LectureStreamTarget(
                lecture_id=lecture.id,
                platform="facebook",
                watch_url="https://facebook.com/live",
            ),
        ])
        db.commit()
