import asyncio
import base64
import logging
import os
import re
import tempfile

from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

MIN_AUDIO_BYTES = 1200
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

_HALLUCINATION_PHRASES = (
    "динамичная музыка",
    "динамическая музыка",
    "продолжение следует",
    "субтитры",
    "subtitles",
    "thank you for watching",
    "thanks for watching",
    "аплодисменты",
    "amara.org",
    "редактор субтитров",
    "корректор",
)

_HALLUCINATION_RE = re.compile(
    "|".join(re.escape(p) for p in _HALLUCINATION_PHRASES),
    re.IGNORECASE,
)


def _clean_asr_text(text: str) -> str:
    if not text:
        return ""

    cleaned = _HALLUCINATION_RE.sub(" ", text)
    cleaned = re.sub(
        r"(?i)(\b(?:динамичн\w*|динамическ\w*)\s+музык\w*\b)(?:\s*,?\s*\1)+",
        " ",
        cleaned,
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" \"'.,;:-")
    if len(cleaned) < 2:
        return ""
    if cleaned.lower() in _HALLUCINATION_PHRASES:
        return ""
    return cleaned


class ASRService:
    def __init__(self):
        self.model = None
        self._load_lock = asyncio.Lock()
        self._load_error: str | None = None

    def _load_sync(self) -> None:
        logger.info("Загрузка модели Faster-Whisper (%s)...", WHISPER_MODEL)
        try:
            self.model = WhisperModel(
                WHISPER_MODEL, device="cpu", compute_type="int8"
            )
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
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": 400,
                "speech_pad_ms": 120,
                "threshold": 0.45,
            },
            beam_size=3,
            best_of=1,
            temperature=0.0,
            no_speech_threshold=0.65,
            log_prob_threshold=-0.7,
            compression_ratio_threshold=2.0,
            hallucination_silence_threshold=1.5,
        )
        parts: list[str] = []
        for segment in segments:
            phrase = segment.text.strip()
            if not phrase:
                continue
            if segment.no_speech_prob > 0.55:
                continue
            if segment.avg_logprob < -0.85:
                continue
            cleaned = _clean_asr_text(phrase)
            if cleaned:
                parts.append(cleaned)

        return _clean_asr_text(" ".join(parts))

    def _transcribe_path(self, audio_path: str) -> str:
        try:
            return self._transcribe_sync(audio_path)
        except Exception as exc:
            logger.error("Whisper failed: %s", exc)
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
