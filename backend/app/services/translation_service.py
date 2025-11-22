import os
import logging
from typing import Optional, Dict
from googletrans import Translator, LANGUAGES

logger = logging.getLogger(__name__)

# Initialize translator
translator = Translator()


def detect_language(text: str) -> Dict[str, any]:
    """
    Detect the language of the given text.
    
    Args:
        text: Text to detect language for
        
    Returns:
        Dictionary with language code and confidence
    """
    try:
        detection = translator.detect(text)
        
        return {
            "language": detection.lang,
            "language_name": LANGUAGES.get(detection.lang, "Unknown"),
            "confidence": detection.confidence
        }
        
    except Exception as e:
        logger.error(f"Error detecting language: {e}")
        return {
            "language": "en",
            "language_name": "English",
            "confidence": 0.0,
            "error": str(e)
        }


def translate_text(text: str, target_lang: str = "en", source_lang: str = "auto") -> Dict[str, any]:
    """
    Translate text to target language.
    
    Args:
        text: Text to translate
        target_lang: Target language code (default: "en")
        source_lang: Source language code (default: "auto" for auto-detection)
        
    Returns:
        Dictionary with translation results
    """
    try:
        # Translate text
        translation = translator.translate(
            text,
            dest=target_lang,
            src=source_lang
        )
        
        return {
            "original_text": text,
            "translated_text": translation.text,
            "source_language": translation.src,
            "source_language_name": LANGUAGES.get(translation.src, "Unknown"),
            "target_language": target_lang,
            "target_language_name": LANGUAGES.get(target_lang, "Unknown"),
            "pronunciation": translation.pronunciation
        }
        
    except Exception as e:
        logger.error(f"Error translating text: {e}")
        return {
            "original_text": text,
            "translated_text": text,
            "source_language": source_lang,
            "target_language": target_lang,
            "error": str(e)
        }


def translate_segments(segments: list, target_lang: str = "en") -> list:
    """
    Translate a list of transcript segments.
    
    Args:
        segments: List of segment dictionaries with 'text' field
        target_lang: Target language code
        
    Returns:
        List of segments with translations added
    """
    try:
        translated_segments = []
        
        for segment in segments:
            text = segment.get("text", "")
            
            if not text:
                translated_segments.append(segment)
                continue
            
            # Translate segment text
            translation = translate_text(text, target_lang=target_lang)
            
            # Add translation to segment
            segment_copy = segment.copy()
            segment_copy["translated_text"] = translation["translated_text"]
            segment_copy["source_language"] = translation["source_language"]
            
            translated_segments.append(segment_copy)
        
        return translated_segments
        
    except Exception as e:
        logger.error(f"Error translating segments: {e}")
        return segments


def get_supported_languages() -> Dict[str, str]:
    """
    Get dictionary of supported language codes and names.
    
    Returns:
        Dictionary mapping language codes to language names
    """
    return LANGUAGES


def is_language_supported(lang_code: str) -> bool:
    """
    Check if a language code is supported.
    
    Args:
        lang_code: Language code to check
        
    Returns:
        True if supported, False otherwise
    """
    return lang_code in LANGUAGES
