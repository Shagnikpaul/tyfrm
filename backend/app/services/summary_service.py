from typing import Any, Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.answer import Answer
from app.models.form import Form
from app.models.question import Question, QuestionType
from app.models.response import Response
from app.schemas.summary import FormSummaryResponse, QuestionSummaryItem
from app.services.form_service import get_form_or_404


def compute_form_summary(db: Session, user_id: str, form_id: str) -> FormSummaryResponse:
    """Compute per-form and per-question analytics from stored answers."""
    form = get_form_or_404(db, user_id, form_id)

    total_responses = (
        db.query(func.count(Response.id)).filter(Response.form_id == form_id).scalar()
        or 0
    )
    views = form.view_count

    completion_rate: Optional[float] = None
    if views > 0:
        raw_rate = total_responses / views
        completion_rate = round(min(1.0, raw_rate), 4)

    # Fetch all questions ordered by position
    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.asc())
        .all()
    )

    # Fetch all answers for this form joined with responses to order recent text answers
    answers_query = (
        db.query(Answer, Response.submitted_at)
        .join(Response, Answer.response_id == Response.id)
        .filter(Response.form_id == form_id)
        .order_by(Response.submitted_at.desc())
        .all()
    )

    # Group answers by question_id
    answers_by_question: Dict[str, List[Any]] = {q.id: [] for q in questions}
    for ans, submitted_at in answers_query:
        if ans.question_id in answers_by_question:
            answers_by_question[ans.question_id].append((ans.value, submitted_at))

    summary_items: List[QuestionSummaryItem] = []

    for q in questions:
        q_type_str = q.type.value if hasattr(q.type, "value") else str(q.type)
        q_answers_entries = answers_by_question.get(q.id, [])
        answered_count = len(q_answers_entries)
        skipped_count = max(0, total_responses - answered_count)

        raw_values = [entry[0] for entry in q_answers_entries]
        stats = compute_question_stats(q_type_str, q.settings or {}, raw_values)

        summary_items.append(
            QuestionSummaryItem(
                question_id=q.id,
                type=q_type_str,
                title=q.title,
                answered_count=answered_count,
                skipped_count=skipped_count,
                stats=stats,
            )
        )

    return FormSummaryResponse(
        form_id=form.id,
        total_responses=total_responses,
        views=views,
        completion_rate=completion_rate,
        questions=summary_items,
    )


def compute_question_stats(
    q_type: str,
    settings: Dict[str, Any],
    values: List[Any],
) -> Dict[str, Any]:
    """Compute type-specific statistics from stored values."""
    if q_type in ("multiple_choice", "dropdown"):
        current_options = settings.get("options", [])
        current_labels = [
            opt["label"] if isinstance(opt, dict) else opt.label
            for opt in current_options
        ]

        counts: Dict[str, int] = {}
        for val in values:
            if isinstance(val, list):
                for item in val:
                    label = str(item)
                    counts[label] = counts.get(label, 0) + 1
            else:
                label = str(val)
                counts[label] = counts.get(label, 0) + 1

        options_list = []
        for cl in current_labels:
            options_list.append({
                "label": cl,
                "count": counts.get(cl, 0),
                "is_orphan": False,
            })

        # Append orphan labels (stored values not in current_labels)
        current_labels_set = set(current_labels)
        orphan_labels = [k for k in counts.keys() if k not in current_labels_set]
        for ol in orphan_labels:
            options_list.append({
                "label": ol,
                "count": counts[ol],
                "is_orphan": True,
            })

        return {"options": options_list}

    elif q_type == "yes_no":
        yes_count = sum(1 for v in values if v is True)
        no_count = sum(1 for v in values if v is False)
        return {"yes": yes_count, "no": no_count}

    elif q_type == "rating":
        valid_ratings = [v for v in values if isinstance(v, (int, float)) and not isinstance(v, bool)]
        steps = settings.get("steps", 5)
        max_bucket = steps
        if valid_ratings:
            highest_val = int(max(valid_ratings))
            max_bucket = max(steps, highest_val)

        distribution_counts: Dict[int, int] = {i: 0 for i in range(1, max_bucket + 1)}
        for vr in valid_ratings:
            ivr = int(vr)
            if ivr in distribution_counts:
                distribution_counts[ivr] += 1
            elif ivr > 0:
                distribution_counts[ivr] = 1

        avg = None
        if valid_ratings:
            avg = round(float(sum(valid_ratings)) / len(valid_ratings), 1)

        distribution = [
            {"value": step, "count": distribution_counts.get(step, 0)}
            for step in range(1, max_bucket + 1)
        ]
        return {
            "average": avg,
            "distribution": distribution,
        }

    elif q_type == "number":
        valid_nums = [v for v in values if isinstance(v, (int, float)) and not isinstance(v, bool)]
        if not valid_nums:
            return {"min": None, "max": None, "average": None}
        return {
            "min": min(valid_nums),
            "max": max(valid_nums),
            "average": round(float(sum(valid_nums)) / len(valid_nums), 1),
        }

    elif q_type in ("short_text", "long_text", "email"):
        # Values are already in newest-first order
        recent_values = [str(v) for v in values[:5]]
        return {"recent": recent_values}

    return {}
