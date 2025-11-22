import io
import numpy as np
import logging
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

# Global model instance for caching
_model = None


@lru_cache(maxsize=1)
def load_whisper_model(model_name: str = "base"):
    """
    Load Whisper model with caching to avoid reloading.
    
    Args:
        model_name: Model size (tiny, base, small, medium, large)
    
    Returns:
        Loaded Whisper model
    """
    try:
        import whisper
        logger.info(f"Loading Whisper model: {model_name}")
        model = whisper.load_model(model_name)
        logger.info(f"Whisper model {model_name} loaded successfully")
        return model
    except ImportError:
        logger.error("Whisper not installed. Install with: pip install openai-whisper")
        raise
    except Exception as e:
        logger.error(f"Error loading Whisper model: {e}")
        raise


def get_model(model_name: str = "base"):
    """
    Get cached model instance.
    
    Args:
        model_name: Model size to load
    
    Returns:
        Cached Whisper model
    """
    global _model
    if _model is None:
        _model = load_whisper_model(model_name)
    return _model


def transcribe_chunk(audio_bytes: bytes, language: str = "en") -> dict:
    """
    Transcribe audio chunk to text.
    
    Args:
        audio_bytes: Raw audio data in bytes
        language: Language code (default: "en")
    
    Returns:
        Dictionary with transcription results:
        {
            "text": str,
            "language": str,
            "segments": list
        }
    """
    try:
        # Get cached model
        model = get_model()
        
        # Convert bytes to numpy array
        # Assuming 16-bit PCM audio at 16kHz sample rate
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        
        # Transcribe
        logger.info("Transcribing audio chunk")
        result = model.transcribe(
            audio_array,
            language=language,
            fp16=False,
            task="transcribe"
        )
        
        logger.info(f"Transcription complete: {result['text'][:50]}...")
        
        return {
            "text": result["text"],
            "language": result.get("language", language),
            "segments": result.get("segments", [])
        }
        
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return {
            "text": "",
            "language": language,
            "segments": [],
            "error": str(e)
        }


def transcribe_file(file_path: str, language: str = "en") -> dict:
    """
    Transcribe audio file.
    
    Args:
        file_path: Path to audio file
        language: Language code (default: "en")
    
    Returns:
        Dictionary with transcription results
    """
    try:
        model = get_model()
        logger.info(f"Transcribing file: {file_path}")
        
        result = model.transcribe(
            file_path,
            language=language,
            fp16=False,
            task="transcribe"
        )
        
        logger.info("File transcription complete")
        
        return {
            "text": result["text"],
            "language": result.get("language", language),
            "segments": result.get("segments", [])
        }
        
    except Exception as e:
        logger.error(f"Error transcribing file: {e}")
        return {
            "text": "",
            "language": language,
            "segments": [],
            "error": str(e)
        }
