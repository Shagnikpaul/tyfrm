import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.question import Question
    from app.models.response import Response


class FormStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False, default="Untitled form")
    slug: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    status: Mapped[FormStatus] = mapped_column(
        SAEnum(FormStatus, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=FormStatus.DRAFT,
        index=True,
    )
    welcome_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    welcome_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    welcome_description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    welcome_button_text: Mapped[str] = mapped_column(String(50), default="Start", nullable=False)
    thankyou_title: Mapped[str] = mapped_column(
        String(200), default="Thanks for completing this form!", nullable=False
    )
    thankyou_message: Mapped[Optional[str]] = mapped_column(
        String(1000), default="Your response has been recorded.", nullable=True
    )
    theme: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="forms")
    questions: Mapped[List["Question"]] = relationship(
        "Question",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )
    responses: Mapped[List["Response"]] = relationship(
        "Response", back_populates="form", cascade="all, delete-orphan"
    )
