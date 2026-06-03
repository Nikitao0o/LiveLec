import base64
import tempfile
import os
import logging
import asyncio
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

class ASRService:
    def __init__(self):
        # Не загружаем тяжелую модель при старте бэкенда
        self.model = None
        self.is_loading = False

    def load_model(self):
        """Синхронная функция скачивания и инициализации модели"""
        if not self.model and not self.is_loading:
            self.is_loading = True
            logger.info("Первый запуск: скачивание модели Faster-Whisper (может занять 1-2 минуты)...")
            try:
                self.model = WhisperModel("small", device="cpu", compute_type="int8")
                logger.info("Модель Whisper успешно загружена и готова к работе!")
            except Exception as e:
                logger.error(f"Не удалось загрузить Whisper: {e}")
            finally:
                self.is_loading = False

    async def process_audio_chunk(self, base64_chunk: str) -> str:
        if not base64_chunk:
            return ""
            
        # Ленивая загрузка: если модели еще нет, загружаем её в фоновом потоке
        if not self.model:
            await asyncio.to_thread(self.load_model)

        # Если загрузка не удалась, просто возвращаем пустоту
        if not self.model:
            return ""

        try:
            audio_bytes = base64.b64decode(base64_chunk)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name

            segments_generator = await asyncio.to_thread(
                self.model.transcribe,
                temp_audio_path,
                language="ru",
                condition_on_previous_text=False
            )
            
            segments, info = segments_generator
            text = " ".join([segment.text for segment in segments])
            
            os.remove(temp_audio_path)
            return text.strip()
            
        except Exception as e:
            logger.error(f"Ошибка распознавания ASR: {e}")
            if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
            return ""

# Создаем синглтон
asr_service = ASRService()