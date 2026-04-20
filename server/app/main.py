from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth_router, lectures_router, questions_router, analytics_router

app = FastAPI(
    title="LiveLec API",
    description="Платформа интерактивных лекций",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth_router)
app.include_router(lectures_router)
app.include_router(questions_router)
app.include_router(analytics_router)

@app.on_event("startup")
async def startup():
    from app.models import User, Lecture, Question, Analytics, TranscriptSegment
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("База данных готова")

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
    print("Приложение остановлено")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "LiveLec API"}

@app.get("/")
async def root():
    return {
        "message": "Добро пожаловать в LiveLec API",
        "docs": "/docs",
        "health": "/health"
    }