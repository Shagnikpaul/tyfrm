from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.core.errors import UnauthorizedError
from app.seed import seed_data

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reset", status_code=status.HTTP_204_NO_CONTENT)
def reset_database(
    x_admin_token: str = Header(None, alias="X-Admin-Token"),
    db: Session = Depends(get_db),
):
    if not x_admin_token or x_admin_token != settings.ADMIN_TOKEN:
        raise UnauthorizedError("Invalid or missing admin token")

    seed_data(db, reset=True)
