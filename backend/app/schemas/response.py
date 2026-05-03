from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class AnswerIn(BaseModel):
    field_id: int
    value: Optional[Any] = None


class ResponseCreate(BaseModel):
    answers: list[AnswerIn]


class AnswerOut(BaseModel):
    field_id: int
    value: Optional[Any] = None
    model_config = {"from_attributes": True}


class ResponseOut(BaseModel):
    id: int
    form_id: int
    user_id: int
    submitted_at: datetime
    updated_at: datetime
    answers: list[AnswerOut] = []
    model_config = {"from_attributes": True}


class ResponseWithUserOut(ResponseOut):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    faculty_name: Optional[str] = None
    career_name: Optional[str] = None
    group_display: Optional[str] = None
