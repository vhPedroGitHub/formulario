from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel
from app.models.form_audience import AudienceTargetType
from app.models.form_field import FieldType


class SpecialRoleCreate(BaseModel):
    name: str


class SpecialRoleOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    model_config = {"from_attributes": True}


class AudienceEntryIn(BaseModel):
    target_type: AudienceTargetType
    target_id: int


class AudienceEntryOut(BaseModel):
    id: int
    target_type: AudienceTargetType
    target_id: int
    model_config = {"from_attributes": True}


class ConditionalLogic(BaseModel):
    field_id: int
    operator: str   # "eq" | "neq" | "contains" | "not_contains"
    value: Any


class FormFieldIn(BaseModel):
    order: int
    type: FieldType
    label: str
    help_text: Optional[str] = None
    is_required: bool = False
    options: Optional[dict] = None
    conditional_logic: Optional[ConditionalLogic] = None


class FormFieldOut(BaseModel):
    id: int
    order: int
    type: FieldType
    label: str
    help_text: Optional[str] = None
    is_required: bool
    options: Optional[dict] = None
    conditional_logic: Optional[dict] = None
    model_config = {"from_attributes": True}


class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_anonymous: bool = False
    is_editable: bool = False
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    audience: list[AudienceEntryIn]
    fields: list[FormFieldIn]


class FormOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_anonymous: bool
    is_editable: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[int] = None
    creator_username: Optional[str] = None
    audience: list[AudienceEntryOut] = []
    fields: list[FormFieldOut] = []
    total_responses: int = 0
    model_config = {"from_attributes": True}


class FormListOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_anonymous: bool
    is_editable: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    total_responses: int = 0
    has_responded: bool = False
    model_config = {"from_attributes": True}
