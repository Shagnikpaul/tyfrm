import copy
import secrets
import string
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import InvalidStateError, NotFoundError
from app.models.answer import Answer
from app.models.form import Form, FormStatus
from app.models.question import Question, QuestionType
from app.models.response import Response
from app.schemas.form import (
    FormCreate,
    FormDetail,
    FormSummary,
    FormUpdate,
    WelcomeScreen,
    ThankYouScreen,
)
from app.schemas.question import QuestionResponse


def generate_slug(length: int = 8) -> str:
    """Generate an 8-character URL-safe alphanumeric slug."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def build_share_url(slug: str) -> str:
    """Construct the public respondent share URL."""
    base_url = settings.PUBLIC_APP_URL.rstrip("/")
    return f"{base_url}/f/{slug}"


def form_to_detail(form: Form, response_count: Optional[int] = None) -> FormDetail:
    """Convert Form ORM model to FormDetail schema."""
    resp_count = (
        response_count
        if response_count is not None
        else (len(form.responses) if hasattr(form, "responses") and form.responses is not None else 0)
    )

    questions_list = [
        QuestionResponse(
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
        for q in sorted(form.questions, key=lambda x: x.position)
    ]

    return FormDetail(
        id=form.id,
        title=form.title,
        slug=form.slug,
        status=form.status.value if hasattr(form.status, "value") else str(form.status),
        share_url=build_share_url(form.slug),
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
        view_count=form.view_count,
        response_count=resp_count,
        published_at=form.published_at,
        created_at=form.created_at,
        updated_at=form.updated_at,
        questions=questions_list,
    )


def list_forms(
    db: Session,
    user_id: str,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort: Optional[str] = "updated_desc",
) -> List[FormSummary]:
    """List all forms belonging to the user with counts and filters."""
    query = db.query(Form).filter(Form.user_id == user_id)

    if search:
        query = query.filter(Form.title.ilike(f"%{search.strip()}%"))

    if status:
        status_val = status.lower()
        if status_val in ("draft", "published"):
            query = query.filter(Form.status == status_val)

    if sort == "created_desc":
        query = query.order_by(Form.created_at.desc())
    elif sort == "title_asc":
        query = query.order_by(Form.title.asc())
    else:  # updated_desc default
        query = query.order_by(Form.updated_at.desc())

    forms = query.all()

    # Efficiently fetch question and response counts
    form_ids = [f.id for f in forms]
    q_counts: Dict[str, int] = {}
    r_counts: Dict[str, int] = {}

    if form_ids:
        q_results = (
            db.query(Question.form_id, func.count(Question.id))
            .filter(Question.form_id.in_(form_ids))
            .group_by(Question.form_id)
            .all()
        )
        q_counts = {form_id: count for form_id, count in q_results}

        r_results = (
            db.query(Response.form_id, func.count(Response.id))
            .filter(Response.form_id.in_(form_ids))
            .group_by(Response.form_id)
            .all()
        )
        r_counts = {form_id: count for form_id, count in r_results}

    items = []
    for f in forms:
        items.append(
            FormSummary(
                id=f.id,
                title=f.title,
                slug=f.slug,
                status=f.status.value if hasattr(f.status, "value") else str(f.status),
                question_count=q_counts.get(f.id, 0),
                response_count=r_counts.get(f.id, 0),
                view_count=f.view_count,
                share_url=build_share_url(f.slug),
                created_at=f.created_at,
                updated_at=f.updated_at,
            )
        )
    return items


def create_form(db: Session, user_id: str, data: FormCreate) -> FormDetail:
    """Create a new draft form."""
    new_slug = generate_slug()
    while db.query(Form).filter(Form.slug == new_slug).first() is not None:
        new_slug = generate_slug()

    form = Form(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=data.title or "Untitled form",
        slug=new_slug,
        status=FormStatus.DRAFT,
        welcome_enabled=False,
        welcome_title=None,
        welcome_description=None,
        welcome_button_text="Start",
        thankyou_title="Thanks for completing this form!",
        thankyou_message="Your response has been recorded.",
        theme={},
        view_count=0,
        published_at=None,
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form_to_detail(form, response_count=0)


def get_form_or_404(db: Session, user_id: str, form_id: str) -> Form:
    """Retrieve form ORM object ensuring ownership."""
    form = db.query(Form).filter(Form.id == form_id, Form.user_id == user_id).first()
    if not form:
        raise NotFoundError(f"Form '{form_id}' not found")
    return form


def get_form_detail(db: Session, user_id: str, form_id: str) -> FormDetail:
    """Get complete form details including questions."""
    form = get_form_or_404(db, user_id, form_id)
    resp_count = db.query(func.count(Response.id)).filter(Response.form_id == form_id).scalar() or 0
    return form_to_detail(form, response_count=resp_count)


def update_form(db: Session, user_id: str, form_id: str, data: FormUpdate) -> FormDetail:
    """Update form fields with nested merging."""
    form = get_form_or_404(db, user_id, form_id)

    if data.title is not None:
        form.title = data.title

    if data.welcome is not None:
        if "enabled" in data.welcome:
            form.welcome_enabled = bool(data.welcome["enabled"])
        if "title" in data.welcome:
            form.welcome_title = data.welcome["title"]
        if "description" in data.welcome:
            form.welcome_description = data.welcome["description"]
        if "button_text" in data.welcome and data.welcome["button_text"]:
            form.welcome_button_text = data.welcome["button_text"]

    if data.thank_you is not None:
        if "title" in data.thank_you and data.thank_you["title"]:
            form.thankyou_title = data.thank_you["title"]
        if "message" in data.thank_you:
            form.thankyou_message = data.thank_you["message"]

    if data.theme is not None:
        current_theme = dict(form.theme or {})
        current_theme.update(data.theme)
        form.theme = current_theme

    form.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(form)

    resp_count = db.query(func.count(Response.id)).filter(Response.form_id == form_id).scalar() or 0
    return form_to_detail(form, response_count=resp_count)


def delete_form(db: Session, user_id: str, form_id: str) -> None:
    """Delete a form and cascade all child records."""
    form = get_form_or_404(db, user_id, form_id)
    db.delete(form)
    db.commit()


def duplicate_form(db: Session, user_id: str, form_id: str) -> FormDetail:
    """Duplicate form with questions, renewing IDs, without copying responses."""
    original = get_form_or_404(db, user_id, form_id)

    new_slug = generate_slug()
    while db.query(Form).filter(Form.slug == new_slug).first() is not None:
        new_slug = generate_slug()

    title_copy = f"Copy of {original.title}"[:200]
    new_form_id = str(uuid.uuid4())

    new_form = Form(
        id=new_form_id,
        user_id=user_id,
        title=title_copy,
        slug=new_slug,
        status=FormStatus.DRAFT,
        welcome_enabled=original.welcome_enabled,
        welcome_title=original.welcome_title,
        welcome_description=original.welcome_description,
        welcome_button_text=original.welcome_button_text,
        thankyou_title=original.thankyou_title,
        thankyou_message=original.thankyou_message,
        theme=copy.deepcopy(original.theme or {}),
        view_count=0,
        published_at=None,
    )
    db.add(new_form)

    # Copy questions with new question IDs and new option IDs
    for q in sorted(original.questions, key=lambda x: x.position):
        settings_copy = copy.deepcopy(q.settings or {})
        if "options" in settings_copy and isinstance(settings_copy["options"], list):
            new_options = []
            for opt in settings_copy["options"]:
                if isinstance(opt, dict):
                    opt_c = dict(opt)
                    opt_c["id"] = str(uuid.uuid4())
                    new_options.append(opt_c)
                else:
                    new_options.append(opt)
            settings_copy["options"] = new_options

        new_q = Question(
            id=str(uuid.uuid4()),
            form_id=new_form_id,
            position=q.position,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            settings=settings_copy,
        )
        db.add(new_q)

    db.commit()
    db.refresh(new_form)
    return form_to_detail(new_form, response_count=0)


def publish_form(db: Session, user_id: str, form_id: str) -> FormDetail:
    """Publish form; requires at least one question."""
    form = get_form_or_404(db, user_id, form_id)
    q_count = db.query(func.count(Question.id)).filter(Question.form_id == form_id).scalar() or 0
    if q_count == 0:
        raise InvalidStateError("Cannot publish a form with no questions")

    form.status = FormStatus.PUBLISHED
    form.published_at = datetime.now(timezone.utc)
    form.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(form)

    resp_count = db.query(func.count(Response.id)).filter(Response.form_id == form_id).scalar() or 0
    return form_to_detail(form, response_count=resp_count)


def unpublish_form(db: Session, user_id: str, form_id: str) -> FormDetail:
    """Unpublish form back to draft status."""
    form = get_form_or_404(db, user_id, form_id)
    form.status = FormStatus.DRAFT
    form.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(form)

    resp_count = db.query(func.count(Response.id)).filter(Response.form_id == form_id).scalar() or 0
    return form_to_detail(form, response_count=resp_count)
