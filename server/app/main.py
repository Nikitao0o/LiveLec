from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

# Создаём приложение FastAPI
app = FastAPI(
    title="LiveLec API",
    description="Платформа интерактивных лекций",
    version="1.0.0"
)

# Настройка CORS (разрешаем запросы с фронтенда)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Событие при запуске приложения
@app.on_event("startup")
async def startup():
    # Создаём все таблицы в базе данных
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("База данных готова")

# Событие при остановке приложения
@app.on_event("shutdown")
async def shutdown():
    # Закрываем соединение с БД
    await engine.dispose()
    print("Приложение остановлено")

# Проверка здоровья сервера
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "LiveLec API"}

# Корневой эндпоинт
@app.get("/")
async def root():
    return {
        "message": "Добро пожаловать в LiveLec API",
        "docs": "/docs",
        "health": "/health"
    }