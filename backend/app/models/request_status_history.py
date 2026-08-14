from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from database.connection import Base


class RequestStatusHistory(Base):
    __tablename__ = "request_status_history"

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

    old_status = Column(
        String(30)
    )

    new_status = Column(
        String(30),
        nullable=False
    )

    changed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    note = Column(Text)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )