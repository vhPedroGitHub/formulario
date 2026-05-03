import enum
from sqlalchemy import Integer, String, Text, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class FieldType(str, enum.Enum):
    text = "text"
    number = "number"
    date = "date"
    checkbox = "checkbox"
    radio = "radio"
    scale = "scale"
    file = "file"
    table = "table"


class FormField(Base):
    __tablename__ = "form_fields"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    type: Mapped[FieldType] = mapped_column(Enum(FieldType), nullable=False)
    label: Mapped[str] = mapped_column(String(500), nullable=False)
    help_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Para checkbox/radio: lista de strings. Para scale: {min, max, min_label, max_label}
    # Para table: {rows: [...], columns: [...]}
    options: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # {field_id: int, operator: "eq"|"neq"|"contains", value: any}
    conditional_logic: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    form: Mapped["Form"] = relationship("Form", back_populates="fields")
    answers: Mapped[list["FormAnswer"]] = relationship("FormAnswer", back_populates="field")
