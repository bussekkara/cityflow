from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    Numeric
)
from sqlalchemy.sql import func

from database.connection import Base


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    category_id = Column(
        Integer,
        ForeignKey("request_categories.id"),
        nullable=False
    )

    citizen_name = Column(
        String(150),
        nullable=False
    )

    citizen_email = Column(
        String(150)
    )

    address = Column(
        Text,
        nullable=False
    )

    latitude = Column(
        Numeric(9, 6)
    )

    longitude = Column(
        Numeric(9, 6)
    )

    priority = Column(
        String(20),
        nullable=False,
        default="normal"
    )

    status = Column(
        String(30),
        nullable=False,
        default="submitted"
    )

    created_by = Column(
    Integer,
    ForeignKey("users.id"),
    nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )