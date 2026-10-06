import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.models.question import QuestionType


class QuestionOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str = Field(min_length=1, max_length=200)

    @field_validator("label")
    @classmethod
    def validate_label(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Option label cannot be empty")
        return trimmed


class ShortTextSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_length: int = Field(default=255, ge=1, le=1000)
    placeholder: str = Field(default="")


class LongTextSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_length: int = Field(default=2000, ge=1, le=10000)
    placeholder: str = Field(default="")


class MultipleChoiceSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    options: List[QuestionOption] = Field(min_length=1)
    allow_multiple: bool = Field(default=False)

    @field_validator("options")
    @classmethod
    def validate_unique_labels(cls, options: List[QuestionOption]) -> List[QuestionOption]:
        seen = set()
        for opt in options:
            lowered = opt.label.lower()
            if lowered in seen:
                raise ValueError(f"Duplicate option label: '{opt.label}'")
            seen.add(lowered)
        return options


class DropdownSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    options: List[QuestionOption] = Field(min_length=1)

    @field_validator("options")
    @classmethod
    def validate_unique_labels(cls, options: List[QuestionOption]) -> List[QuestionOption]:
        seen = set()
        for opt in options:
            lowered = opt.label.lower()
            if lowered in seen:
                raise ValueError(f"Duplicate option label: '{opt.label}'")
            seen.add(lowered)
        return options


class EmailSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")


class NumberSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    min: Optional[Union[int, float]] = None
    max: Optional[Union[int, float]] = None

    @model_validator(mode="after")
    def validate_min_max(self) -> "NumberSettings":
        if self.min is not None and self.max is not None:
            if self.min > self.max:
                raise ValueError("min must be less than or equal to max")
        return self


class YesNoSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RatingSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    steps: int = Field(default=5, ge=2, le=10)


SETTINGS_MODELS = {
    QuestionType.SHORT_TEXT: ShortTextSettings,
    QuestionType.LONG_TEXT: LongTextSettings,
    QuestionType.MULTIPLE_CHOICE: MultipleChoiceSettings,
    QuestionType.DROPDOWN: DropdownSettings,
    QuestionType.EMAIL: EmailSettings,
    QuestionType.NUMBER: NumberSettings,
    QuestionType.YES_NO: YesNoSettings,
    QuestionType.RATING: RatingSettings,
}


def get_default_settings(q_type: QuestionType) -> Dict[str, Any]:
    model_cls = SETTINGS_MODELS.get(q_type)
    if not model_cls:
        return {}
    if q_type == QuestionType.MULTIPLE_CHOICE:
        return {
            "options": [
                {"id": str(uuid.uuid4()), "label": "Option 1"},
                {"id": str(uuid.uuid4()), "label": "Option 2"},
            ],
            "allow_multiple": False,
        }
    elif q_type == QuestionType.DROPDOWN:
        return {
            "options": [
                {"id": str(uuid.uuid4()), "label": "Option 1"},
                {"id": str(uuid.uuid4()), "label": "Option 2"},
            ]
        }
    return model_cls().model_dump()


def validate_settings(q_type: QuestionType, settings_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    model_cls = SETTINGS_MODELS.get(q_type)
    if not model_cls:
        return {}
    if settings_data is None:
        return get_default_settings(q_type)

    # For options, ensure each option has an ID if missing
    if q_type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN) and "options" in settings_data:
        options = settings_data.get("options")
        if isinstance(options, list):
            normalized_opts = []
            for opt in options:
                if isinstance(opt, dict):
                    opt_copy = dict(opt)
                    if "id" not in opt_copy or not opt_copy["id"]:
                        opt_copy["id"] = str(uuid.uuid4())
                    normalized_opts.append(opt_copy)
                else:
                    normalized_opts.append(opt)
            settings_data = {**settings_data, "options": normalized_opts}

    parsed = model_cls.model_validate(settings_data)
    return parsed.model_dump()


class QuestionCreate(BaseModel):
    type: QuestionType
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=1000)
    required: bool = Field(default=False)
    settings: Optional[Dict[str, Any]] = None
    position: Optional[int] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty")
        return trimmed


class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=1000)
    required: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None
    type: Optional[QuestionType] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty")
        return trimmed


class QuestionResponse(BaseModel):
    id: str
    form_id: str
    position: int
    type: str
    title: str
    description: Optional[str] = None
    required: bool
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class QuestionOrderUpdate(BaseModel):
    question_ids: List[str]
