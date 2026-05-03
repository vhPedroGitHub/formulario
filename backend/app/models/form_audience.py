import enum
from sqlalchemy import Integer, String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class AudienceTargetType(str, enum.Enum):
    faculty = "faculty"
    career = "career"
    group = "group"
    user = "user"
    special_role = "special_role"


class FormAudience(Base):
    __tablename__ = "form_audience"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    target_type: Mapped[AudienceTargetType] = mapped_column(Enum(AudienceTargetType), nullable=False)
    target_id: Mapped[int] = mapped_column(Integer, nullable=False)

    form: Mapped["Form"] = relationship("Form", back_populates="audience")
