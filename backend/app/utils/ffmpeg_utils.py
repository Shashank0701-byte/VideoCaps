import subprocess
import os
import tempfile
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_audio_from_video(video_path: str, output_path: str) -> bool:
    """
    Extract audio from video file using ffmpeg.
    
    Args:
        video_path: Path to input video file
        output_path: Path to output audio file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # FFmpeg command to extract audio
        command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',  # No video
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',  # Mono
            '-y',  # Overwrite output file
            output_path
        ]
        
        # Run ffmpeg
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            logger.info(f"Successfully extracted audio to {output_path}")
            return True
        else:
            logger.error(f"FFmpeg error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg timeout - file too large or processing too slow")
        return False
    except FileNotFoundError:
        logger.error("FFmpeg not found. Please install ffmpeg.")
        return False
    except Exception as e:
        logger.error(f"Error extracting audio: {e}")
        return False


def convert_audio_format(input_path: str, output_path: str) -> bool:
    """
    Convert audio to 16kHz mono WAV format.
    
    Args:
        input_path: Path to input audio file
        output_path: Path to output WAV file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        command = [
            'ffmpeg',
            '-i', input_path,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            output_path
        ]
        
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            logger.info(f"Successfully converted audio to {output_path}")
            return True
        else:
            logger.error(f"FFmpeg conversion error: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Error converting audio: {e}")
        return False


def get_audio_duration(file_path: str) -> float:
    """
    Get duration of audio/video file in seconds.
    
    Args:
        file_path: Path to media file
        
    Returns:
        Duration in seconds, or 0 if error
    """
    try:
        command = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return float(result.stdout.strip())
        else:
            return 0.0
            
    except Exception as e:
        logger.error(f"Error getting duration: {e}")
        return 0.0
