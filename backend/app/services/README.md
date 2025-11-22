# Backend Services

This directory contains various service modules for the VideoCaps backend.

## Services Overview

### 1. **Translation Service** (`translation_service.py`)
Handles text translation using Google Translate API.

**Features:**
- Auto language detection
- Text translation to 100+ languages
- Segment-level translation
- Language support checking

**Usage:**
```python
from app.services.translation_service import translate_text, detect_language

# Detect language
lang = detect_language("Hello world")

# Translate text
translated = translate_text("Hello", target_lang="es")
```

### 2. **Speaker Diarization** (`speaker_diarization.py`)
Identifies different speakers in audio files.

**Features:**
- PyAnnote.audio integration (professional-grade)
- Fallback clustering method (MFCC + K-means)
- Speaker label merging with transcription
- Configurable number of speakers

**Usage:**
```python
from app.services.speaker_diarization import perform_speaker_diarization

# Perform diarization
segments = perform_speaker_diarization("audio.wav", num_speakers=2)
```

**Requirements:**
- HuggingFace token for pyannote.audio models
- Optional: librosa, scikit-learn for fallback method

### 3. **Text Post-processing** (`text_postprocessing.py`)
Improves transcription readability with punctuation, capitalization, and formatting.

**Features:**
- **Punctuation Restoration**: Adds periods, commas, question marks
- **Capitalization**: Proper sentence and proper noun capitalization
- **Paragraph Splitting**: Intelligent paragraph breaks based on:
  - Speaker changes
  - Long pauses (>2 seconds)
  - Sentence count
- **Question Detection**: Identifies and marks questions
- **Abbreviation Handling**: Recognizes common abbreviations
- **ML-based Option**: Support for deep learning punctuation models

**Usage:**
```python
from app.services.text_postprocessing import apply_postprocessing

# Process text
result = apply_postprocessing(
    text="hello world how are you doing today",
    segments=[...]  # Optional
)

# Output: "Hello world. How are you doing today?"
```

**Advanced (ML-based):**
```python
from app.services.text_postprocessing import apply_ml_punctuation

# Requires: pip install deepmultilingualpunctuation
text = apply_ml_punctuation("hello world how are you")
```

**Configuration:**
- `long_pause_threshold`: Minimum pause for paragraph break (default: 2.0s)
- Customizable sentence starters and abbreviations

## Installation

### Basic (Rule-based):
```bash
pip install -r requirements.txt
```

### Advanced (ML-based punctuation):
```bash
pip install deepmultilingualpunctuation
```

### Speaker Diarization:
```bash
pip install pyannote.audio librosa scikit-learn
```

Set `HUGGINGFACE_TOKEN` in `.env` file.

## Pipeline Integration

The services are integrated in the following order in `main.py`:

1. **Transcription** (Whisper)
2. **Text Post-processing** (Punctuation, capitalization)
3. **Speaker Diarization** (Speaker labels)
4. **Translation** (Optional, if requested)

This ensures the best quality output with proper formatting and speaker identification.

## Error Handling

All services include graceful error handling:
- Services fail silently with warnings
- Processing continues even if a service fails
- Logs provide detailed error information

## Future Enhancements

- [ ] Custom punctuation model training
- [ ] Named entity recognition (NER)
- [ ] Sentiment analysis
- [ ] Summarization
- [ ] Keyword extraction
- [ ] Language-specific post-processing rules
