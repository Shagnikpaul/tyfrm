from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.response import ResponseItem
from app.services import response_service

router = APIRouter(prefix="/forms/{form_id}/responses", tags=["responses"])


@router.get("", response_model=PaginatedResponse[ResponseItem])
def list_responses(
    form_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("submitted_desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return response_service.list_responses(
        db=db,
        user_id=current_user.id,
        form_id=form_id,
        page=page,
        page_size=page_size,
        sort=sort,
    )


@router.get("/{response_id}", response_model=ResponseItem)
def get_response(
    form_id: str,
    response_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return response_service.get_response(
        db=db,
        user_id=current_user.id,
        form_id=form_id,
        response_id=response_id,
    )
