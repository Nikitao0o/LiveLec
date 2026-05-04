FROM python:3.11-slim

# Рабочая директория
WORKDIR /app

# Системные зависимости (если нужны для psycopg2 и т.п.)
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Копируем зависимости
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY app ./app

# Порт FastAPI
EXPOSE 8000

# Запуск (предполагаем uvicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
