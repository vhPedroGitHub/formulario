from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import DB, CurrentAdmin
from app.models.special_role import SpecialRole
from app.schemas.form import SpecialRoleCreate, SpecialRoleOut

router = APIRouter(prefix="/special-roles", tags=["special-roles"])


@router.get("", response_model=list[SpecialRoleOut])
async def list_special_roles(db: DB):
    result = await db.execute(select(SpecialRole).order_by(SpecialRole.name))
    return result.scalars().all()


@router.post("", response_model=SpecialRoleOut, status_code=status.HTTP_201_CREATED)
async def create_special_role(body: SpecialRoleCreate, db: DB, _: CurrentAdmin):
    existing = await db.execute(select(SpecialRole).where(SpecialRole.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un rol con ese nombre")
    role = SpecialRole(name=body.name)
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@router.patch("/{role_id}", response_model=SpecialRoleOut)
async def update_special_role(role_id: int, body: SpecialRoleCreate, db: DB, _: CurrentAdmin):
    result = await db.execute(select(SpecialRole).where(SpecialRole.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(404, "Rol no encontrado")
    role.name = body.name
    await db.commit()
    await db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_special_role(role_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(select(SpecialRole).where(SpecialRole.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(404, "Rol no encontrado")
    await db.delete(role)
    await db.commit()
