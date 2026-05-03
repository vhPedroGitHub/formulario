from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    form_id: Optional[int] = None
    message: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_users: int
    pending_confirmation: int
    total_forms: int
    active_forms: int
    total_responses: int


class FormParticipation(BaseModel):
    form_id: int
    form_title: str
    total_audience: int
    total_responses: int
    participation_pct: float
