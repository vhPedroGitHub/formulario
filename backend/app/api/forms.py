from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.deps import DB, CurrentAdmin, CurrentUser
from app.models.form import Form
from app.models.form_audience import FormAudience
from app.models.form_field import FormField
from app.models.form_response import FormResponse
from app.schemas.form import FormCreate, FormOut, FormListOut, FormFieldOut, AudienceEntryOut
from app.services.forms import can_user_respond, notify_audience

router = APIRouter(tags=["forms"])


def _build_form_out(form: Form, total_responses: int = 0) -> FormOut:
    return FormOut(
        id=form.id,
        title=form.title,
        description=form.description,
        is_anonymous=form.is_anonymous,
        is_editable=form.is_editable,
        start_date=form.start_date,
        end_date=form.end_date,
        created_at=form.created_at,
        created_by=form.created_by,
        creator_username=form.creator.username if form.creator else None,
        audience=[AudienceEntryOut(id=a.id, target_type=a.target_type, target_id=a.target_id) for a in form.audience],
        fields=[FormFieldOut.model_validate(f) for f in sorted(form.fields, key=lambda x: x.order)],
        total_responses=total_responses,
    )


# ── Admin: ver todos los formularios ─────────────────────────────────────────

@router.get("/admin/forms", response_model=list[FormOut])
async def admin_list_forms(db: DB, _: CurrentAdmin):
    result = await db.execute(
        select(Form)
        .options(selectinload(Form.audience), selectinload(Form.fields), selectinload(Form.creator))
        .order_by(Form.created_at.desc())
    )
    forms = result.scalars().all()
    out = []
    for form in forms:
        count_r = await db.execute(select(func.count()).where(FormResponse.form_id == form.id))
        total = count_r.scalar_one()
        out.append(_build_form_out(form, total))
    return out


@router.post("/forms", response_model=FormOut, status_code=status.HTTP_201_CREATED)
async def create_form(body: FormCreate, db: DB, admin: CurrentAdmin):
    form = Form(
        title=body.title,
        description=body.description,
        created_by=admin.id,
        is_anonymous=body.is_anonymous,
        is_editable=body.is_editable,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(form)
    await db.flush()

    for entry in body.audience:
        db.add(FormAudience(form_id=form.id, target_type=entry.target_type, target_id=entry.target_id))

    for idx, field_in in enumerate(body.fields):
        cond = field_in.conditional_logic.model_dump() if field_in.conditional_logic else None
        db.add(FormField(
            form_id=form.id,
            order=field_in.order if field_in.order is not None else idx,
            type=field_in.type,
            label=field_in.label,
            help_text=field_in.help_text,
            is_required=field_in.is_required,
            options=field_in.options,
            conditional_logic=cond,
        ))

    await db.flush()
    await notify_audience(db, form)
    await db.commit()

    result = await db.execute(
        select(Form)
        .options(selectinload(Form.audience), selectinload(Form.fields), selectinload(Form.creator))
        .where(Form.id == form.id)
    )
    return _build_form_out(result.scalar_one(), 0)


@router.get("/admin/forms/{form_id}", response_model=FormOut)
async def admin_get_form(form_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(
        select(Form)
        .options(selectinload(Form.audience), selectinload(Form.fields), selectinload(Form.creator))
        .where(Form.id == form_id)
    )
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(404, "Formulario no encontrado")
    count_r = await db.execute(select(func.count()).where(FormResponse.form_id == form_id))
    return _build_form_out(form, count_r.scalar_one())


@router.delete("/admin/forms/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(form_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(select(Form).where(Form.id == form_id))
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(404, "Formulario no encontrado")
    await db.delete(form)
    await db.commit()


# ── Usuario: ver formularios disponibles ─────────────────────────────────────

@router.get("/forms", response_model=list[FormListOut])
async def list_my_forms(db: DB, current_user: CurrentUser):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Form)
        .options(selectinload(Form.audience))
        .order_by(Form.created_at.desc())
    )
    forms = result.scalars().all()

    out = []
    for form in forms:
        # Verificar rango de fechas
        if form.start_date and form.start_date > now:
            continue
        if form.end_date and form.end_date < now:
            continue

        if not await can_user_respond(db, form.id, current_user.id):
            continue

        count_r = await db.execute(select(func.count()).where(FormResponse.form_id == form.id))
        total = count_r.scalar_one()

        resp_r = await db.execute(
            select(FormResponse).where(FormResponse.form_id == form.id, FormResponse.user_id == current_user.id)
        )
        has_responded = resp_r.scalar_one_or_none() is not None

        out.append(FormListOut(
            id=form.id, title=form.title, description=form.description,
            is_anonymous=form.is_anonymous, is_editable=form.is_editable,
            start_date=form.start_date, end_date=form.end_date,
            created_at=form.created_at, total_responses=total, has_responded=has_responded,
        ))
    return out


@router.get("/forms/{form_id}", response_model=FormOut)
async def get_form(form_id: int, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Form)
        .options(selectinload(Form.audience), selectinload(Form.fields), selectinload(Form.creator))
        .where(Form.id == form_id)
    )
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(404, "Formulario no encontrado")

    if not await can_user_respond(db, form_id, current_user.id):
        raise HTTPException(403, "No tienes acceso a este formulario")

    count_r = await db.execute(select(func.count()).where(FormResponse.form_id == form_id))
    return _build_form_out(form, count_r.scalar_one())
