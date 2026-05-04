from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class AnswerIn(BaseModel):
    field_id: int
    value: Optional[Any] = None


class AnswerOut(BaseModel):
    field_id: int
    value: Optional[Any] = None
    model_config = {"from_attributes": True}


class ResponseCreate(BaseModel):
    answers: list[AnswerIn]
    form_version: Optional[int] = None


class ResponseOut(BaseModel):
    id: int
    form_id: int
    user_id: int
    submitted_at: datetime
    updated_at: datetime
    form_version: Optional[int] = None
    answers: list[AnswerOut] = []
    model_config = {"from_attributes": True}


class ResponseWithUserOut(ResponseOut):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    faculty_name: Optional[str] = None
    career_name: Optional[str] = None
    group_display: Optional[str] = None