import math
from typing import Any, Dict, List, Optional
from email_validator import validate_email, EmailNotValidError


class AnswerError(Exception):
    """Raised when an answer fails validation rules."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def is_empty_answer(value: Any) -> bool:
    """Check if value represents a skipped or empty answer."""
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    if isinstance(value, list) and len(value) == 0:
        return True
    return False


def validate_answer(
    question_type: str,
    settings: Dict[str, Any],
    required: bool,
    value: Any,
) -> Optional[Any]:
    """
    Pure validation function for a single question answer against current settings.
    Returns cleaned value to be stored in DB, or None if skipped optional question.
    Raises AnswerError with exact user-facing message on validation failure.
    """
    # 1. Check if unanswered
    if is_empty_answer(value):
        if required:
            raise AnswerError("This question is required")
        return None

    # 2. Per-type validation
    if question_type in ("short_text", "long_text"):
        if not isinstance(value, str):
            raise AnswerError("Enter a valid text")
        trimmed = value.strip()
        if not trimmed:
            if required:
                raise AnswerError("This question is required")
            return None

        default_max = 255 if question_type == "short_text" else 2000
        max_length = settings.get("max_length", default_max)
        if len(trimmed) > max_length:
            raise AnswerError(f"Maximum {max_length} characters")
        return trimmed

    elif question_type == "email":
        if not isinstance(value, str):
            raise AnswerError("Enter a valid email address")
        trimmed = value.strip()
        if not trimmed:
            if required:
                raise AnswerError("This question is required")
            return None
        try:
            email_info = validate_email(trimmed, check_deliverability=False)
            return email_info.normalized.lower()
        except (EmailNotValidError, Exception):
            raise AnswerError("Enter a valid email address")

    elif question_type == "number":
        # Must be JSON number, not bool, not string
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise AnswerError("Enter a valid number")
        if not math.isfinite(value):
            raise AnswerError("Enter a valid number")

        min_val = settings.get("min")
        max_val = settings.get("max")
        if min_val is not None and value < min_val:
            raise AnswerError(f"Must be at least {min_val}")
        if max_val is not None and value > max_val:
            raise AnswerError(f"Must be at most {max_val}")
        return value

    elif question_type == "yes_no":
        if not isinstance(value, bool):
            raise AnswerError("Choose Yes or No")
        return value

    elif question_type == "rating":
        steps = settings.get("steps", 5)
        if isinstance(value, bool) or not isinstance(value, int):
            raise AnswerError(f"Choose a rating between 1 and {steps}")
        if value < 1 or value > steps:
            raise AnswerError(f"Choose a rating between 1 and {steps}")
        return value

    elif question_type == "multiple_choice":
        allow_multiple = settings.get("allow_multiple", False)
        options = settings.get("options", [])
        valid_labels = [
            opt["label"] if isinstance(opt, dict) else opt.label for opt in options
        ]

        if allow_multiple:
            if not isinstance(value, list):
                raise AnswerError("Choose from the available options")
            if len(value) == 0:
                if required:
                    raise AnswerError("This question is required")
                return None
            if len(value) != len(set(value)):
                raise AnswerError("Choose from the available options")
            for item in value:
                if not isinstance(item, str) or item not in valid_labels:
                    raise AnswerError("Choose from the available options")
            return value
        else:
            if not isinstance(value, str):
                raise AnswerError("Choose one of the available options")
            trimmed = value.strip()
            if not trimmed:
                if required:
                    raise AnswerError("This question is required")
                return None
            if trimmed not in valid_labels:
                raise AnswerError("Choose one of the available options")
            return trimmed

    elif question_type == "dropdown":
        options = settings.get("options", [])
        valid_labels = [
            opt["label"] if isinstance(opt, dict) else opt.label for opt in options
        ]
        if not isinstance(value, str):
            raise AnswerError("Choose one of the available options")
        trimmed = value.strip()
        if not trimmed:
            if required:
                raise AnswerError("This question is required")
            return None
        if trimmed not in valid_labels:
            raise AnswerError("Choose one of the available options")
        return trimmed

    else:
        raise AnswerError(f"Unsupported question type: {question_type}")
