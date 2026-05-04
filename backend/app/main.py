import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api import auth, users, academic, special_roles, forms, responses, notifications, dashboard, reports

logger = logging.getLogger(__name__)

app = FastAPI(
    title="UniForm API",
    description="Sistema de Formularios Universitarios",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    logger.warning("Validation error [%s %s]: %s", request.method, request.url.path, errors)
    messages = []
    for err in errors:
        loc_parts = [str(p) for p in err.get("loc", []) if p != "body"]
        loc = " → ".join(loc_parts)
        msg = err.get("msg", "valor inválido")
        messages.append(f"{loc}: {msg}" if loc else msg)
    detail = "; ".join(messages) if messages else "Error de validación"
    return JSONResponse(status_code=422, content={"detail": detail})


PREFIX = "/api"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(academic.router, prefix=PREFIX)
app.include_router(special_roles.router, prefix=PREFIX)
app.include_router(forms.router, prefix=PREFIX)
app.include_router(responses.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(reports.router, prefix=PREFIX)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
