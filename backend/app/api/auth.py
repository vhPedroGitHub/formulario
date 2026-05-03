import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import DB
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, hash_password
from app.models.user import User, UserRole
from app.models.refresh_token import RefreshToken
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DB):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")
    if not user.is_confirmed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta pendiente de confirmación por un administrador")

    access_token = create_access_token(str(user.id))
    refresh_token, expires_at = create_refresh_token(str(user.id))

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(refresh_token),
        expires_at=expires_at,
    ))
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: DB):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")

    token_hash = _hash_token(body.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expirado o no válido")

    user_id = payload["sub"]
    result2 = await db.execute(select(User).where(User.id == int(user_id)))
    user = result2.scalar_one_or_none()
    if not user or not user.is_active or not user.is_confirmed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

    # Rotar refresh token
    await db.delete(stored)
    access_token = create_access_token(str(user.id))
    new_refresh, expires_at = create_refresh_token(str(user.id))
    db.add(RefreshToken(user_id=user.id, token_hash=_hash_token(new_refresh), expires_at=expires_at))
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshRequest, db: DB):
    token_hash = _hash_token(body.refresh_token)
    await db.execute(delete(RefreshToken).where(RefreshToken.token_hash == token_hash))
    await db.commit()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: DB):
    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nombre de usuario ya existe")

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role=UserRole.user,
        faculty_id=body.faculty_id,
        career_id=body.career_id,
        group_id=body.group_id,
        special_role_id=body.special_role_id,
        is_confirmed=False,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    return {"message": "Registro exitoso. Tu cuenta está pendiente de confirmación por un administrador."}
