import string
import secrets
from pydantic import ValidationError as PydanticValidationError
from app.models.question import QuestionType
from app.schemas.question import validate_settings, get_default_settings
from app.services.validation import validate_answer, AnswerError


def generate_slug(length: int = 8) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def test_settings_validation():
    print("Testing settings validation...")
    # 1. Defaults
    for q_type in QuestionType:
        defaults = get_default_settings(q_type)
        validated = validate_settings(q_type, None)
        assert isinstance(validated, dict)

    # 2. Unknown keys rejected
    try:
        validate_settings(QuestionType.SHORT_TEXT, {"max_length": 100, "unknown_field": 123})
        assert False, "Unknown field was not rejected"
    except (PydanticValidationError, ValueError):
        pass

    # 3. Number settings: min > max must fail
    try:
        validate_settings(QuestionType.NUMBER, {"min": 50, "max": 10})
        assert False, "min > max was not rejected"
    except (PydanticValidationError, ValueError):
        pass

    # 4. Rating settings: steps must be 2..10
    try:
        validate_settings(QuestionType.RATING, {"steps": 15})
        assert False, "Rating steps > 10 was not rejected"
    except (PydanticValidationError, ValueError):
        pass

    # 5. Multiple choice duplicate options case-insensitively
    try:
        validate_settings(QuestionType.MULTIPLE_CHOICE, {
            "options": [{"label": "Apple"}, {"label": "apple"}],
            "allow_multiple": False,
        })
        assert False, "Duplicate option label was not rejected"
    except (PydanticValidationError, ValueError):
        pass

    print("Settings validation passed!")


def test_answer_validation():
    print("Testing answer validation...")

    # short_text
    st_settings = {"max_length": 10}
    assert validate_answer("short_text", st_settings, True, "  hello  ") == "hello"
    try:
        validate_answer("short_text", st_settings, True, "toolongstringhere")
        assert False, "Did not catch max length"
    except AnswerError as e:
        assert e.message == "Maximum 10 characters"

    # email
    assert validate_answer("email", {}, True, " Test@EXAMPLE.com ") == "test@example.com"
    try:
        validate_answer("email", {}, True, "invalid-email")
        assert False, "Did not catch invalid email"
    except AnswerError as e:
        assert e.message == "Enter a valid email address"

    # number
    num_settings = {"min": 5, "max": 100}
    assert validate_answer("number", num_settings, True, 42) == 42
    assert validate_answer("number", num_settings, True, 42.5) == 42.5
    try:
        validate_answer("number", num_settings, True, "42")
        assert False, "String number not rejected"
    except AnswerError as e:
        assert e.message == "Enter a valid number"
    try:
        validate_answer("number", num_settings, True, True)
        assert False, "Boolean not rejected as number"
    except AnswerError as e:
        assert e.message == "Enter a valid number"
    try:
        validate_answer("number", num_settings, True, 2)
        assert False, "Min violation not caught"
    except AnswerError as e:
        assert e.message == "Must be at least 5"
    try:
        validate_answer("number", num_settings, True, 200)
        assert False, "Max violation not caught"
    except AnswerError as e:
        assert e.message == "Must be at most 100"

    # yes_no
    assert validate_answer("yes_no", {}, True, True) is True
    assert validate_answer("yes_no", {}, True, False) is False
    try:
        validate_answer("yes_no", {}, True, "yes")
        assert False, "String not rejected for yes_no"
    except AnswerError as e:
        assert e.message == "Choose Yes or No"

    # rating
    rate_settings = {"steps": 5}
    assert validate_answer("rating", rate_settings, True, 4) == 4
    try:
        validate_answer("rating", rate_settings, True, 6)
        assert False, "Rating out of range not caught"
    except AnswerError as e:
        assert e.message == "Choose a rating between 1 and 5"

    # multiple_choice single
    mc_single = {
        "options": [{"id": "1", "label": "Option A"}, {"id": "2", "label": "Option B"}],
        "allow_multiple": False,
    }
    assert validate_answer("multiple_choice", mc_single, True, "Option A") == "Option A"
    try:
        validate_answer("multiple_choice", mc_single, True, "Option C")
        assert False, "Invalid option not caught"
    except AnswerError as e:
        assert e.message == "Choose one of the available options"

    # multiple_choice multi
    mc_multi = {
        "options": [{"id": "1", "label": "Option A"}, {"id": "2", "label": "Option B"}],
        "allow_multiple": True,
    }
    assert validate_answer("multiple_choice", mc_multi, True, ["Option A", "Option B"]) == ["Option A", "Option B"]
    try:
        validate_answer("multiple_choice", mc_multi, True, ["Option A", "Option A"])
        assert False, "Duplicate multi-choice selection not caught"
    except AnswerError as e:
        assert e.message == "Choose from the available options"

    # dropdown
    dd_settings = {"options": [{"id": "1", "label": "Red"}, {"id": "2", "label": "Blue"}]}
    assert validate_answer("dropdown", dd_settings, True, "Red") == "Red"
    try:
        validate_answer("dropdown", dd_settings, True, "Green")
        assert False, "Invalid dropdown option not caught"
    except AnswerError as e:
        assert e.message == "Choose one of the available options"

    # Optional skipped answer returns None
    assert validate_answer("short_text", st_settings, False, "") is None
    assert validate_answer("short_text", st_settings, False, None) is None

    # Required skipped answer raises
    try:
        validate_answer("short_text", st_settings, True, "   ")
        assert False, "Required empty answer not caught"
    except AnswerError as e:
        assert e.message == "This question is required"

    print("Answer validation passed!")


def test_slug_generation():
    print("Testing slug generation...")
    for _ in range(50):
        slug = generate_slug()
        assert len(slug) == 8
        assert slug.isalnum()
    print("Slug generation passed!")


def main():
    test_settings_validation()
    test_answer_validation()
    test_slug_generation()
    print("PHASE 2 VERIFICATION PASSED!")


if __name__ == "__main__":
    main()
