"""
Crea el admin inicial desde variables de entorno si no existe.
Se ejecuta una vez en el arranque del contenedor.
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from datetime import datetime, timezone


async def seed():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == settings.FIRST_ADMIN_USERNAME))
        if result.scalar_one_or_none():
            print(f"[seed] Admin '{settings.FIRST_ADMIN_USERNAME}' ya existe, omitiendo.")
            return

        admin = User(
            username=settings.FIRST_ADMIN_USERNAME,
            password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
            first_name=settings.FIRST_ADMIN_FIRST_NAME,
            last_name=settings.FIRST_ADMIN_LAST_NAME,
            role=UserRole.admin,
            is_confirmed=True,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(admin)
        await db.commit()
        print(f"[seed] Admin '{settings.FIRST_ADMIN_USERNAME}' creado exitosamente.")


if __name__ == "__main__":
    asyncio.run(seed())
