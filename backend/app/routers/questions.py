from typing import Dict, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.question import (
    QuestionCreate,
    QuestionOrderUpdate,
    QuestionResponse,
    QuestionUpdate,
)
from app.services import question_service

router = APIRouter(prefix="/forms/{form_id}/questions", tags=["questions"])


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    form_id: str,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return question_service.create_question(
        db=db, user_id=current_user.id, form_id=form_id, data=data
    )


@router.patch("/{question_id}", response_model=QuestionResponse)
def update_question(
    form_id: str,
    question_id: str,
    data: QuestionUpdate,
    confirm: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return question_service.update_question(
        db=db,
        user_id=current_user.id,
        form_id=form_id,
        question_id=question_id,
        data=data,
        confirm=confirm,
    )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    form_id: str,
    question_id: str,
    confirm: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question_service.delete_question(
        db=db,
        user_id=current_user.id,
        form_id=form_id,
        question_id=question_id,
        confirm=confirm,
    )


@router.put("/order", response_model=Dict[str, List[QuestionResponse]])
def reorder_questions(
    form_id: str,
    data: QuestionOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    questions = question_service.reorder_questions(
        db=db,
        user_id=current_user.id,
        form_id=form_id,
        question_ids=data.question_ids,
    )
    return {"questions": questions}
