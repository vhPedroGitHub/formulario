from fastapi import APIRouter
from sqlalchemy import select, update

from app.core.deps import DB, CurrentUser
from app.models.notification import Notification
from app.schemas.misc import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def get_notifications(db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: int, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        from fastapi import HTTPException
        raise HTTPException(404, "Notificación no encontrada")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


@router.patch("/read-all", status_code=204)
async def mark_all_read(db: DB, current_user: CurrentUser):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
