import base64
import logging
import asyncio
import os
import subprocess
import tempfile
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

MIN_AUDIO_BYTES = 2000


class ASRService:
    def __init__(self):
        self.model = None
        self.is_loading = False

    def load_model(self):
        if not self.model and not self.is_loading:
            self.is_loading = True
            logger.info("Загрузка модели Faster-Whisper (первый запуск может занять 1–2 мин)...")
            try:
                self.model = WhisperModel("small", device="cpu", compute_type="int8")
                logger.info("Модель Whisper готова.")
            except Exception as e:
                logger.error("Не удалось загрузить Whisper: %s", e)
            finally:
                self.is_loading = False

    def _transcribe_sync(self, audio_path: str) -> str:
        segments, _info = self.model.transcribe(
            audio_path,
            language="ru",
            condition_on_previous_text=False,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 200},
        )
        return " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()

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
                wav_path,
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logger.warning("ffmpeg convert failed: %s", result.stderr[:500])
            return None
        return wav_path

    def _transcribe_path(self, audio_path: str) -> str:
        try:
            return self._transcribe_sync(audio_path)
        except Exception as first_error:
            logger.warning("Whisper direct failed (%s), trying ffmpeg...", first_error)

        wav_path = self._convert_to_wav(audio_path)
        if not wav_path:
            return ""

        try:
            return self._transcribe_sync(wav_path)
        except Exception as second_error:
            logger.error("Whisper after ffmpeg failed: %s", second_error)
            return ""
        finally:
            if os.path.exists(wav_path):
                os.remove(wav_path)

    async def process_audio_chunk(self, base64_chunk: str) -> str:
        if not base64_chunk:
            return ""

        if not self.model:
            await asyncio.to_thread(self.load_model)

        if not self.model:
            return ""

        temp_audio_path = None
        try:
            audio_bytes = base64.b64decode(base64_chunk)
            if len(audio_bytes) < MIN_AUDIO_BYTES:
                logger.debug("ASR: chunk too small (%s bytes)", len(audio_bytes))
                return ""

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name

            text = await asyncio.to_thread(self._transcribe_path, temp_audio_path)
            if text:
                logger.info("ASR recognized: %s", text[:120])
            else:
                logger.debug("ASR: empty result for %s bytes", len(audio_bytes))
            return text
        except Exception as e:
            logger.error("Ошибка распознавания ASR: %s", e)
            return ""
        finally:
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)


asr_service = ASRService()
