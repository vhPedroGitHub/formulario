from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    answer_id: Mapped[int] = mapped_column(ForeignKey("form_answers.id", ondelete="CASCADE"), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=True)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    answer: Mapped["FormAnswer"] = relationship("FormAnswer", back_populates="uploaded_files")
