from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.core.security import validate_password_strength
from app.models.user import UserRole


class UserBase(BaseModel):
    username: str
    first_name: str
    last_name: str
    role: UserRole = UserRole.user
    faculty_id: Optional[int] = None
    career_id: Optional[int] = None
    group_id: Optional[int] = None
    special_role_id: Optional[int] = None


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not validate_password_strength(v):
            raise ValueError(
                "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo"
            )
        return v


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    faculty_id: Optional[int] = None
    career_id: Optional[int] = None
    group_id: Optional[int] = None
    special_role_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not validate_password_strength(v):
            raise ValueError(
                "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo"
            )
        return v


class UserOut(UserBase):
    id: int
    is_confirmed: bool
    is_active: bool
    created_at: datetime
    faculty_name: Optional[str] = None
    career_name: Optional[str] = None
    group_display: Optional[str] = None
    special_role_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SignupRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    password: str
    faculty_id: Optional[int] = None
    career_id: Optional[int] = None
    group_id: Optional[int] = None
    special_role_id: Optional[int] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not validate_password_strength(v):
            raise ValueError(
                "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo"
            )
        return v
