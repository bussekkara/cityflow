from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func

from database.connection import Base


class RequestCategory(Base):
    __tablename__ = "request_categories"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        unique=True,
        nullable=False
    )

    description = Column(Text)

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )