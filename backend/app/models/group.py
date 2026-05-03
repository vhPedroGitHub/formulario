from datetime import datetime, timezone
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Group(Base):
    __tablename__ = "groups"
    __table_args__ = (UniqueConstraint("career_id", "year", "group_number", name="uq_group_career_year_num"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    career_id: Mapped[int] = mapped_column(ForeignKey("careers.id", ondelete="CASCADE"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    group_number: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    @property
    def display_name(self) -> str:
        return f"Año {self.year} - Grupo {self.group_number}"

    career: Mapped["Career"] = relationship("Career", back_populates="groups")
    users: Mapped[list["User"]] = relationship("User", back_populates="group")
