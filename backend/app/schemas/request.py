from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class ServiceRequestCreate(BaseModel):
    title: str
    description: str
    category_id: int

    citizen_name: str
    citizen_email: Optional[EmailStr] = None

    address: str

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    priority: Literal[
        "low",
        "normal",
        "high",
        "urgent"
    ] = "normal"