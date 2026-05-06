import tempfile
import os
import wave
import struct

try:
    import whisper
    _model = None

    def _load_model():
        global _model
        if _model is None:
            _model = whisper.load_model("base")
        return _model

    def transcribe_audio(audio_bytes: bytes, language: str = "de") -> str:
        model = _load_model()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            result = model.transcribe(tmp_path, language=language)
            return result.get("text", "").strip()
        finally:
            os.unlink(tmp_path)

    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

    def transcribe_audio(audio_bytes: bytes, language: str = "de") -> str:
        return ""
