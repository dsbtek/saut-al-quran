import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import get_db, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={
                       "check_same_thread": False})
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user():
    from app.models.recitation import Recitation
    from app.models.comment import Comment
    from app.models.marker import Marker, LoopRegion
    db = TestingSessionLocal()
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword"),
        role=UserRole.USER,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    # Clean up dependent rows before deleting user
    rec_ids = [r.id for r in db.query(Recitation).filter(Recitation.user_id == user.id).all()]
    if rec_ids:
        db.query(Comment).filter(Comment.recitation_id.in_(rec_ids)).delete(synchronize_session=False)
        db.query(Marker).filter(Marker.recitation_id.in_(rec_ids)).delete(synchronize_session=False)
        db.query(LoopRegion).filter(LoopRegion.recitation_id.in_(rec_ids)).delete(synchronize_session=False)
        db.query(Recitation).filter(Recitation.id.in_(rec_ids)).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    db.close()


@pytest.fixture
def test_scholar():
    from app.models.comment import Comment
    from app.models.marker import Marker, LoopRegion
    db = TestingSessionLocal()
    scholar = User(
        email="scholar@example.com",
        username="testscholar",
        full_name="Test Scholar",
        hashed_password=get_password_hash("scholarpassword"),
        role=UserRole.SCHOLAR,
        is_active=True,
        is_verified=True
    )
    db.add(scholar)
    db.commit()
    db.refresh(scholar)
    yield scholar
    db.query(Comment).filter(Comment.scholar_id == scholar.id).delete(synchronize_session=False)
    db.query(Marker).filter(Marker.scholar_id == scholar.id).delete(synchronize_session=False)
    db.query(LoopRegion).filter(LoopRegion.scholar_id == scholar.id).delete(synchronize_session=False)
    db.delete(scholar)
    db.commit()
    db.close()


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Saut Al-Qur'an API is running"}


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_register_user(setup_database):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "newpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert data["role"] == "user"


def test_register_user_with_role_ignored(setup_database):
    """Self-registering with scholar or admin role must always default to user."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "scholar_attempt@example.com",
            "username": "newscholar",
            "full_name": "New Scholar",
            "password": "scholarpassword",
            "role": "scholar"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "scholar_attempt@example.com"
    assert data["username"] == "newscholar"
    assert data["role"] == "user"


def test_register_admin_user_ignored(setup_database):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin_attempt@example.com",
            "username": "newadmin",
            "full_name": "New Admin",
            "password": "adminpassword",
            "role": "admin"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "user"


def test_login_user(setup_database, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(setup_database, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "testuser",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401


def get_auth_headers(username: str, password: str):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_current_user(setup_database, test_user):
    headers = get_auth_headers("testuser", "testpassword")
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_create_recitation(setup_database, test_user):
    import base64
    headers = get_auth_headers("testuser", "testpassword")
    sample_b64 = base64.b64encode(b"fake-webm-audio-bytes").decode("ascii")
    response = client.post(
        "/api/v1/recitations/",
        json={
            "surah_name": "Al-Fatiha",
            "ayah_start": 1,
            "ayah_end": 7,
            "audio_data": sample_b64,
            "duration": 60.5
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["surah_name"] == "Al-Fatiha"
    assert data["ayah_start"] == 1
    assert data["ayah_end"] == 7
    assert data["status"] == "pending"


def test_upload_recitation_multipart_and_stream(setup_database, test_user):
    headers = get_auth_headers("testuser", "testpassword")
    response = client.post(
        "/api/v1/recitations/upload",
        data={
            "surah_name": "Al-Mulk",
            "ayah_start": "1",
            "ayah_end": "5",
            "duration": "12.4",
        },
        files={"file": ("recitation.webm", b"OggS-fake-audio-content", "audio/webm")},
        headers=headers,
    )
    assert response.status_code == 200
    rec = response.json()
    assert rec["surah_name"] == "Al-Mulk"
    assert rec["audio_file_path"] is not None

    # Student can read their own recitation details
    detail_resp = client.get(f"/api/v1/recitations/{rec['id']}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == rec["id"]

    # Student can stream their own audio
    audio_resp = client.get(f"/api/v1/recitations/audio/{rec['id']}", headers=headers)
    assert audio_resp.status_code == 200
    assert audio_resp.content == b"OggS-fake-audio-content"


def test_get_recitations(setup_database, test_user):
    import base64
    headers = get_auth_headers("testuser", "testpassword")
    sample_b64 = base64.b64encode(b"fake-webm-audio-bytes").decode("ascii")

    # Create a recitation first
    client.post(
        "/api/v1/recitations/",
        json={
            "surah_name": "Al-Baqarah",
            "ayah_start": 1,
            "ayah_end": 5,
            "audio_data": sample_b64
        },
        headers=headers
    )

    # Get recitations
    response = client.get("/api/v1/recitations/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["surah_name"] == "Al-Baqarah"


def test_unauthorized_access(setup_database):
    response = client.get("/api/v1/users/me")
    assert response.status_code in (401, 403)


def test_scholar_access_pending_recitations(setup_database, test_scholar, test_user):
    import base64
    sample_b64 = base64.b64encode(b"fake-webm-audio-bytes").decode("ascii")
    # Create a recitation as user
    user_headers = get_auth_headers("testuser", "testpassword")
    create_resp = client.post(
        "/api/v1/recitations/",
        json={
            "surah_name": "Al-Ikhlas",
            "ayah_start": 1,
            "ayah_end": 4,
            "audio_data": sample_b64
        },
        headers=user_headers
    )
    rec_id = create_resp.json()["id"]

    # Access as scholar
    scholar_headers = get_auth_headers("testscholar", "scholarpassword")
    response = client.get("/api/v1/recitations/pending",
                          headers=scholar_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

    # Scholar creates marker, loop, and comment with audio, then marks reviewed
    m_resp = client.post(
        "/api/v1/markers/",
        json={"recitation_id": rec_id, "timestamp": 2.5, "label": "Ghunnah", "category": "tajweed"},
        headers=scholar_headers,
    )
    assert m_resp.status_code == 200
    marker_id = m_resp.json()["id"]

    m_upd = client.put(
        f"/api/v1/markers/{marker_id}",
        json={"label": "Ghunnah Updated"},
        headers=scholar_headers,
    )
    assert m_upd.status_code == 200
    assert m_upd.json()["label"] == "Ghunnah Updated"

    c_resp = client.post(
        "/api/v1/comments/with-audio",
        data={"recitation_id": str(rec_id), "timestamp": "2.5", "text_comment": "Hold ghunnah 2 counts"},
        files={"audio_file": ("feedback.webm", b"voice-feedback-bytes", "audio/webm")},
        headers=scholar_headers,
    )
    assert c_resp.status_code == 200
    comment_id = c_resp.json()["id"]

    # Student can stream voice feedback and resolve comment
    ca_resp = client.get(f"/api/v1/comments/audio/{comment_id}", headers=user_headers)
    assert ca_resp.status_code == 200
    assert ca_resp.content == b"voice-feedback-bytes"

    res_resp = client.put(
        f"/api/v1/comments/{comment_id}",
        json={"is_resolved": True},
        headers=user_headers,
    )
    assert res_resp.status_code == 200
    assert res_resp.json()["is_resolved"] is True

    # Scholar marks recitation reviewed
    upd_rec = client.put(
        f"/api/v1/recitations/{rec_id}",
        json={"status": "reviewed"},
        headers=scholar_headers,
    )
    assert upd_rec.status_code == 200
    assert upd_rec.json()["status"] == "reviewed"

    # Student progress stats reflect reviewed recitation and resolved comment
    stats_resp = client.get("/api/v1/recitations/stats/me", headers=user_headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["reviewed_count"] >= 1
    assert stats["resolved_comments"] >= 1


def test_anonymous_donation_and_feedback(setup_database):
    d_resp = client.post(
        "/api/v1/donations/",
        json={
            "amount": 5000,
            "currency": "NGN",
            "payment_provider": "paystack",
            "donor_name": "Anon Supporter",
            "is_anonymous": True,
        },
    )
    assert d_resp.status_code == 200
    assert "transaction_id" in d_resp.json()

    f_resp = client.post(
        "/api/v1/feedback/",
        json={
            "feedback_type": "feature_request",
            "title": "Dark mode",
            "description": "Please add dark mode",
            "priority": "low",
        },
    )
    assert f_resp.status_code == 200
    assert f_resp.json()["title"] == "Dark mode"
