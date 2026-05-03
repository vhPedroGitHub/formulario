from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.career import Career
from app.models.group import Group
from datetime import datetime, timezone


async def regenerate_groups(db: AsyncSession, career: Career) -> None:
    """Elimina todos los grupos de la carrera y los recrea según duration_years y groups_per_year."""
    await db.execute(delete(Group).where(Group.career_id == career.id))
    now = datetime.now(timezone.utc)
    for year in range(1, career.duration_years + 1):
        for gnum in range(1, career.groups_per_year + 1):
            db.add(Group(career_id=career.id, year=year, group_number=gnum, created_at=now))
