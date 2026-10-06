from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.question import QuestionResponse


class WelcomeScreen(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: bool = False
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    button_text: str = Field(default="Start", max_length=50)


class ThankYouScreen(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(default="Thanks for completing this form!", max_length=200)
    message: Optional[str] = Field(default="Your response has been recorded.", max_length=1000)


class FormCreate(BaseModel):
    title: Optional[str] = Field(default="Untitled form", max_length=200)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> str:
        if v is None:
            return "Untitled form"
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty")
        return trimmed


class FormUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    welcome: Optional[Dict[str, Any]] = None
    thank_you: Optional[Dict[str, Any]] = None
    theme: Optional[Dict[str, Any]] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty")
        return trimmed


class FormSummary(BaseModel):
    id: str
    title: str
    slug: str
    status: str
    question_count: int
    response_count: int
    view_count: int
    share_url: str
    created_at: datetime
    updated_at: datetime


class FormDetail(BaseModel):
    id: str
    title: str
    slug: str
    status: str
    share_url: str
    welcome: WelcomeScreen
    thank_you: ThankYouScreen
    theme: Dict[str, Any]
    view_count: int
    response_count: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse] = Field(default_factory=list)


class PublicQuestion(BaseModel):
    id: str
    position: int
    type: str
    title: str
    description: Optional[str] = None
    required: bool
    settings: Dict[str, Any]


class PublicForm(BaseModel):
    slug: str
    title: str
    welcome: WelcomeScreen
    thank_you: ThankYouScreen
    theme: Dict[str, Any]
    questions: List[PublicQuestion] = Field(default_factory=list)
