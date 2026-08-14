from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from database.connection import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )
