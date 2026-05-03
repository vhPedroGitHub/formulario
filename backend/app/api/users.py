from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.deps import DB, CurrentAdmin
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.schemas.user import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


def _build_user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        username=u.username,
        first_name=u.first_name,
        last_name=u.last_name,
        role=u.role,
        faculty_id=u.faculty_id,
        career_id=u.career_id,
        group_id=u.group_id,
        special_role_id=u.special_role_id,
        is_confirmed=u.is_confirmed,
        is_active=u.is_active,
        created_at=u.created_at,
        faculty_name=u.faculty.name if u.faculty else None,
        career_name=u.career.name if u.career else None,
        group_display=u.group.display_name if u.group else None,
        special_role_name=u.special_role.name if u.special_role else None,
    )


@router.get("", response_model=list[UserOut])
async def list_users(db: DB, _: CurrentAdmin, confirmed: bool | None = None):
    q = select(User).options(
        selectinload(User.faculty),
        selectinload(User.career),
        selectinload(User.group),
        selectinload(User.special_role),
    )
    if confirmed is not None:
        q = q.where(User.is_confirmed == confirmed)
    result = await db.execute(q.order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [_build_user_out(u) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate, db: DB, _: CurrentAdmin):
    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nombre de usuario ya existe")

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role=body.role,
        faculty_id=body.faculty_id,
        career_id=body.career_id,
        group_id=body.group_id,
        special_role_id=body.special_role_id,
        is_confirmed=True,   # El admin crea usuarios ya confirmados
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    result2 = await db.execute(
        select(User).options(
            selectinload(User.faculty), selectinload(User.career),
            selectinload(User.group), selectinload(User.special_role),
        ).where(User.id == user.id)
    )
    return _build_user_out(result2.scalar_one())


@router.get("/me", response_model=UserOut)
async def get_me(db: DB, current_user: CurrentAdmin):
    result = await db.execute(
        select(User).options(
            selectinload(User.faculty), selectinload(User.career),
            selectinload(User.group), selectinload(User.special_role),
        ).where(User.id == current_user.id)
    )
    return _build_user_out(result.scalar_one())


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(
        select(User).options(
            selectinload(User.faculty), selectinload(User.career),
            selectinload(User.group), selectinload(User.special_role),
        ).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return _build_user_out(user)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: int, body: UserUpdate, db: DB, _: CurrentAdmin):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    for field, val in body.model_dump(exclude_none=True).items():
        if field == "password":
            setattr(user, "password_hash", hash_password(val))
        else:
            setattr(user, field, val)

    await db.commit()

    result2 = await db.execute(
        select(User).options(
            selectinload(User.faculty), selectinload(User.career),
            selectinload(User.group), selectinload(User.special_role),
        ).where(User.id == user_id)
    )
    return _build_user_out(result2.scalar_one())


@router.patch("/{user_id}/confirm", response_model=UserOut)
async def confirm_user(user_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    user.is_confirmed = True
    await db.commit()
    result2 = await db.execute(
        select(User).options(
            selectinload(User.faculty), selectinload(User.career),
            selectinload(User.group), selectinload(User.special_role),
        ).where(User.id == user_id)
    )
    return _build_user_out(result2.scalar_one())


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: DB, admin: CurrentAdmin):
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes eliminar tu propio usuario")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    await db.delete(user)
    await db.commit()
