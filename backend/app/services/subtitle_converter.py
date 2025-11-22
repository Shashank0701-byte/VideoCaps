"""
Subtitle format conversion utilities for SRT and VTT formats.
"""

import logging
from typing import List, Dict, Optional
from datetime import timedelta

logger = logging.getLogger(__name__)


def format_timestamp_srt(seconds: float) -> str:
    """
    Format timestamp for SRT format (HH:MM:SS,mmm).
    
    Args:
        seconds: Time in seconds
        
    Returns:
        Formatted timestamp string
    """
    td = timedelta(seconds=seconds)
    hours = int(td.total_seconds() // 3600)
    minutes = int((td.total_seconds() % 3600) // 60)
    secs = int(td.total_seconds() % 60)
    millis = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    """
    Format timestamp for VTT format (HH:MM:SS.mmm).
    
    Args:
        seconds: Time in seconds
        
    Returns:
        Formatted timestamp string
    """
    td = timedelta(seconds=seconds)
    hours = int(td.total_seconds() // 3600)
    minutes = int((td.total_seconds() % 3600) // 60)
    secs = int(td.total_seconds() % 60)
    millis = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def clean_text_for_subtitle(text: str) -> str:
    """
    Clean and format text for subtitle display.
    
    Args:
        text: Raw text
        
    Returns:
        Cleaned text
    """
    # Remove extra whitespace
    text = " ".join(text.split())
    
    # Remove or replace problematic characters
    text = text.replace("\n", " ")
    text = text.replace("\r", " ")
    
    # Limit line length (optional, can be configured)
    max_line_length = 42  # Standard subtitle line length
    if len(text) > max_line_length * 2:
        # Split into multiple lines if too long
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= max_line_length:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [word]
                current_length = len(word)
        
        if current_line:
            lines.append(" ".join(current_line))
        
        # Join with newlines, max 2 lines per subtitle
        if len(lines) > 2:
            text = "\n".join(lines[:2])
        else:
            text = "\n".join(lines)
    
    return text


def segments_to_srt(segments: List[Dict], include_speaker: bool = True) -> str:
    """
    Convert transcript segments to SRT format.
    
    SRT Format:
    1
    00:00:00,000 --> 00:00:05,000
    First subtitle text
    
    2
    00:00:05,000 --> 00:00:10,000
    Second subtitle text
    
    Args:
        segments: List of segment dictionaries with 'start', 'end', 'text', and optionally 'speaker'
        include_speaker: Whether to include speaker labels in the text
        
    Returns:
        SRT formatted string
    """
    if not segments:
        logger.warning("No segments provided for SRT conversion")
        return ""
    
    srt_content = []
    
    for i, segment in enumerate(segments, start=1):
        try:
            start_time = segment.get("start", 0)
            end_time = segment.get("end", 0)
            text = segment.get("text", "")
            speaker = segment.get("speaker", "")
            
            # Format timestamps
            start_ts = format_timestamp_srt(start_time)
            end_ts = format_timestamp_srt(end_time)
            
            # Add speaker label if available and requested
            if include_speaker and speaker:
                speaker_label = format_speaker_label(speaker)
                text = f"[{speaker_label}] {text}"
            
            # Clean text
            text = clean_text_for_subtitle(text)
            
            # Build SRT block
            srt_block = f"{i}\n{start_ts} --> {end_ts}\n{text}\n"
            srt_content.append(srt_block)
            
        except Exception as e:
            logger.error(f"Error processing segment {i}: {e}")
            continue
    
    return "\n".join(srt_content)


def segments_to_vtt(segments: List[Dict], include_speaker: bool = True, include_metadata: bool = True) -> str:
    """
    Convert transcript segments to WebVTT format.
    
    VTT Format:
    WEBVTT
    
    00:00:00.000 --> 00:00:05.000
    First subtitle text
    
    00:00:05.000 --> 00:00:10.000
    Second subtitle text
    
    Args:
        segments: List of segment dictionaries with 'start', 'end', 'text', and optionally 'speaker'
        include_speaker: Whether to include speaker labels in the text
        include_metadata: Whether to include metadata header
        
    Returns:
        VTT formatted string
    """
    if not segments:
        logger.warning("No segments provided for VTT conversion")
        return "WEBVTT\n\n"
    
    vtt_content = ["WEBVTT"]
    
    # Add metadata if requested
    if include_metadata:
        vtt_content.append("Kind: captions")
        vtt_content.append("Language: en")
    
    vtt_content.append("")  # Empty line after header
    
    for i, segment in enumerate(segments, start=1):
        try:
            start_time = segment.get("start", 0)
            end_time = segment.get("end", 0)
            text = segment.get("text", "")
            speaker = segment.get("speaker", "")
            
            # Format timestamps
            start_ts = format_timestamp_vtt(start_time)
            end_ts = format_timestamp_vtt(end_time)
            
            # Add speaker label if available and requested
            if include_speaker and speaker:
                speaker_label = format_speaker_label(speaker)
                # VTT supports voice tags
                text = f"<v {speaker_label}>{text}</v>"
            
            # Clean text (but preserve VTT tags)
            if not (include_speaker and speaker):
                text = clean_text_for_subtitle(text)
            
            # Build VTT block (optionally with cue identifier)
            vtt_block = f"{start_ts} --> {end_ts}\n{text}\n"
            vtt_content.append(vtt_block)
            
        except Exception as e:
            logger.error(f"Error processing segment {i}: {e}")
            continue
    
    return "\n".join(vtt_content)


def format_speaker_label(speaker: str) -> str:
    """
    Format speaker identifier into readable label.
    
    Args:
        speaker: Speaker identifier (e.g., 'SPEAKER_00')
        
    Returns:
        Formatted speaker label (e.g., 'Speaker 1')
    """
    try:
        if speaker.startswith("SPEAKER_"):
            num = int(speaker.split("_")[1]) + 1
            return f"Speaker {num}"
        return speaker
    except:
        return speaker


def save_subtitle_file(content: str, filepath: str, format: str = "srt") -> bool:
    """
    Save subtitle content to file.
    
    Args:
        content: Subtitle content
        filepath: Path to save file
        format: Subtitle format ('srt' or 'vtt')
        
    Returns:
        True if successful, False otherwise
    """
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        logger.info(f"Saved {format.upper()} file to {filepath}")
        return True
    except Exception as e:
        logger.error(f"Error saving {format.upper()} file: {e}")
        return False


def convert_transcript_to_subtitles(
    segments: List[Dict],
    output_format: str = "both",
    include_speaker: bool = True,
    output_dir: Optional[str] = None,
    base_filename: str = "subtitles"
) -> Dict[str, str]:
    """
    Convert transcript segments to subtitle formats.
    
    Args:
        segments: List of segment dictionaries
        output_format: 'srt', 'vtt', or 'both'
        include_speaker: Whether to include speaker labels
        output_dir: Directory to save files (if None, returns content only)
        base_filename: Base filename for output files
        
    Returns:
        Dictionary with format as key and content/filepath as value
    """
    results = {}
    
    try:
        if output_format in ["srt", "both"]:
            srt_content = segments_to_srt(segments, include_speaker)
            
            if output_dir:
                filepath = f"{output_dir}/{base_filename}.srt"
                save_subtitle_file(srt_content, filepath, "srt")
                results["srt"] = filepath
            else:
                results["srt"] = srt_content
        
        if output_format in ["vtt", "both"]:
            vtt_content = segments_to_vtt(segments, include_speaker)
            
            if output_dir:
                filepath = f"{output_dir}/{base_filename}.vtt"
                save_subtitle_file(vtt_content, filepath, "vtt")
                results["vtt"] = filepath
            else:
                results["vtt"] = vtt_content
        
        logger.info(f"Successfully converted transcript to {output_format} format(s)")
        
    except Exception as e:
        logger.error(f"Error converting transcript to subtitles: {e}")
    
    return results


# Example usage
if __name__ == "__main__":
    # Test data
    test_segments = [
        {
            "start": 0.0,
            "end": 3.5,
            "text": "Hello, welcome to this video tutorial.",
            "speaker": "SPEAKER_00"
        },
        {
            "start": 3.5,
            "end": 7.2,
            "text": "Today we'll be learning about subtitle formats.",
            "speaker": "SPEAKER_00"
        },
        {
            "start": 7.5,
            "end": 11.0,
            "text": "That sounds great! I'm excited to learn.",
            "speaker": "SPEAKER_01"
        }
    ]
    
    # Generate SRT
    srt_output = segments_to_srt(test_segments)
    print("SRT Output:")
    print(srt_output)
    print("\n" + "="*50 + "\n")
    
    # Generate VTT
    vtt_output = segments_to_vtt(test_segments)
    print("VTT Output:")
    print(vtt_output)
