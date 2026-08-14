from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from database.connection import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    request_id = Column(
        Integer,
        ForeignKey("service_requests.id"),
        nullable=False
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="assigned"
    )

    notes = Column(Text)

    started_at = Column(
        DateTime,
        nullable=True
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )