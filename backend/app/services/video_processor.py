import os
import subprocess
import logging
import tempfile
from pathlib import Path
from typing import List, Optional
from .subtitle_converter import segments_to_srt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self, upload_dir: str = "uploads", output_dir: str = "processed"):
        self.upload_dir = Path(upload_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def burn_subtitles(self, video_filename: str, segments: List[dict], output_filename: Optional[str] = None) -> str:
        """
        Burn subtitles into a video file using FFmpeg.
        
        Args:
            video_filename: Name of the input video file (must be in upload_dir)
            segments: List of transcript segments
            output_filename: Optional custom output filename
            
        Returns:
            Path to the processed video file
        """
        try:
            input_path = self.upload_dir / video_filename
            if not input_path.exists():
                raise FileNotFoundError(f"Video file not found: {video_filename}")

            # Generate default output filename if not provided
            if not output_filename:
                name_stem = input_path.stem
                output_filename = f"{name_stem}_subtitled.mp4"
            
            output_path = self.output_dir / output_filename

            # Create a temporary SRT file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as temp_srt:
                srt_content = segments_to_srt(segments, include_speaker=False)
                temp_srt.write(srt_content)
                temp_srt_path = temp_srt.name

            logger.info(f"Created temporary subtitle file at: {temp_srt_path}")

            # Construct FFmpeg command
            # Note: paths in ffmpeg filter complex need to be escaped properly on Windows
            # We use forward slashes for paths to avoid escape issues
            video_path_str = str(input_path).replace('\\', '/')
            srt_path_str = str(temp_srt_path).replace('\\', '/').replace(':', '\\:')
            output_path_str = str(output_path).replace('\\', '/')

            # Command: ffmpeg -i input.mp4 -vf "subtitles='path/to/subs.srt'" -c:a copy output.mp4
            # Using -y to overwrite output if exists
            command = [
                'ffmpeg',
                '-y',
                '-i', str(input_path),
                '-vf', f"subtitles='{srt_path_str}'",
                '-c:a', 'copy',
                str(output_path)
            ]

            logger.info(f"Running FFmpeg command: {' '.join(command)}")

            # Run FFmpeg
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True
            )

            # Clean up temp file
            try:
                os.unlink(temp_srt_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_srt_path}: {e}")

            logger.info(f"Successfully burned subtitles to: {output_path}")
            return str(output_path)

        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg failed: {e.stderr}")
            raise RuntimeError(f"FFmpeg processing failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Error burning subtitles: {str(e)}")
            raise

# Global instance
video_processor = VideoProcessor()
