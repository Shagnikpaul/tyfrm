import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.errors import FormNotAvailableError, NotFoundError, ValidationError
from app.models.answer import Answer
from app.models.form import Form, FormStatus
from app.models.question import Question
from app.models.response import Response
from app.schemas.common import PaginatedResponse
from app.schemas.form import PublicForm, PublicQuestion, WelcomeScreen, ThankYouScreen
from app.schemas.response import (
    AnswerItem,
    ResponseItem,
    ResponseSubmit,
    SubmitResult,
)
from app.services.form_service import get_form_or_404
from app.services.validation import AnswerError, is_empty_answer, validate_answer


def get_public_form(db: Session, slug: str) -> PublicForm:
    """Retrieve published form definition for respondents. Returns 404 for draft/missing."""
    form = (
        db.query(Form)
        .filter(Form.slug == slug, Form.status == FormStatus.PUBLISHED)
        .first()
    )
    if not form:
        raise FormNotAvailableError("Form not available")

    questions_list = [
        PublicQuestion(
            id=q.id,
            position=q.position,
            type=q.type.value if hasattr(q.type, "value") else str(q.type),
            title=q.title,
            description=q.description,
            required=q.required,
            settings=q.settings or {},
        )
        for q in sorted(form.questions, key=lambda x: x.position)
    ]

    return PublicForm(
        slug=form.slug,
        title=form.title,
        welcome=WelcomeScreen(
            enabled=form.welcome_enabled,
            title=form.welcome_title,
            description=form.welcome_description,
            button_text=form.welcome_button_text,
        ),
        thank_you=ThankYouScreen(
            title=form.thankyou_title,
            message=form.thankyou_message,
        ),
        theme=form.theme or {},
        questions=questions_list,
    )


def record_form_view(db: Session, slug: str) -> None:
    """Increment the view counter atomically on page load."""
    result = (
        db.query(Form)
        .filter(Form.slug == slug, Form.status == FormStatus.PUBLISHED)
        .update({Form.view_count: Form.view_count + 1})
    )
    if result == 0:
        raise FormNotAvailableError("Form not available")
    db.commit()


def submit_response(db: Session, slug: str, submission: ResponseSubmit) -> SubmitResult:
    """
    Validate respondent submission and record response and answers in a single transaction.
    Reports per-question validation errors.
    """
    form = (
        db.query(Form)
        .filter(Form.slug == slug, Form.status == FormStatus.PUBLISHED)
        .first()
    )
    if not form:
        raise FormNotAvailableError("Form not available")

    # Map existing questions
    form_questions: Dict[str, Question] = {q.id: q for q in form.questions}

    # Validate submission question IDs and detect duplicates
    seen_q_ids = set()
    submitted_answers_map: Dict[str, Any] = {}
    details: List[Dict[str, str]] = []

    for item in submission.answers:
        if item.question_id in seen_q_ids:
            details.append({
                "question_id": item.question_id,
                "message": "Duplicate answer for question",
            })
        seen_q_ids.add(item.question_id)

        if item.question_id not in form_questions:
            details.append({
                "question_id": item.question_id,
                "message": "Question does not belong to this form",
            })
        else:
            submitted_answers_map[item.question_id] = item.value

    # If any alien or duplicate question ID, return 422
    if details:
        raise ValidationError(message="Some answers are invalid", details=details)

    # Validate answers against all form questions
    cleaned_answers: Dict[str, Any] = {}
    answered_count = 0

    for q_id, question in form_questions.items():
        raw_val = submitted_answers_map.get(q_id, None)
        q_type = question.type.value if hasattr(question.type, "value") else str(question.type)

        try:
            cleaned_val = validate_answer(
                question_type=q_type,
                settings=question.settings or {},
                required=question.required,
                value=raw_val,
            )
            if cleaned_val is not None:
                cleaned_answers[q_id] = cleaned_val
                answered_count += 1
        except AnswerError as e:
            details.append({"question_id": q_id, "message": e.message})

    if details:
        raise ValidationError(message="Some answers are invalid", details=details)

    # Check that at least one question was answered
    if answered_count == 0:
        raise ValidationError(
            message="Please answer at least one question",
            details=[],
        )

    # All valid -> persist response and answers in single transaction
    new_response_id = str(uuid.uuid4())
    submitted_time = datetime.now(timezone.utc)
    response = Response(
        id=new_response_id,
        form_id=form.id,
        submitted_at=submitted_time,
    )
    db.add(response)

    for q_id, val in cleaned_answers.items():
        ans = Answer(
            id=str(uuid.uuid4()),
            response_id=new_response_id,
            question_id=q_id,
            value=val,
        )
        db.add(ans)

    db.commit()
    db.refresh(response)
    return SubmitResult(id=response.id, submitted_at=response.submitted_at)


def list_responses(
    db: Session,
    user_id: str,
    form_id: str,
    page: int = 1,
    page_size: int = 20,
    sort: str = "submitted_desc",
) -> PaginatedResponse[ResponseItem]:
    """List paginated responses for a form (creator view)."""
    get_form_or_404(db, user_id, form_id)

    page = max(1, page)
    page_size = max(1, min(100, page_size))

    query = db.query(Response).filter(Response.form_id == form_id)

    if sort == "submitted_asc":
        query = query.order_by(Response.submitted_at.asc())
    else:
        query = query.order_by(Response.submitted_at.desc())

    total = query.count()
    responses = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        ResponseItem(
            id=r.id,
            submitted_at=r.submitted_at,
            answers=[
                AnswerItem(question_id=a.question_id, value=a.value)
                for a in r.answers
            ],
        )
        for r in responses
    ]

    return PaginatedResponse[ResponseItem](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


def get_response(
    db: Session,
    user_id: str,
    form_id: str,
    response_id: str,
) -> ResponseItem:
    """Retrieve a single response."""
    get_form_or_404(db, user_id, form_id)

    response = (
        db.query(Response)
        .filter(Response.id == response_id, Response.form_id == form_id)
        .first()
    )
    if not response:
        raise NotFoundError(f"Response '{response_id}' not found")

    return ResponseItem(
        id=response.id,
        submitted_at=response.submitted_at,
        answers=[
            AnswerItem(question_id=a.question_id, value=a.value)
            for a in response.answers
        ],
    )
