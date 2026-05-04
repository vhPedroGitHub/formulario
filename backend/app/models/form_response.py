from datetime import datetime, timezone
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class FormResponse(Base):
    __tablename__ = "form_responses"
    __table_args__ = (UniqueConstraint("form_id", "user_id", name="uq_response_form_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    form_version: Mapped[int | None] = mapped_column(Integer, nullable=True)

    form: Mapped["Form"] = relationship("Form", back_populates="responses")
    user: Mapped["User"] = relationship("User", back_populates="responses")
    answers: Mapped[list["FormAnswer"]] = relationship("FormAnswer", back_populates="response", cascade="all, delete-orphan")
