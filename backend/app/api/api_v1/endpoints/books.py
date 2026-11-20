import uuid
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.community import CommunityMembership
from app.models.islamiyya_class import IslamiyyaClass, ClassEnrollment
from app.models.class_book import ClassBook, BookPurchase
from app.schemas.class_book import ClassBookOut, BookPurchaseCreate, BookPurchaseOut

router = APIRouter()

APP_DIR = Path(__file__).resolve().parents[3]
BOOKS_UPLOAD_DIR = APP_DIR / "uploads" / "books"
BOOKS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_BOOK_EXTENSIONS = {".pdf", ".epub", ".txt", ".docx"}


def _can_manage_class_books(db: Session, cls: IslamiyyaClass, user: User) -> bool:
    if user.role == UserRole.ADMIN or cls.scholar_id == user.id:
        return True
    membership = db.query(CommunityMembership).filter(
        CommunityMembership.community_id == cls.community_id,
        CommunityMembership.user_id == user.id,
        CommunityMembership.status == "approved",
        CommunityMembership.is_active == True,
        CommunityMembership.role.in_(["admin", "scholar"]),
    ).first()
    return membership is not None


def _is_enrolled_in_class(db: Session, class_id: int, user: User) -> bool:
    enr = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == class_id,
        ClassEnrollment.student_id == user.id,
        ClassEnrollment.status == "approved",
    ).first()
    return enr is not None


def _serialize_book(db: Session, book: ClassBook, cls: IslamiyyaClass, user: User) -> dict:
    is_manager_or_scholar = _can_manage_class_books(db, cls, user)
    purchase = (
        db.query(BookPurchase)
        .filter(BookPurchase.book_id == book.id, BookPurchase.user_id == user.id)
        .order_by(BookPurchase.id.desc())
        .first()
    )
    has_access = (
        is_manager_or_scholar
        or book.is_free
        or (purchase is not None and purchase.status == "completed")
    )
    return {
        "id": book.id,
        "class_id": book.class_id,
        "uploaded_by": book.uploaded_by,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "session_name": book.session_name,
        "available_from": book.available_from,
        "available_until": book.available_until,
        "is_free": book.is_free,
        "price": book.price,
        "currency": book.currency,
        "file_path": book.file_path,
        "external_url": book.external_url,
        "is_active": book.is_active,
        "created_at": book.created_at,
        "has_access": has_access,
        "purchase_status": purchase.status if purchase else None,
        "purchase_id": purchase.id if purchase else None,
    }


@router.post("/", response_model=ClassBookOut)
async def upload_class_book(
    class_id: int = Form(...),
    title: str = Form(...),
    session_name: str = Form(...),
    author: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    available_from: Optional[str] = Form(None),
    available_until: Optional[str] = Form(None),
    is_free: bool = Form(True),
    price: float = Form(0.0),
    currency: str = Form("NGN"),
    external_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a free or paid session book to an Islamiyya class (Scholar or Manager)."""
    cls = db.query(IslamiyyaClass).filter(IslamiyyaClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    if not _can_manage_class_books(db, cls, current_user):
        raise HTTPException(status_code=403, detail="Only class Scholars or Managers can add books")

    if not is_free and price <= 0:
        raise HTTPException(status_code=400, detail="Paid books must have a price greater than 0")

    file_path_str = None
    if file is not None:
        ext = Path(file.filename or "book.pdf").suffix.lower() or ".pdf"
        if ext not in ALLOWED_BOOK_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported book format: {ext}")
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded book file is empty")
        unique_name = f"{uuid.uuid4()}{ext}"
        dest = BOOKS_UPLOAD_DIR / unique_name
        with open(dest, "wb") as f:
            f.write(contents)
        file_path_str = f"uploads/books/{unique_name}"

    if not file_path_str and not external_url:
        raise HTTPException(status_code=400, detail="Provide a book file or external URL")

    parsed_from = datetime.fromisoformat(available_from) if available_from else None
    parsed_until = datetime.fromisoformat(available_until) if available_until else None

    book = ClassBook(
        class_id=class_id,
        uploaded_by=current_user.id,
        title=title,
        author=author,
        description=description,
        session_name=session_name,
        available_from=parsed_from,
        available_until=parsed_until,
        is_free=is_free,
        price=Decimal("0") if is_free else Decimal(str(price)),
        currency=currency,
        file_path=file_path_str,
        external_url=external_url,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return _serialize_book(db, book, cls, current_user)


@router.get("/class/{class_id}", response_model=List[ClassBookOut])
def list_class_books(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cls = db.query(IslamiyyaClass).filter(IslamiyyaClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    books = db.query(ClassBook).filter(ClassBook.class_id == class_id, ClassBook.is_active == True).all()
    return [_serialize_book(db, b, cls, current_user) for b in books]


@router.post("/{book_id}/purchase", response_model=BookPurchaseOut)
def initiate_book_purchase(
    book_id: int,
    body: BookPurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Initiate payment for a paid class book (or unlock immediately if free)."""
    book = db.query(ClassBook).filter(ClassBook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    existing_completed = db.query(BookPurchase).filter(
        BookPurchase.book_id == book_id,
        BookPurchase.user_id == current_user.id,
        BookPurchase.status == "completed",
    ).first()
    if existing_completed:
        return existing_completed

    tx_id = f"BOOK_{uuid.uuid4().hex[:12].upper()}"
    purchase = BookPurchase(
        book_id=book_id,
        user_id=current_user.id,
        amount=Decimal("0") if book.is_free else book.price,
        currency=book.currency,
        payment_provider=body.payment_provider,
        transaction_id=tx_id,
        status="completed" if book.is_free else "pending",
        completed_at=func.now() if book.is_free else None,
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


@router.post("/purchases/{purchase_id}/confirm", response_model=BookPurchaseOut)
def confirm_book_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Confirm/verify a pending book purchase (testing/manual gateway verification)."""
    purchase = db.query(BookPurchase).filter(BookPurchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if purchase.user_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.ISLAM_MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this purchase")

    purchase.status = "completed"
    purchase.completed_at = func.now()
    db.commit()
    db.refresh(purchase)
    return purchase


@router.get("/{book_id}/download")
async def download_class_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Authenticated download of a class book file."""
    book = db.query(ClassBook).filter(ClassBook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    cls = db.query(IslamiyyaClass).filter(IslamiyyaClass.id == book.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    is_manager_or_scholar = _can_manage_class_books(db, cls, current_user)
    if not is_manager_or_scholar:
        if not _is_enrolled_in_class(db, cls.id, current_user):
            raise HTTPException(status_code=403, detail="You must be enrolled in this class to access its books")
        if not book.is_free:
            completed = db.query(BookPurchase).filter(
                BookPurchase.book_id == book.id,
                BookPurchase.user_id == current_user.id,
                BookPurchase.status == "completed",
            ).first()
            if not completed:
                raise HTTPException(status_code=402, detail="Payment required to download this book")

    if not book.file_path:
        raise HTTPException(status_code=404, detail="No uploaded file for this book; use external_url")

    filename = Path(book.file_path).name
    file_path = (BOOKS_UPLOAD_DIR / filename).resolve()
    if BOOKS_UPLOAD_DIR.resolve() not in file_path.parents or not file_path.exists():
        raise HTTPException(status_code=404, detail="Book file not found on disk")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"{book.title.replace(' ', '_')}{file_path.suffix or '.pdf'}",
    )
