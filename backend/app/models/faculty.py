from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    careers: Mapped[list["Career"]] = relationship("Career", back_populates="faculty", cascade="all, delete-orphan")
    users: Mapped[list["User"]] = relationship("User", back_populates="faculty")
