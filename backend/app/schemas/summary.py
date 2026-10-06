from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class QuestionSummaryItem(BaseModel):
    question_id: str
    type: str
    title: str
    answered_count: int
    skipped_count: int
    stats: Dict[str, Any]


class FormSummaryResponse(BaseModel):
    form_id: str
    total_responses: int
    views: int
    completion_rate: Optional[float] = None
    questions: List[QuestionSummaryItem]
