from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


# -------------------------
# CREATE WORK ORDER
# -------------------------

class WorkOrderCreate(BaseModel):
    request_id: int
    assigned_to: Optional[int] = None
    notes: Optional[str] = None


# -------------------------
# WORK ORDER RESPONSE
# -------------------------

class WorkOrderResponse(BaseModel):
    id: int
    request_id: int
    assigned_to: Optional[int] = None
    status: str
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------
# UPDATE WORK ORDER STATUS
# -------------------------

class WorkOrderStatusUpdate(BaseModel):
    status: Literal[
        "assigned",
        "in_progress",
        "completed"
    ]