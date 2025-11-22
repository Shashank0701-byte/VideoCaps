import io
import wave
import numpy as np
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


class AudioPipeline:
    """Pipeline for processing raw audio bytes for speech-to-text"""
    
    def __init__(
        self,
        sample_rate: int = 16000,
        channels: int = 1,
        sample_width: int = 2,
        chunk_duration: float = 5.0
    ):
        """
        Initialize audio pipeline.
        
        Args:
            sample_rate: Audio sample rate in Hz (default: 16000)
            channels: Number of audio channels (default: 1 for mono)
            sample_width: Sample width in bytes (default: 2 for 16-bit)
            chunk_duration: Duration of each chunk in seconds (default: 5.0)
        """
        self.sample_rate = sample_rate
        self.channels = channels
        self.sample_width = sample_width
        self.chunk_duration = chunk_duration
        self.chunk_size = int(sample_rate * chunk_duration)
        
    def bytes_to_wav(self, audio_bytes: bytes) -> bytes:
        """
        Convert raw audio bytes to WAV format.
        
        Args:
            audio_bytes: Raw audio data
            
        Returns:
            WAV formatted audio bytes
        """
        try:
            wav_buffer = io.BytesIO()
            
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(self.channels)
                wav_file.setsampwidth(self.sample_width)
                wav_file.setframerate(self.sample_rate)
                wav_file.writeframes(audio_bytes)
            
            wav_buffer.seek(0)
            logger.info(f"Converted {len(audio_bytes)} bytes to WAV format")
            return wav_buffer.read()
            
        except Exception as e:
            logger.error(f"Error converting to WAV: {e}")
            raise
    
    def normalize_audio(self, audio_bytes: bytes) -> np.ndarray:
        """
        Normalize audio data to [-1.0, 1.0] range.
        
        Args:
            audio_bytes: Raw audio bytes
            
        Returns:
            Normalized numpy array
        """
        try:
            # Convert bytes to numpy array (assuming 16-bit PCM)
            audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
            
            # Normalize to [-1.0, 1.0]
            normalized = audio_array.astype(np.float32) / 32768.0
            
            # Apply basic noise gate (optional)
            threshold = 0.01
            normalized[np.abs(normalized) < threshold] = 0
            
            logger.info(f"Normalized audio: shape={normalized.shape}, range=[{normalized.min():.3f}, {normalized.max():.3f}]")
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing audio: {e}")
            raise
    
    def slice_into_chunks(self, audio_array: np.ndarray) -> List[np.ndarray]:
        """
        Slice audio into fixed-duration chunks.
        
        Args:
            audio_array: Normalized audio array
            
        Returns:
            List of audio chunks
        """
        try:
            chunks = []
            total_samples = len(audio_array)
            
            for start in range(0, total_samples, self.chunk_size):
                end = min(start + self.chunk_size, total_samples)
                chunk = audio_array[start:end]
                
                # Pad last chunk if needed
                if len(chunk) < self.chunk_size:
                    chunk = np.pad(chunk, (0, self.chunk_size - len(chunk)), mode='constant')
                
                chunks.append(chunk)
            
            logger.info(f"Sliced audio into {len(chunks)} chunks of {self.chunk_duration}s each")
            return chunks
            
        except Exception as e:
            logger.error(f"Error slicing audio: {e}")
            raise
    
    def prepare_for_stt(self, audio_bytes: bytes) -> List[np.ndarray]:
        """
        Complete pipeline: convert, normalize, and slice audio for STT.
        
        Args:
            audio_bytes: Raw audio bytes
            
        Returns:
            List of processed audio chunks ready for transcription
        """
        try:
            logger.info("Starting audio pipeline processing")
            
            # Step 1: Normalize audio
            normalized_audio = self.normalize_audio(audio_bytes)
            
            # Step 2: Slice into chunks
            chunks = self.slice_into_chunks(normalized_audio)
            
            logger.info(f"Pipeline complete: {len(chunks)} chunks ready for STT")
            return chunks
            
        except Exception as e:
            logger.error(f"Error in audio pipeline: {e}")
            raise
    
    def process_stream_chunk(self, audio_bytes: bytes) -> Tuple[np.ndarray, bytes]:
        """
        Process streaming audio chunk (for real-time processing).
        
        Args:
            audio_bytes: Raw audio bytes from stream
            
        Returns:
            Tuple of (processed_audio, wav_bytes)
        """
        try:
            # Normalize
            normalized = self.normalize_audio(audio_bytes)
            
            # Convert to WAV for compatibility
            wav_bytes = self.bytes_to_wav(audio_bytes)
            
            logger.info(f"Processed stream chunk: {len(audio_bytes)} bytes")
            return normalized, wav_bytes
            
        except Exception as e:
            logger.error(f"Error processing stream chunk: {e}")
            raise


def create_pipeline(sample_rate: int = 16000, chunk_duration: float = 5.0) -> AudioPipeline:
    """
    Factory function to create an AudioPipeline instance.
    
    Args:
        sample_rate: Audio sample rate in Hz
        chunk_duration: Duration of each chunk in seconds
        
    Returns:
        Configured AudioPipeline instance
    """
    return AudioPipeline(
        sample_rate=sample_rate,
        chunk_duration=chunk_duration
    )
