from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.deps import DB, CurrentAdmin
from app.models.faculty import Faculty
from app.models.career import Career
from app.models.group import Group
from app.schemas.academic import (
    FacultyCreate, FacultyUpdate, FacultyOut,
    CareerCreate, CareerUpdate, CareerOut,
    GroupOut,
)
from app.services.academic import regenerate_groups

router = APIRouter(tags=["academic"])


# ── Facultades ────────────────────────────────────────────────────────────────

@router.get("/faculties", response_model=list[FacultyOut])
async def list_faculties(db: DB):
    result = await db.execute(select(Faculty).order_by(Faculty.name))
    return result.scalars().all()


@router.post("/faculties", response_model=FacultyOut, status_code=status.HTTP_201_CREATED)
async def create_faculty(body: FacultyCreate, db: DB, _: CurrentAdmin):
    faculty = Faculty(name=body.name)
    db.add(faculty)
    await db.commit()
    await db.refresh(faculty)
    return faculty


@router.patch("/faculties/{faculty_id}", response_model=FacultyOut)
async def update_faculty(faculty_id: int, body: FacultyUpdate, db: DB, _: CurrentAdmin):
    result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(404, "Facultad no encontrada")
    faculty.name = body.name
    await db.commit()
    await db.refresh(faculty)
    return faculty


@router.delete("/faculties/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(faculty_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(404, "Facultad no encontrada")
    await db.delete(faculty)
    await db.commit()


# ── Carreras ──────────────────────────────────────────────────────────────────

@router.get("/faculties/{faculty_id}/careers", response_model=list[CareerOut])
async def list_careers(faculty_id: int, db: DB):
    result = await db.execute(
        select(Career).options(selectinload(Career.faculty))
        .where(Career.faculty_id == faculty_id)
        .order_by(Career.name)
    )
    careers = result.scalars().all()
    return [
        CareerOut(
            id=c.id, name=c.name, faculty_id=c.faculty_id,
            faculty_name=c.faculty.name if c.faculty else None,
            duration_years=c.duration_years, groups_per_year=c.groups_per_year,
            created_at=c.created_at,
        ) for c in careers
    ]


@router.get("/careers", response_model=list[CareerOut])
async def list_all_careers(db: DB):
    result = await db.execute(
        select(Career).options(selectinload(Career.faculty)).order_by(Career.name)
    )
    careers = result.scalars().all()
    return [
        CareerOut(
            id=c.id, name=c.name, faculty_id=c.faculty_id,
            faculty_name=c.faculty.name if c.faculty else None,
            duration_years=c.duration_years, groups_per_year=c.groups_per_year,
            created_at=c.created_at,
        ) for c in careers
    ]


@router.post("/faculties/{faculty_id}/careers", response_model=CareerOut, status_code=status.HTTP_201_CREATED)
async def create_career(faculty_id: int, body: CareerCreate, db: DB, _: CurrentAdmin):
    result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Facultad no encontrada")

    career = Career(
        name=body.name, faculty_id=faculty_id,
        duration_years=body.duration_years, groups_per_year=body.groups_per_year,
    )
    db.add(career)
    await db.flush()
    await regenerate_groups(db, career)
    await db.commit()
    await db.refresh(career)

    result2 = await db.execute(
        select(Career).options(selectinload(Career.faculty)).where(Career.id == career.id)
    )
    c = result2.scalar_one()
    return CareerOut(
        id=c.id, name=c.name, faculty_id=c.faculty_id,
        faculty_name=c.faculty.name if c.faculty else None,
        duration_years=c.duration_years, groups_per_year=c.groups_per_year,
        created_at=c.created_at,
    )


@router.patch("/careers/{career_id}", response_model=CareerOut)
async def update_career(career_id: int, body: CareerUpdate, db: DB, _: CurrentAdmin):
    result = await db.execute(
        select(Career).options(selectinload(Career.faculty)).where(Career.id == career_id)
    )
    career = result.scalar_one_or_none()
    if not career:
        raise HTTPException(404, "Carrera no encontrada")

    needs_regen = False
    if body.name is not None:
        career.name = body.name
    if body.duration_years is not None:
        career.duration_years = body.duration_years
        needs_regen = True
    if body.groups_per_year is not None:
        career.groups_per_year = body.groups_per_year
        needs_regen = True

    if needs_regen:
        await regenerate_groups(db, career)

    await db.commit()
    await db.refresh(career)
    c = career
    return CareerOut(
        id=c.id, name=c.name, faculty_id=c.faculty_id,
        faculty_name=c.faculty.name if c.faculty else None,
        duration_years=c.duration_years, groups_per_year=c.groups_per_year,
        created_at=c.created_at,
    )


@router.delete("/careers/{career_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_career(career_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(select(Career).where(Career.id == career_id))
    career = result.scalar_one_or_none()
    if not career:
        raise HTTPException(404, "Carrera no encontrada")
    await db.delete(career)
    await db.commit()


# ── Grupos ────────────────────────────────────────────────────────────────────

@router.get("/careers/{career_id}/groups", response_model=list[GroupOut])
async def list_groups(career_id: int, db: DB):
    result = await db.execute(
        select(Group).where(Group.career_id == career_id).order_by(Group.year, Group.group_number)
    )
    groups = result.scalars().all()
    return [
        GroupOut(
            id=g.id, career_id=g.career_id, year=g.year,
            group_number=g.group_number, display_name=g.display_name,
        ) for g in groups
    ]
