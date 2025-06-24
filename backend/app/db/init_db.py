from sqlalchemy.orm import Session
from app.db.database import engine, Base
from app.models import User, Recitation, Comment, Marker
from app.core.security import get_password_hash
from app.models.user import UserRole

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def create_initial_data(db: Session):
    """Create initial data for the application"""
    
    # Check if admin user already exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            email="admin@sautalquran.com",
            username="admin",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
    
    # Create a sample scholar
    scholar_user = db.query(User).filter(User.username == "scholar1").first()
    if not scholar_user:
        scholar_user = User(
            email="scholar@sautalquran.com",
            username="scholar1",
            full_name="Sheikh Ahmad",
            hashed_password=get_password_hash("scholar123"),
            role=UserRole.SCHOLAR,
            is_active=True,
            is_verified=True
        )
        db.add(scholar_user)
    
    # Create a sample user
    sample_user = db.query(User).filter(User.username == "testuser").first()
    if not sample_user:
        sample_user = User(
            email="user@sautalquran.com",
            username="testuser",
            full_name="Test User",
            hashed_password=get_password_hash("user123"),
            role=UserRole.USER,
            is_active=True,
            is_verified=True
        )
        db.add(sample_user)
    
    db.commit()
    print("Initial data created successfully!")

if __name__ == "__main__":
    from app.db.database import SessionLocal
    
    print("Creating database tables...")
    create_tables()
    
    print("Creating initial data...")
    db = SessionLocal()
    try:
        create_initial_data(db)
    finally:
        db.close()
    
    print("Database initialization completed!")
