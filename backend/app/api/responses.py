import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.deps import DB, CurrentUser, CurrentAdmin


def _is_field_visible(field, fields_by_order: list, answers_map: dict) -> bool:
    """Return True if field is visible given submitted answers.

    conditional_logic.field_id is the 0-based index into fields_by_order
    (sorted by field.order), which is how the frontend stores it.
    """
    cond = field.conditional_logic
    if not cond:
        return True
    field_index = cond.get("field_id")
    if field_index is None or field_index >= len(fields_by_order):
        return True
    referenced = fields_by_order[field_index]
    answer = answers_map.get(referenced.id)
    actual = str(answer.value) if (answer and answer.value is not None) else ""
    expected = cond.get("value", "")
    operator = cond.get("operator", "equals")
    if operator == "equals":
        if isinstance(expected, list):
            return actual in [str(v) for v in expected]
        return actual == str(expected)
    if operator == "not_equals":
        if isinstance(expected, list):
            return actual not in [str(v) for v in expected]
        return actual != str(expected)
    if operator == "contains":
        return str(expected).lower() in actual.lower()
    return True
from app.models.form import Form
from app.models.form_field import FormField, FieldType
from app.models.form_response import FormResponse
from app.models.form_answer import FormAnswer
from app.models.uploaded_file import UploadedFile
from app.models.user import User
from app.schemas.response import ResponseCreate, ResponseOut, ResponseWithUserOut, AnswerOut
from app.services.forms import can_user_respond

router = APIRouter(tags=["responses"])


async def _build_response_out(db, response: FormResponse, anonymous: bool = False) -> ResponseWithUserOut:
    answers = []
    for ans in response.answers:
        answers.append(AnswerOut(field_id=ans.field_id, value=ans.value))

    if anonymous:
        return ResponseWithUserOut(
            id=response.id, form_id=response.form_id, user_id=response.user_id,
            submitted_at=response.submitted_at, updated_at=response.updated_at,
            answers=answers,
        )
    user = response.user
    return ResponseWithUserOut(
        id=response.id, form_id=response.form_id, user_id=response.user_id,
        submitted_at=response.submitted_at, updated_at=response.updated_at,
        answers=answers,
        username=user.username if user else None,
        first_name=user.first_name if user else None,
        last_name=user.last_name if user else None,
        faculty_name=user.faculty.name if user and user.faculty else None,
        career_name=user.career.name if user and user.career else None,
        group_display=user.group.display_name if user and user.group else None,
    )


@router.post("/forms/{form_id}/responses", response_model=ResponseOut, status_code=status.HTTP_201_CREATED)
async def submit_response(form_id: int, body: ResponseCreate, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Form).options(selectinload(Form.fields)).where(Form.id == form_id)
    )
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(404, "Formulario no encontrado")

    now = datetime.now(timezone.utc)
    if form.start_date and form.start_date > now:
        raise HTTPException(400, "El formulario aún no está activo")
    if form.end_date and form.end_date < now:
        raise HTTPException(400, "El formulario ya cerró")

    if not await can_user_respond(db, form_id, current_user.id):
        raise HTTPException(403, "No tienes acceso a este formulario")

    existing = await db.execute(
        select(FormResponse).where(FormResponse.form_id == form_id, FormResponse.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Ya respondiste este formulario")

    # Validar campos requeridos (solo los que son visibles según lógica condicional)
    fields_map = {f.id: f for f in form.fields}
    fields_by_order = sorted(form.fields, key=lambda f: f.order)
    answers_map = {a.field_id: a for a in body.answers}
    for field in form.fields:
        if not _is_field_visible(field, fields_by_order, answers_map):
            continue  # campo oculto por condición → no se valida como requerido
        if field.is_required and field.type != FieldType.file:
            ans = answers_map.get(field.id)
            if not ans or ans.value is None or ans.value == "" or ans.value == []:
                raise HTTPException(422, f"El campo '{field.label}' es requerido")

    response = FormResponse(form_id=form_id, user_id=current_user.id, submitted_at=now, updated_at=now)
    db.add(response)
    await db.flush()

    for ans_in in body.answers:
        if ans_in.field_id not in fields_map:
            continue
        answer = FormAnswer(response_id=response.id, field_id=ans_in.field_id, value=ans_in.value)
        db.add(answer)

    await db.commit()
    await db.refresh(response)

    result2 = await db.execute(
        select(FormResponse)
        .options(selectinload(FormResponse.answers))
        .where(FormResponse.id == response.id)
    )
    r = result2.scalar_one()
    return ResponseOut(
        id=r.id, form_id=r.form_id, user_id=r.user_id,
        submitted_at=r.submitted_at, updated_at=r.updated_at,
        answers=[AnswerOut(field_id=a.field_id, value=a.value) for a in r.answers],
    )


@router.put("/forms/{form_id}/responses/me", response_model=ResponseOut)
async def update_my_response(form_id: int, body: ResponseCreate, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Form).options(selectinload(Form.fields)).where(Form.id == form_id)
    )
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(404, "Formulario no encontrado")
    if not form.is_editable:
        raise HTTPException(403, "Este formulario no permite editar respuestas")

    now = datetime.now(timezone.utc)
    if form.end_date and form.end_date < now:
        raise HTTPException(400, "El formulario ya cerró")

    result2 = await db.execute(
        select(FormResponse)
        .options(selectinload(FormResponse.answers))
        .where(FormResponse.form_id == form_id, FormResponse.user_id == current_user.id)
    )
    response = result2.scalar_one_or_none()
    if not response:
        raise HTTPException(404, "No encontramos tu respuesta previa")

    fields_map = {f.id: f for f in form.fields}
    fields_by_order = sorted(form.fields, key=lambda f: f.order)
    answers_map_in = {a.field_id: a for a in body.answers}

    # Validar campos requeridos visibles
    for field in form.fields:
        if not _is_field_visible(field, fields_by_order, answers_map_in):
            continue
        if field.is_required and field.type != FieldType.file:
            ans = answers_map_in.get(field.id)
            if not ans or ans.value is None or ans.value == "" or ans.value == []:
                raise HTTPException(422, f"El campo '{field.label}' es requerido")

    # Eliminar respuestas anteriores y reemplazar
    for ans in response.answers:
        await db.delete(ans)
    await db.flush()

    for ans_in in body.answers:
        if ans_in.field_id not in fields_map:
            continue
        db.add(FormAnswer(response_id=response.id, field_id=ans_in.field_id, value=ans_in.value))

    response.updated_at = now
    await db.commit()

    result3 = await db.execute(
        select(FormResponse)
        .options(selectinload(FormResponse.answers))
        .where(FormResponse.id == response.id)
    )
    r = result3.scalar_one()
    return ResponseOut(
        id=r.id, form_id=r.form_id, user_id=r.user_id,
        submitted_at=r.submitted_at, updated_at=r.updated_at,
        answers=[AnswerOut(field_id=a.field_id, value=a.value) for a in r.answers],
    )


@router.get("/forms/{form_id}/responses/me", response_model=ResponseOut)
async def get_my_response(form_id: int, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(FormResponse)
        .options(selectinload(FormResponse.answers))
        .where(FormResponse.form_id == form_id, FormResponse.user_id == current_user.id)
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "No has respondido este formulario")
    return ResponseOut(
        id=r.id, form_id=r.form_id, user_id=r.user_id,
        submitted_at=r.submitted_at, updated_at=r.updated_at,
        answers=[AnswerOut(field_id=a.field_id, value=a.value) for a in r.answers],
    )


@router.get("/admin/forms/{form_id}/responses", response_model=list[ResponseWithUserOut])
async def admin_list_responses(form_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(select(Form).where(Form.id == form_id))
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(404, "Formulario no encontrado")

    result2 = await db.execute(
        select(FormResponse)
        .options(
            selectinload(FormResponse.answers),
            selectinload(FormResponse.user).selectinload(User.faculty),
            selectinload(FormResponse.user).selectinload(User.career),
            selectinload(FormResponse.user).selectinload(User.group),
        )
        .where(FormResponse.form_id == form_id)
        .order_by(FormResponse.submitted_at)
    )
    responses = result2.scalars().all()
    return [await _build_response_out(db, r, anonymous=form.is_anonymous) for r in responses]


@router.post("/forms/{form_id}/responses/upload/{field_id}")
async def upload_file(
    form_id: int, field_id: int,
    file: UploadFile = File(...),
    db: DB = None,
    current_user: CurrentUser = None,
):
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(413, f"El archivo supera el límite de {settings.MAX_UPLOAD_SIZE_MB} MB")

    ext = os.path.splitext(file.filename or "")[1]
    stored_name = f"{uuid.uuid4()}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    with open(stored_path, "wb") as f:
        f.write(content)

    return {"stored_name": stored_name, "original_name": file.filename, "size": len(content)}
