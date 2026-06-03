import base64
import tempfile
import os
import logging
import asyncio
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

class ASRService:
    def __init__(self):
        # Используем модель small (около 500 МБ, качается 1 раз при первом запуске)
        # device="cpu" - работаем на процессоре
        # compute_type="int8" - экономим оперативную память
        logger.info("Инициализация модели Faster-Whisper...")
        try:
            self.model = WhisperModel("small", device="cpu", compute_type="int8")
            logger.info("Модель Whisper успешно загружена!")
        except Exception as e:
            logger.error(f"Не удалось загрузить Whisper: {e}")
            self.model = None

    async def process_audio_chunk(self, base64_chunk: str) -> str:
        if not base64_chunk or not self.model:
            return ""
            
        try:
            # Декодируем base64 в бинарные данные
            audio_bytes = base64.b64decode(base64_chunk)
            
            # Сохраняем во временный файл (Whisper удобно работает с файлами)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name

            # Запускаем распознавание в отдельном потоке, чтобы не блокировать event loop FastAPI
            # language="ru" ускоряет работу (не тратим время на автоопределение)
            # condition_on_previous_text=False избавляет от галлюцинаций на коротких чанках
            segments_generator = await asyncio.to_thread(
                self.model.transcribe,
                temp_audio_path,
                language="ru",
                condition_on_previous_text=False
            )
            
            segments, info = segments_generator
            text = " ".join([segment.text for segment in segments])
            
            # Удаляем временный файл
            os.remove(temp_audio_path)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Ошибка распознавания ASR: {e}")
            if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
            return ""

# Создаем синглтон-экземпляр
asr_service = ASRService()