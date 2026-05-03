import enum
from datetime import datetime, timezone
from sqlalchemy import Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"
    special = "special"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.user)

    special_role_id: Mapped[int | None] = mapped_column(ForeignKey("special_roles.id", ondelete="SET NULL"), nullable=True)
    faculty_id: Mapped[int | None] = mapped_column(ForeignKey("faculties.id", ondelete="SET NULL"), nullable=True)
    career_id: Mapped[int | None] = mapped_column(ForeignKey("careers.id", ondelete="SET NULL"), nullable=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)

    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    special_role: Mapped["SpecialRole | None"] = relationship("SpecialRole", back_populates="users")
    faculty: Mapped["Faculty | None"] = relationship("Faculty", back_populates="users")
    career: Mapped["Career | None"] = relationship("Career", back_populates="users")
    group: Mapped["Group | None"] = relationship("Group", back_populates="users")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    responses: Mapped[list["FormResponse"]] = relationship("FormResponse", back_populates="user")
