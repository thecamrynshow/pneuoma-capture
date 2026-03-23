import asyncio
import os
import tempfile

from faster_whisper import WhisperModel

from ..config import settings


class TranscriptionService:
    def __init__(self):
        self._model: WhisperModel | None = None

    def load_model(self):
        self._model = WhisperModel(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )

    def _get_model(self) -> WhisperModel:
        if self._model is None:
            self.load_model()
        return self._model

    def _transcribe_sync(self, audio_bytes: bytes, content_type: str) -> str:
        ext = "webm"
        if "mp4" in content_type:
            ext = "mp4"
        elif "ogg" in content_type:
            ext = "ogg"

        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name

        try:
            segments, _ = self._get_model().transcribe(tmp_path, language="en")
            text = " ".join(segment.text.strip() for segment in segments)
        finally:
            os.unlink(tmp_path)

        return text.strip()

    async def transcribe(self, audio_bytes: bytes, content_type: str) -> str:
        return await asyncio.to_thread(
            self._transcribe_sync, audio_bytes, content_type
        )
