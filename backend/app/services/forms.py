from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.form import Form
from app.models.form_audience import FormAudience, AudienceTargetType
from app.models.notification import Notification
from app.models.user import User, UserRole


async def get_audience_user_ids(db: AsyncSession, form_id: int) -> set[int]:
    """Devuelve el conjunto de user_ids que pueden responder el formulario."""
    result = await db.execute(select(FormAudience).where(FormAudience.form_id == form_id))
    entries = result.scalars().all()

    user_ids: set[int] = set()
    for entry in entries:
        if entry.target_type == AudienceTargetType.user:
            user_ids.add(entry.target_id)
        else:
            # Filtrar usuarios según el target
            q = select(User.id).where(User.is_active == True, User.is_confirmed == True)
            if entry.target_type == AudienceTargetType.faculty:
                q = q.where(User.faculty_id == entry.target_id)
            elif entry.target_type == AudienceTargetType.career:
                q = q.where(User.career_id == entry.target_id)
            elif entry.target_type == AudienceTargetType.group:
                q = q.where(User.group_id == entry.target_id)
            elif entry.target_type == AudienceTargetType.special_role:
                q = q.where(User.special_role_id == entry.target_id, User.role == UserRole.special)

            ids_result = await db.execute(q)
            user_ids.update(ids_result.scalars().all())

    return user_ids


async def can_user_respond(db: AsyncSession, form_id: int, user_id: int) -> bool:
    user_ids = await get_audience_user_ids(db, form_id)
    return user_id in user_ids


async def notify_audience(db: AsyncSession, form: Form) -> None:
    """Crea notificaciones in-app para todos los usuarios de la audiencia."""
    user_ids = await get_audience_user_ids(db, form.id)
    now = datetime.now(timezone.utc)
    for uid in user_ids:
        db.add(Notification(
            user_id=uid,
            form_id=form.id,
            message=f"Hay un nuevo formulario disponible para ti: \"{form.title}\"",
            is_read=False,
            created_at=now,
        ))
