from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import select, func

from app.core.deps import DB, CurrentAdmin
from app.models.user import User
from app.models.form import Form
from app.models.form_response import FormResponse
from app.schemas.misc import DashboardStats, FormParticipation
from app.services.forms import get_audience_user_ids

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: DB, _: CurrentAdmin):
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    pending = (await db.execute(
        select(func.count()).select_from(User).where(User.is_confirmed == False)
    )).scalar_one()
    total_forms = (await db.execute(select(func.count()).select_from(Form))).scalar_one()

    now = datetime.now(timezone.utc)
    active_forms = (await db.execute(
        select(func.count()).select_from(Form).where(
            (Form.start_date == None) | (Form.start_date <= now),
            (Form.end_date == None) | (Form.end_date >= now),
        )
    )).scalar_one()

    total_responses = (await db.execute(select(func.count()).select_from(FormResponse))).scalar_one()

    return DashboardStats(
        total_users=total_users,
        pending_confirmation=pending,
        total_forms=total_forms,
        active_forms=active_forms,
        total_responses=total_responses,
    )


@router.get("/participation", response_model=list[FormParticipation])
async def get_participation(db: DB, _: CurrentAdmin):
    result = await db.execute(select(Form).order_by(Form.created_at.desc()).limit(20))
    forms = result.scalars().all()

    out = []
    for form in forms:
        audience_ids = await get_audience_user_ids(db, form.id)
        total_audience = len(audience_ids)
        count_r = await db.execute(
            select(func.count()).select_from(FormResponse).where(FormResponse.form_id == form.id)
        )
        total_responses = count_r.scalar_one()
        pct = round((total_responses / total_audience * 100) if total_audience > 0 else 0, 1)
        out.append(FormParticipation(
            form_id=form.id,
            form_title=form.title,
            total_audience=total_audience,
            total_responses=total_responses,
            participation_pct=pct,
        ))
    return out
