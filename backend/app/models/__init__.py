from app.core.database import Base  # noqa: F401 — importar Base antes que los modelos

from app.models.faculty import Faculty
from app.models.career import Career
from app.models.group import Group
from app.models.special_role import SpecialRole
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.form import Form
from app.models.form_audience import FormAudience
from app.models.form_field import FormField
from app.models.form_response import FormResponse
from app.models.form_answer import FormAnswer
from app.models.uploaded_file import UploadedFile
from app.models.notification import Notification

__all__ = [
    "Base",
    "Faculty",
    "Career",
    "Group",
    "SpecialRole",
    "User",
    "RefreshToken",
    "Form",
    "FormAudience",
    "FormField",
    "FormResponse",
    "FormAnswer",
    "UploadedFile",
    "Notification",
]
