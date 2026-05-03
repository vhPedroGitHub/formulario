from sqlalchemy import Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class FormAnswer(Base):
    __tablename__ = "form_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    response_id: Mapped[int] = mapped_column(ForeignKey("form_responses.id", ondelete="CASCADE"), nullable=False)
    field_id: Mapped[int] = mapped_column(ForeignKey("form_fields.id", ondelete="CASCADE"), nullable=False)
    # Puede ser string, número, lista de strings, ruta de archivo, etc.
    value: Mapped[dict | list | str | None] = mapped_column(JSONB, nullable=True)

    response: Mapped["FormResponse"] = relationship("FormResponse", back_populates="answers")
    field: Mapped["FormField"] = relationship("FormField", back_populates="answers")
    uploaded_files: Mapped[list["UploadedFile"]] = relationship("UploadedFile", back_populates="answer", cascade="all, delete-orphan")
