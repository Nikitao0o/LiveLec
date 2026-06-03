import asyncio
import base64
import logging
import os
import subprocess
import tempfile

from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

MIN_AUDIO_BYTES = 800


class ASRService:
    def __init__(self):
        self.model = None
        self._load_lock = asyncio.Lock()
        self._load_error: str | None = None

    def _load_sync(self) -> None:
        logger.info("Загрузка модели Faster-Whisper (первый раз ~1–2 мин)...")
        try:
            self.model = WhisperModel("small", device="cpu", compute_type="int8")
            self._load_error = None
            logger.info("Модель Whisper готова.")
        except Exception as exc:
            self.model = None
            self._load_error = str(exc)
            logger.error("Не удалось загрузить Whisper: %s", exc)

    async def ensure_model(self) -> bool:
        if self.model:
            return True
        async with self._load_lock:
            if self.model:
                return True
            if self._load_error and not self.model:
                return False
            await asyncio.to_thread(self._load_sync)
        return self.model is not None

    def _transcribe_sync(self, audio_path: str) -> str:
        segments, _info = self.model.transcribe(
            audio_path,
            language="ru",
            condition_on_previous_text=False,
            vad_filter=False,
        )
        return " ".join(
            segment.text.strip() for segment in segments if segment.text.strip()
        ).strip()

    def _convert_to_wav(self, source_path: str) -> str | None:
        wav_path = f"{source_path}.wav"
        result = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                source_path,
                "-ar",
                "16000",
                "-ac",
                "1",
                "-f",
                "wav",
                wav_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            logger.warning("ffmpeg: %s", (result.stderr or "")[:400])
            return None
        return wav_path

    def _transcribe_path(self, audio_path: str) -> str:
        wav_path = self._convert_to_wav(audio_path)
        if wav_path:
            try:
                return self._transcribe_sync(wav_path)
            except Exception as exc:
                logger.warning("Whisper on wav failed: %s", exc)
            finally:
                if os.path.exists(wav_path):
                    os.remove(wav_path)

        try:
            return self._transcribe_sync(audio_path)
        except Exception as exc:
            logger.error("Whisper on source failed: %s", exc)
            return ""

    async def process_audio_chunk(self, base64_chunk: str) -> str:
        if not base64_chunk:
            return ""

        if not await self.ensure_model():
            logger.error(
                "ASR модель недоступна%s",
                f": {self._load_error}" if self._load_error else "",
            )
            return ""

        temp_audio_path = None
        try:
            audio_bytes = base64.b64decode(base64_chunk)
            if len(audio_bytes) < MIN_AUDIO_BYTES:
                logger.info("ASR: слишком короткий фрагмент (%s байт)", len(audio_bytes))
                return ""

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name

            text = await asyncio.to_thread(self._transcribe_path, temp_audio_path)
            if text:
                logger.info("ASR: %s", text[:200])
            else:
                logger.info("ASR: пустой результат (%s байт аудио)", len(audio_bytes))
            return text
        except Exception as exc:
            logger.error("ASR process_audio_chunk: %s", exc)
            return ""
        finally:
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)


asr_service = ASRService()
