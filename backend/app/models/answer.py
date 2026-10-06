import uuid
from typing import Any, TYPE_CHECKING
from sqlalchemy import ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.response import Response
    from app.models.question import Question


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    response_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("responses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    value: Mapped[Any] = mapped_column(JSON, nullable=False)

    response: Mapped["Response"] = relationship("Response", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")

    __table_args__ = (
        UniqueConstraint("response_id", "question_id", name="uq_answers_response_question"),
    )
