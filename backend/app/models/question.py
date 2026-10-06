import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.form import Form
    from app.models.answer import Answer


class QuestionType(str, enum.Enum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    MULTIPLE_CHOICE = "multiple_choice"
    DROPDOWN = "dropdown"
    EMAIL = "email"
    NUMBER = "number"
    YES_NO = "yes_no"
    RATING = "rating"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    form_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[QuestionType] = mapped_column(
        SAEnum(QuestionType, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    settings: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    form: Mapped["Form"] = relationship("Form", back_populates="questions")
    answers: Mapped[List["Answer"]] = relationship(
        "Answer", back_populates="question", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_questions_form_id_position", "form_id", "position"),
    )
