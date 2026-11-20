from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.community import Community, CommunityMembership
from app.models.lecture import PublicLecture, LectureStreamTarget, LectureStatus
from app.schemas.lecture import (
    PublicLectureCreate,
    PublicLectureStatusUpdate,
    PublicLectureOut,
)

router = APIRouter()


def _can_host_lecture(db: Session, community_id: int, user: User) -> bool:
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


def _serialize_lecture(lecture: PublicLecture, include_rtmp: bool = False) -> dict:
    return {
        "id": lecture.id,
        "community_id": lecture.community_id,
        "host_id": lecture.host_id,
        "title": lecture.title,
        "speaker_name": lecture.speaker_name,
        "description": lecture.description,
        "topic": lecture.topic,
        "scheduled_at": lecture.scheduled_at,
        "status": lecture.status,
        "stream_embed_url": lecture.stream_embed_url,
        "recording_url": lecture.recording_url,
        "is_public": lecture.is_public,
        "created_at": lecture.created_at,
        "community_name": lecture.community.name if lecture.community else None,
        "stream_targets": [
            {
                "id": t.id,
                "lecture_id": t.lecture_id,
                "platform": t.platform,
                "watch_url": t.watch_url,
                "rtmp_url": t.rtmp_url if include_rtmp else None,
                "is_active": t.is_active,
            }
            for t in (lecture.stream_targets or [])
        ],
    }


@router.post("/", response_model=PublicLectureOut)
def create_lecture(
    lecture_in: PublicLectureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Schedule a public Islamiyya lecture with social multi-stream targets."""
    community = db.query(Community).filter(Community.id == lecture_in.community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if not _can_host_lecture(db, lecture_in.community_id, current_user):
        raise HTTPException(status_code=403, detail="Only Islamiyya Managers or Scholars can host lectures")

    lecture = PublicLecture(
        community_id=lecture_in.community_id,
        host_id=current_user.id,
        title=lecture_in.title,
        speaker_name=lecture_in.speaker_name,
        description=lecture_in.description,
        topic=lecture_in.topic,
        scheduled_at=lecture_in.scheduled_at,
        stream_embed_url=lecture_in.stream_embed_url,
        is_public=lecture_in.is_public,
    )
    db.add(lecture)
    db.flush()

    for target in lecture_in.stream_targets:
        db.add(
            LectureStreamTarget(
                lecture_id=lecture.id,
                platform=target.platform,
                watch_url=target.watch_url,
                rtmp_url=target.rtmp_url,
            )
        )

    db.commit()
    db.refresh(lecture)
    return _serialize_lecture(lecture, include_rtmp=True)


@router.get("/live", response_model=List[PublicLectureOut])
def list_live_and_upcoming_lectures(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List live and scheduled public lectures across Islamiyyas."""
    lectures = (
        db.query(PublicLecture)
        .filter(PublicLecture.status.in_([LectureStatus.LIVE, LectureStatus.SCHEDULED]))
        .order_by(desc(PublicLecture.status == LectureStatus.LIVE), PublicLecture.scheduled_at)
        .limit(20)
        .all()
    )
    return [_serialize_lecture(l, include_rtmp=False) for l in lectures]


@router.get("/community/{community_id}", response_model=List[PublicLectureOut])
def list_community_lectures(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    can_host = _can_host_lecture(db, community_id, current_user)
    lectures = (
        db.query(PublicLecture)
        .filter(PublicLecture.community_id == community_id)
        .order_by(desc(PublicLecture.scheduled_at))
        .all()
    )
    return [_serialize_lecture(l, include_rtmp=can_host) for l in lectures]


@router.get("/{lecture_id}", response_model=PublicLectureOut)
def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    lecture = db.query(PublicLecture).filter(PublicLecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    can_host = _can_host_lecture(db, lecture.community_id, current_user)
    if not lecture.is_public and not can_host:
        membership = db.query(CommunityMembership).filter(
            CommunityMembership.community_id == lecture.community_id,
            CommunityMembership.user_id == current_user.id,
            CommunityMembership.status == "approved",
            CommunityMembership.is_active == True,
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="This lecture is restricted to approved Islamiyya members")

    return _serialize_lecture(lecture, include_rtmp=can_host)


@router.put("/{lecture_id}/status", response_model=PublicLectureOut)
def update_lecture_status(
    lecture_id: int,
    body: PublicLectureStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    lecture = db.query(PublicLecture).filter(PublicLecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    if not _can_host_lecture(db, lecture.community_id, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update lecture status")

    lecture.status = body.status
    if body.stream_embed_url is not None:
        lecture.stream_embed_url = body.stream_embed_url
    if body.recording_url is not None:
        lecture.recording_url = body.recording_url

    db.commit()
    db.refresh(lecture)
    return _serialize_lecture(lecture, include_rtmp=True)
