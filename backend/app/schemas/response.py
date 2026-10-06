from datetime import datetime
from typing import Any, List
from pydantic import BaseModel


class AnswerSubmit(BaseModel):
    question_id: str
    value: Any


class ResponseSubmit(BaseModel):
    answers: List[AnswerSubmit]


class AnswerItem(BaseModel):
    question_id: str
    value: Any


class ResponseItem(BaseModel):
    id: str
    submitted_at: datetime
    answers: List[AnswerItem]


class SubmitResult(BaseModel):
    id: str
    submitted_at: datetime
