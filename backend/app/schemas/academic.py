from datetime import datetime
from pydantic import BaseModel, model_validator
from typing import Optional


class FacultyCreate(BaseModel):
    name: str


class FacultyUpdate(BaseModel):
    name: str


class FacultyOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    model_config = {"from_attributes": True}


class CareerCreate(BaseModel):
    name: str
    duration_years: int
    groups_per_year: int

    @model_validator(mode="after")
    def validate_years(self) -> "CareerCreate":
        if self.duration_years < 1:
            raise ValueError("La duración debe ser al menos 1 año")
        if self.groups_per_year < 1:
            raise ValueError("Debe haber al menos 1 grupo por año")
        return self


class CareerUpdate(BaseModel):
    name: Optional[str] = None
    duration_years: Optional[int] = None
    groups_per_year: Optional[int] = None


class CareerOut(BaseModel):
    id: int
    name: str
    faculty_id: int
    faculty_name: Optional[str] = None
    duration_years: int
    groups_per_year: int
    created_at: datetime
    model_config = {"from_attributes": True}


class GroupCreate(BaseModel):
    year: int

    @model_validator(mode="after")
    def validate_year(self) -> "GroupCreate":
        if self.year < 1:
            raise ValueError("El año debe ser mayor a 0")
        return self


class GroupOut(BaseModel):
    id: int
    career_id: int
    year: int
    group_number: int
    display_name: str
    model_config = {"from_attributes": True}
