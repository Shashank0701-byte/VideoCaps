from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "VideoCaps"
    
    # CORS Settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Model Settings
    MODEL_NAME: str = "whisper-base"
    MODEL_PATH: str = "../models/whisper"
    DEVICE: str = "cpu"  # or "cuda" for GPU
    
    # Audio Settings
    SAMPLE_RATE: int = 16000
    MAX_AUDIO_LENGTH: int = 300  # seconds
    CHUNK_SIZE: int = 1024
    
    # WebSocket Settings
    WS_MESSAGE_QUEUE_SIZE: int = 100
    WS_HEARTBEAT_INTERVAL: int = 30
    
    # Transcription Settings
    LANGUAGE: str = "en"
    TASK: str = "transcribe"  # or "translate"
    BEAM_SIZE: int = 5
    BEST_OF: int = 5
    TEMPERATURE: float = 0.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
