from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Career(Base):
    __tablename__ = "careers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)
    duration_years: Mapped[int] = mapped_column(Integer, nullable=False)
    groups_per_year: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    faculty: Mapped["Faculty"] = relationship("Faculty", back_populates="careers")
    groups: Mapped[list["Group"]] = relationship("Group", back_populates="career", cascade="all, delete-orphan")
    users: Mapped[list["User"]] = relationship("User", back_populates="career")
