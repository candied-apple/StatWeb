from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.storage.base import StorageBackend
from app.storage.local import LocalStorageBackend
from app.models.user import User

_storage_instance: StorageBackend = LocalStorageBackend(settings.STORAGE_DIR)


def get_storage() -> StorageBackend:
    return _storage_instance


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Returns or creates a default user for MVP workspace."""
    user = db.query(User).filter(User.email == "demo@statweb.org").first()
    if not user:
        user = User(
            email="demo@statweb.org",
            hashed_password="demo_password_hash",
            full_name="Researcher",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
