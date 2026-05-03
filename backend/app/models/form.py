import enum
from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_editable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    creator: Mapped["User | None"] = relationship("User", foreign_keys=[created_by])
    audience: Mapped[list["FormAudience"]] = relationship("FormAudience", back_populates="form", cascade="all, delete-orphan")
    fields: Mapped[list["FormField"]] = relationship("FormField", back_populates="form", cascade="all, delete-orphan", order_by="FormField.order")
    responses: Mapped[list["FormResponse"]] = relationship("FormResponse", back_populates="form", cascade="all, delete-orphan")
