from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.form import PublicForm
from app.schemas.response import ResponseSubmit, SubmitResult
from app.services import response_service

router = APIRouter(prefix="/public/forms", tags=["public"])


@router.get("/{slug}", response_model=PublicForm)
def get_public_form(
    slug: str,
    db: Session = Depends(get_db),
):
    return response_service.get_public_form(db=db, slug=slug)


@router.post("/{slug}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_form_view(
    slug: str,
    db: Session = Depends(get_db),
):
    response_service.record_form_view(db=db, slug=slug)


@router.post(
    "/{slug}/responses",
    response_model=SubmitResult,
    status_code=status.HTTP_201_CREATED,
)
def submit_response(
    slug: str,
    data: ResponseSubmit,
    db: Session = Depends(get_db),
):
    return response_service.submit_response(db=db, slug=slug, submission=data)
