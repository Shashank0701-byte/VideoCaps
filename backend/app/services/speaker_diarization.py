import logging
from typing import Dict, List, Optional
import numpy as np

logger = logging.getLogger(__name__)


def perform_speaker_diarization(audio_path: str, num_speakers: Optional[int] = None) -> List[Dict]:
    """
    Perform speaker diarization on audio file using pyannote.audio.
    
    Args:
        audio_path: Path to audio file
        num_speakers: Optional number of speakers (if known)
        
    Returns:
        List of diarization segments with speaker labels
    """
    try:
        from pyannote.audio import Pipeline
        
        # Initialize the speaker diarization pipeline
        # Note: Requires HuggingFace token for model access
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=None  # Will be set from environment variable
        )
        
        # Perform diarization
        if num_speakers:
            diarization = pipeline(audio_path, num_speakers=num_speakers)
        else:
            diarization = pipeline(audio_path)
        
        # Convert diarization results to list of segments
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker,
                "duration": turn.end - turn.start
            })
        
        logger.info(f"Diarization complete: {len(segments)} segments, {len(set(s['speaker'] for s in segments))} speakers")
        return segments
        
    except ImportError:
        logger.warning("pyannote.audio not installed, using fallback clustering method")
        return perform_clustering_diarization(audio_path, num_speakers)
    except Exception as e:
        logger.error(f"Error in speaker diarization: {e}")
        return []


def perform_clustering_diarization(audio_path: str, num_speakers: Optional[int] = 2) -> List[Dict]:
    """
    Fallback speaker diarization using audio embeddings and clustering.
    
    Args:
        audio_path: Path to audio file
        num_speakers: Number of speakers to detect (default: 2)
        
    Returns:
        List of diarization segments with speaker labels
    """
    try:
        import librosa
        from sklearn.cluster import KMeans
        from scipy.signal import find_peaks
        
        # Load audio
        audio, sr = librosa.load(audio_path, sr=16000)
        
        # Extract MFCC features for speaker identification
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        
        # Segment audio into chunks (e.g., 1 second)
        hop_length = sr  # 1 second
        n_frames = mfccs.shape[1]
        
        # Aggregate MFCCs per segment
        segment_features = []
        segment_times = []
        
        for i in range(0, n_frames, hop_length // 512):
            if i + 10 < n_frames:  # Need at least 10 frames
                segment_mfcc = mfccs[:, i:i+10].mean(axis=1)
                segment_features.append(segment_mfcc)
                segment_times.append(i * 512 / sr)
        
        if len(segment_features) < num_speakers:
            logger.warning("Not enough segments for clustering")
            return []
        
        # Perform K-means clustering
        kmeans = KMeans(n_clusters=num_speakers, random_state=42, n_init=10)
        labels = kmeans.fit_predict(segment_features)
        
        # Convert to segments with speaker labels
        segments = []
        current_speaker = labels[0]
        start_time = 0
        
        for i, (label, time) in enumerate(zip(labels, segment_times)):
            if label != current_speaker or i == len(labels) - 1:
                segments.append({
                    "start": start_time,
                    "end": time,
                    "speaker": f"SPEAKER_{current_speaker:02d}",
                    "duration": time - start_time
                })
                current_speaker = label
                start_time = time
        
        logger.info(f"Clustering diarization complete: {len(segments)} segments")
        return segments
        
    except Exception as e:
        logger.error(f"Error in clustering diarization: {e}")
        return []


def merge_transcription_with_diarization(
    transcription_segments: List[Dict],
    diarization_segments: List[Dict]
) -> List[Dict]:
    """
    Merge transcription segments with speaker diarization results.
    
    Args:
        transcription_segments: List of transcription segments with text and timestamps
        diarization_segments: List of diarization segments with speaker labels
        
    Returns:
        List of merged segments with text and speaker labels
    """
    merged_segments = []
    
    for trans_seg in transcription_segments:
        trans_start = trans_seg.get("start", 0)
        trans_end = trans_seg.get("end", trans_start + 1)
        trans_mid = (trans_start + trans_end) / 2
        
        # Find the diarization segment that overlaps most with this transcription
        best_speaker = "SPEAKER_00"
        max_overlap = 0
        
        for diar_seg in diarization_segments:
            diar_start = diar_seg["start"]
            diar_end = diar_seg["end"]
            
            # Calculate overlap
            overlap_start = max(trans_start, diar_start)
            overlap_end = min(trans_end, diar_end)
            overlap = max(0, overlap_end - overlap_start)
            
            if overlap > max_overlap:
                max_overlap = overlap
                best_speaker = diar_seg["speaker"]
        
        # Add speaker label to transcription segment
        merged_seg = trans_seg.copy()
        merged_seg["speaker"] = best_speaker
        merged_segments.append(merged_seg)
    
    return merged_segments


def format_speaker_label(speaker: str) -> str:
    """
    Format speaker label for display.
    
    Args:
        speaker: Raw speaker label (e.g., "SPEAKER_00" or "SPEAKER_0")
        
    Returns:
        Formatted speaker label (e.g., "Speaker 1")
    """
    try:
        # Extract number from speaker label
        if "SPEAKER_" in speaker:
            num = int(speaker.split("_")[1])
            return f"Speaker {num + 1}"
        else:
            return speaker
    except:
        return speaker
