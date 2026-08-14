from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from backend.app.models.request_status_history import RequestStatusHistory


router = APIRouter(
    prefix="/status-history",
    tags=["Status History"]
)


@router.get("/{request_id}")
def get_status_history(
    request_id: int,
    db: Session = Depends(get_db)
):
    history = (
        db.query(RequestStatusHistory)
        .filter(
            RequestStatusHistory.request_id == request_id
        )
        .order_by(
            RequestStatusHistory.created_at.asc()
        )
        .all()
    )

    return history