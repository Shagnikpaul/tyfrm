import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.form import Form
    from app.models.answer import Answer


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    form_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    form: Mapped["Form"] = relationship("Form", back_populates="responses")
    answers: Mapped[List["Answer"]] = relationship(
        "Answer", back_populates="response", cascade="all, delete-orphan"
    )
