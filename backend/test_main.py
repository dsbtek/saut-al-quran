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
    db.delete(user)
    db.commit()
    db.close()


@pytest.fixture
def test_scholar():
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


def test_register_user_with_role(setup_database):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "scholar@example.com",
            "username": "newscholar",
            "full_name": "New Scholar",
            "password": "scholarpassword",
            "role": "scholar"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "scholar@example.com"
    assert data["username"] == "newscholar"
    assert data["role"] == "scholar"


def test_register_admin_user(setup_database):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "username": "newadmin",
            "full_name": "New Admin",
            "password": "adminpassword",
            "role": "admin"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@example.com"
    assert data["username"] == "newadmin"
    assert data["role"] == "admin"


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
    headers = get_auth_headers("testuser", "testpassword")
    response = client.post(
        "/api/v1/recitations/",
        json={
            "surah_name": "Al-Fatiha",
            "ayah_start": 1,
            "ayah_end": 7,
            "audio_data": "base64-encoded-audio",
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


def test_get_recitations(setup_database, test_user):
    headers = get_auth_headers("testuser", "testpassword")

    # Create a recitation first
    client.post(
        "/api/v1/recitations/",
        json={
            "surah_name": "Al-Baqarah",
            "ayah_start": 1,
            "ayah_end": 5,
            "audio_data": "base64-encoded-audio"
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
    assert response.status_code == 401


def test_scholar_access_pending_recitations(setup_database, test_scholar, test_user):
    # Create a recitation as user
    user_headers = get_auth_headers("testuser", "testpassword")
    client.post(
        "/api/v1/recitations/",
        json={
            "surah_name": "Al-Ikhlas",
            "ayah_start": 1,
            "ayah_end": 4,
            "audio_data": "base64-encoded-audio"
        },
        headers=user_headers
    )

    # Access as scholar
    scholar_headers = get_auth_headers("testscholar", "scholarpassword")
    response = client.get("/api/v1/recitations/pending",
                          headers=scholar_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
