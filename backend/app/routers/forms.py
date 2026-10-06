from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.form import FormCreate, FormDetail, FormSummary, FormUpdate
from app.schemas.summary import FormSummaryResponse
from app.services import form_service, summary_service

router = APIRouter(prefix="/forms", tags=["forms"])


@router.get("", response_model=Dict[str, List[FormSummary]])
def list_forms(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort: Optional[str] = Query("updated_desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = form_service.list_forms(
        db=db,
        user_id=current_user.id,
        search=search,
        status=status,
        sort=sort,
    )
    return {"items": items}


@router.post("", response_model=FormDetail, status_code=status.HTTP_201_CREATED)
def create_form(
    data: FormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.create_form(db=db, user_id=current_user.id, data=data)


@router.get("/{form_id}", response_model=FormDetail)
def get_form(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.get_form_detail(db=db, user_id=current_user.id, form_id=form_id)


@router.patch("/{form_id}", response_model=FormDetail)
def update_form(
    form_id: str,
    data: FormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.update_form(
        db=db, user_id=current_user.id, form_id=form_id, data=data
    )


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    form_service.delete_form(db=db, user_id=current_user.id, form_id=form_id)


@router.post(
    "/{form_id}/duplicate",
    response_model=FormDetail,
    status_code=status.HTTP_201_CREATED,
)
def duplicate_form(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.duplicate_form(db=db, user_id=current_user.id, form_id=form_id)


@router.post("/{form_id}/publish", response_model=FormDetail)
def publish_form(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.publish_form(db=db, user_id=current_user.id, form_id=form_id)


@router.post("/{form_id}/unpublish", response_model=FormDetail)
def unpublish_form(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.unpublish_form(db=db, user_id=current_user.id, form_id=form_id)


@router.get("/{form_id}/summary", response_model=FormSummaryResponse)
def get_form_summary(
    form_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return summary_service.compute_form_summary(
        db=db, user_id=current_user.id, form_id=form_id
    )
