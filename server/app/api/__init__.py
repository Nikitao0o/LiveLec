from app.api.auth import router as auth_router
from app.api.lectures import router as lectures_router
from app.api.questions import router as questions_router
from app.api.analytics import router as analytics_router
from app.api.disciplines import router as disciplines_router

__all__ = [
    "auth_router",
    "lectures_router", 
    "questions_router",
    "analytics_router",
    "disciplines_router",
]