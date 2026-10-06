from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

DEFAULT_USER_EMAIL = "demo@typeform-clone.dev"
DEFAULT_USER_NAME = "Demo Creator"


def get_current_user(db: Session = Depends(get_db)):
    # Lazy import to avoid circular dependency before models are loaded
    from app.models.user import User

    user = db.query(User).filter(User.email == DEFAULT_USER_EMAIL).first()
    if not user:
        import uuid
        user = User(
            id=str(uuid.uuid4()),
            email=DEFAULT_USER_EMAIL,
            name=DEFAULT_USER_NAME,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
