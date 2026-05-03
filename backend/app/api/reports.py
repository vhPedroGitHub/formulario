from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import DB, CurrentAdmin
from app.models.form import Form
from app.models.form_response import FormResponse
from app.reports.pdf_generator import generate_pdf
from app.services.forms import get_audience_user_ids

router = APIRouter(tags=["reports"])


@router.get("/admin/forms/{form_id}/report")
async def generate_report(form_id: int, db: DB, _: CurrentAdmin):
    result = await db.execute(
        select(Form)
        .options(selectinload(Form.fields), selectinload(Form.audience))
        .where(Form.id == form_id)
    )
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(404, "Formulario no encontrado")

    result2 = await db.execute(
        select(FormResponse)
        .options(
            selectinload(FormResponse.answers),
            selectinload(FormResponse.user).selectinload("faculty"),
            selectinload(FormResponse.user).selectinload("career"),
            selectinload(FormResponse.user).selectinload("group"),
        )
        .where(FormResponse.form_id == form_id)
        .order_by(FormResponse.submitted_at)
    )
    responses = result2.scalars().all()
    audience_ids = await get_audience_user_ids(db, form_id)

    pdf_bytes = generate_pdf(
        form=form,
        fields=form.fields,
        responses=responses,
        total_audience=len(audience_ids),
    )

    safe_title = "".join(c if c.isalnum() else "_" for c in form.title)[:50]
    filename = f"reporte_{safe_title}_{form_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
