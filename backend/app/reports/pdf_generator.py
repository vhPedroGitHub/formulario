import io
import base64
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from collections import Counter
from jinja2 import Template
from weasyprint import HTML

from app.models.form import Form
from app.models.form_field import FormField, FieldType
from app.models.form_response import FormResponse


REPORT_HTML = """
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Liberation Sans, Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 40px; }
  h1 { font-size: 22px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; }
  h2 { font-size: 15px; color: #1e40af; margin-top: 28px; }
  .meta { color: #555; font-size: 11px; margin-bottom: 20px; }
  .badge { display:inline-block; background:#dbeafe; color:#1e40af; border-radius:4px; padding:2px 8px; font-size:10px; margin-right:4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
  th { background: #eff6ff; color: #1e40af; text-align: left; padding: 6px 8px; border: 1px solid #bfdbfe; }
  td { padding: 5px 8px; border: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .chart { text-align: center; margin: 12px 0; }
  .chart img { max-width: 420px; }
  .stat { font-size: 13px; margin: 4px 0; }
  .page-break { page-break-before: always; }
  .section { margin-bottom: 32px; }
  .required { color: #dc2626; font-size: 10px; }
</style>
</head>
<body>
  <h1>{{ form.title }}</h1>
  <div class="meta">
    {% if form.description %}<p>{{ form.description }}</p>{% endif %}
    <p>
      <span class="badge">Total respuestas: {{ total_responses }}</span>
      <span class="badge">Participación: {{ participation_pct }}%</span>
      {% if form.is_anonymous %}<span class="badge">Anónimo</span>{% endif %}
      {% if form.start_date %}<span class="badge">Desde: {{ form.start_date.strftime('%d/%m/%Y') }}</span>{% endif %}
      {% if form.end_date %}<span class="badge">Hasta: {{ form.end_date.strftime('%d/%m/%Y') }}</span>{% endif %}
    </p>
  </div>

  {% for section in sections %}
  <div class="section">
    <h2>{{ loop.index }}. {{ section.label }}
      {% if section.required %}<span class="required">(requerido)</span>{% endif %}
    </h2>
    {% if section.help_text %}<p style="color:#6b7280;font-size:11px;">{{ section.help_text }}</p>{% endif %}

    {% if section.chart %}
    <div class="chart"><img src="data:image/png;base64,{{ section.chart }}" /></div>
    <table>
      <tr><th>Opción</th><th>Respuestas</th><th>%</th></tr>
      {% for row in section.table_rows %}
      <tr><td>{{ row.label }}</td><td>{{ row.count }}</td><td>{{ row.pct }}%</td></tr>
      {% endfor %}
    </table>
    {% elif section.text_rows %}
    <table>
      {% if not form.is_anonymous %}
      <tr><th>Usuario</th><th>Nombre</th><th>Respuesta</th></tr>
      {% else %}
      <tr><th>#</th><th>Respuesta</th></tr>
      {% endif %}
      {% for row in section.text_rows %}
      {% if not form.is_anonymous %}
      <tr><td>{{ row.username }}</td><td>{{ row.full_name }}</td><td>{{ row.value }}</td></tr>
      {% else %}
      <tr><td>{{ loop.index }}</td><td>{{ row.value }}</td></tr>
      {% endif %}
      {% endfor %}
    </table>
    {% else %}
    <p style="color:#9ca3af;">Sin respuestas</p>
    {% endif %}
  </div>
  {% endfor %}
</body>
</html>
"""


def _make_bar_chart(labels: list[str], counts: list[int]) -> str:
    fig, ax = plt.subplots(figsize=(5, 3))
    bars = ax.barh(labels, counts, color="#3b82f6")
    ax.set_xlabel("Respuestas")
    ax.invert_yaxis()
    for bar, val in zip(bars, counts):
        ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height() / 2, str(val), va="center", fontsize=9)
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=110)
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


def _make_pie_chart(labels: list[str], counts: list[int]) -> str:
    fig, ax = plt.subplots(figsize=(4, 4))
    ax.pie(counts, labels=labels, autopct="%1.1f%%", startangle=140,
           colors=["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"])
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=110)
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


def generate_pdf(
    form: Form,
    fields: list[FormField],
    responses: list[FormResponse],
    total_audience: int,
) -> bytes:
    total_responses = len(responses)
    participation_pct = round((total_responses / total_audience * 100) if total_audience > 0 else 0, 1)

    # Mapear answers por response
    answers_by_response: dict[int, dict[int, any]] = {}
    users_by_response: dict[int, any] = {}
    for r in responses:
        answers_by_response[r.id] = {a.field_id: a.value for a in r.answers}
        users_by_response[r.id] = r.user

    sections = []
    for field in sorted(fields, key=lambda f: f.order):
        values = [answers_by_response[r.id].get(field.id) for r in responses]
        values = [v for v in values if v is not None]

        section = {
            "label": field.label,
            "help_text": field.help_text,
            "required": field.is_required,
            "chart": None,
            "table_rows": [],
            "text_rows": [],
        }

        if field.type in (FieldType.checkbox, FieldType.radio):
            # Aplanan listas para checkbox
            flat = []
            for v in values:
                if isinstance(v, list):
                    flat.extend(v)
                else:
                    flat.append(str(v))
            counter = Counter(flat)
            total = sum(counter.values()) or 1
            raw_opts = field.options
            if isinstance(raw_opts, list):
                opts = raw_opts
            elif isinstance(raw_opts, dict):
                opts = raw_opts.get("choices", list(counter.keys()))
            else:
                opts = list(counter.keys())
            labels = [str(o) for o in opts if o in counter]
            counts = [counter[o] for o in opts if o in counter]
            if counts:
                section["chart"] = _make_bar_chart(labels, counts) if len(labels) > 4 else _make_pie_chart(labels, counts)
                section["table_rows"] = [
                    {"label": l, "count": c, "pct": round(c / total * 100, 1)}
                    for l, c in zip(labels, counts)
                ]

        elif field.type == FieldType.scale:
            flat = [str(v) for v in values if v is not None]
            counter = Counter(flat)
            opts = field.options or {}
            min_val = opts.get("min", 1)
            max_val = opts.get("max", 5)
            labels = [str(i) for i in range(min_val, max_val + 1)]
            counts = [counter.get(str(i), 0) for i in range(min_val, max_val + 1)]
            total = sum(counts) or 1
            section["chart"] = _make_bar_chart(labels, counts)
            section["table_rows"] = [
                {"label": l, "count": c, "pct": round(c / total * 100, 1)}
                for l, c in zip(labels, counts)
            ]

        elif field.type == FieldType.file:
            section["text_rows"] = [{"username": "", "full_name": "", "value": f"Archivo adjunto"}
                                     for _ in values]

        else:
            for r in responses:
                val = answers_by_response[r.id].get(field.id)
                if val is None:
                    continue
                user = users_by_response.get(r.id)
                section["text_rows"].append({
                    "username": user.username if user else "",
                    "full_name": f"{user.first_name} {user.last_name}" if user else "",
                    "value": str(val),
                })

        sections.append(section)

    tmpl = Template(REPORT_HTML)
    html_content = tmpl.render(
        form=form,
        sections=sections,
        total_responses=total_responses,
        participation_pct=participation_pct,
    )
    return HTML(string=html_content).write_pdf()
