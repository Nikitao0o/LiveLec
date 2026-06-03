import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth_router, lectures_router, questions_router, analytics_router, disciplines_router
from app.ws.endpoint import router as ws_router
from app.services.asr import asr_service

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

# Подключение REST-роутеров
app.include_router(auth_router)
app.include_router(lectures_router)
app.include_router(questions_router)
app.include_router(analytics_router)
app.include_router(disciplines_router)

# Подключение WebSocket-роутера
app.include_router(ws_router)

@app.on_event("startup")
async def startup():
    from app.models import (
        User,
        Lecture,
        Question,
        Analytics,
        TranscriptSegment,
        TeacherDiscipline,
        ConfusionSession,
    )
    
    # Пытаемся подключиться к БД 5 раз с интервалом, давая PostgreSQL время на запуск
    for _ in range(5):
        try:
            from sqlalchemy import text
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                await conn.execute(text(
                    "ALTER TABLE lectures ADD COLUMN IF NOT EXISTS peak_students INTEGER NOT NULL DEFAULT 0"
                ))
                await conn.execute(text(
                    "ALTER TABLE lectures ADD COLUMN IF NOT EXISTS slide_count INTEGER NOT NULL DEFAULT 0"
                ))
                await conn.execute(text(
                    "ALTER TABLE lectures ADD COLUMN IF NOT EXISTS current_slide INTEGER NOT NULL DEFAULT 1"
                ))
            print("База данных успешно подключена и готова!")
            asyncio.create_task(asr_service.ensure_model())
            break
        except Exception as e:
            print("Ожидание запуска базы данных (PostgreSQL)...")
            await asyncio.sleep(3)

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