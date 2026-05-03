from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth, users, academic, special_roles, forms, responses, notifications, dashboard, reports

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
