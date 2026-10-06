from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.errors import ConfirmationRequiredError, NotFoundError, ValidationError
from app.models.answer import Answer
from app.models.question import Question, QuestionType
from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
    validate_settings,
)
from app.services.form_service import get_form_or_404


def question_to_response(q: Question) -> QuestionResponse:
    return QuestionResponse(
        id=q.id,
        form_id=q.form_id,
        position=q.position,
        type=q.type.value if hasattr(q.type, "value") else str(q.type),
        title=q.title,
        description=q.description,
        required=q.required,
        settings=q.settings or {},
        created_at=q.created_at,
        updated_at=q.updated_at,
    )


def create_question(
    db: Session,
    user_id: str,
    form_id: str,
    data: QuestionCreate,
) -> QuestionResponse:
    """Create and insert a question into a form, shifting later positions if needed."""
    get_form_or_404(db, user_id, form_id)

    # Validate settings for this question type
    normalized_settings = validate_settings(data.type, data.settings)

    existing_questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.asc())
        .all()
    )
    total_existing = len(existing_questions)

    if data.position is None or data.position >= total_existing:
        new_position = total_existing
    else:
        new_position = max(0, data.position)
        # Shift existing questions at or after this position
        for eq in existing_questions:
            if eq.position >= new_position:
                eq.position += 1

    question = Question(
        form_id=form_id,
        position=new_position,
        type=data.type,
        title=data.title,
        description=data.description,
        required=data.required,
        settings=normalized_settings,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question_to_response(question)


def get_question_or_404(db: Session, user_id: str, form_id: str, question_id: str) -> Question:
    get_form_or_404(db, user_id, form_id)
    question = (
        db.query(Question)
        .filter(Question.id == question_id, Question.form_id == form_id)
        .first()
    )
    if not question:
        raise NotFoundError(f"Question '{question_id}' not found in form '{form_id}'")
    return question


def update_question(
    db: Session,
    user_id: str,
    form_id: str,
    question_id: str,
    data: QuestionUpdate,
    confirm: bool = False,
) -> QuestionResponse:
    """Update question attributes; handles destructive type changes with confirmation."""
    question = get_question_or_404(db, user_id, form_id, question_id)

    # Check for type change
    if data.type is not None and data.type != question.type:
        answer_count = (
            db.query(func.count(Answer.id))
            .filter(Answer.question_id == question_id)
            .scalar()
            or 0
        )
        if answer_count > 0 and not confirm:
            raise ConfirmationRequiredError(
                message=f"This question has {answer_count} answers that will be permanently deleted.",
                details=[{"answer_count": answer_count, "action": "change_type"}],
            )

        if answer_count > 0:
            db.query(Answer).filter(Answer.question_id == question_id).delete()

        question.type = data.type
        # If new settings provided, validate against new type; otherwise reset to new type defaults
        question.settings = validate_settings(data.type, data.settings)
    else:
        # Type didn't change, validate settings if provided
        if data.settings is not None:
            question.settings = validate_settings(question.type, data.settings)

    if data.title is not None:
        question.title = data.title
    if data.description is not None:
        question.description = data.description
    if data.required is not None:
        question.required = data.required

    question.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(question)
    return question_to_response(question)


def delete_question(
    db: Session,
    user_id: str,
    form_id: str,
    question_id: str,
    confirm: bool = False,
) -> None:
    """Delete a question; requires confirmation if answers exist, and re-compacts positions."""
    question = get_question_or_404(db, user_id, form_id, question_id)

    answer_count = (
        db.query(func.count(Answer.id))
        .filter(Answer.question_id == question_id)
        .scalar()
        or 0
    )
    if answer_count > 0 and not confirm:
        raise ConfirmationRequiredError(
            message=f"This question has {answer_count} answers that will be permanently deleted.",
            details=[{"answer_count": answer_count, "action": "delete_question"}],
        )

    db.delete(question)
    db.flush()

    # Re-compact positions to be contiguous 0..n-1
    remaining = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.asc())
        .all()
    )
    for idx, q in enumerate(remaining):
        q.position = idx

    db.commit()


def reorder_questions(
    db: Session,
    user_id: str,
    form_id: str,
    question_ids: List[str],
) -> List[QuestionResponse]:
    """Reorder all questions of a form in a single transaction."""
    get_form_or_404(db, user_id, form_id)

    existing_questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .all()
    )
    existing_map = {q.id: q for q in existing_questions}

    if len(question_ids) != len(existing_questions) or set(question_ids) != set(existing_map.keys()):
        raise ValidationError("Question IDs must match the existing questions of the form exactly")

    for idx, q_id in enumerate(question_ids):
        existing_map[q_id].position = idx

    db.commit()

    ordered = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.asc())
        .all()
    )
    return [question_to_response(q) for q in ordered]
