import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class TextPostProcessor:
    """
    Post-processes transcribed text for better readability.
    Handles punctuation, capitalization, and paragraph splitting.
    """
    
    def __init__(self):
        # Common sentence-ending patterns
        self.sentence_enders = r'[.!?]'
        
        # Words that typically start sentences
        self.sentence_starters = {
            'so', 'and', 'but', 'however', 'therefore', 'moreover',
            'furthermore', 'additionally', 'meanwhile', 'then', 'now',
            'well', 'okay', 'alright', 'yes', 'no', 'actually', 'basically'
        }
        
        # Pause indicators for paragraph breaks
        self.long_pause_threshold = 2.0  # seconds
        
        # Common abbreviations that shouldn't end sentences
        self.abbreviations = {
            'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr',
            'inc', 'ltd', 'corp', 'co', 'etc', 'vs', 'e.g', 'i.e'
        }
    
    def process_text(self, text: str, segments: Optional[List[Dict]] = None) -> str:
        """
        Main processing function that applies all post-processing steps.
        
        Args:
            text: Raw transcribed text
            segments: Optional list of segments with timestamps
            
        Returns:
            Processed text with proper punctuation, capitalization, and paragraphs
        """
        if not text or not text.strip():
            return text
        
        # Step 1: Clean up the text
        text = self._clean_text(text)
        
        # Step 2: Add punctuation
        text = self._add_punctuation(text)
        
        # Step 3: Fix capitalization
        text = self._fix_capitalization(text)
        
        # Step 4: Split into paragraphs (if segments available)
        if segments:
            text = self._split_paragraphs_with_segments(text, segments)
        else:
            text = self._split_paragraphs_simple(text)
        
        # Step 5: Final cleanup
        text = self._final_cleanup(text)
        
        return text
    
    def _clean_text(self, text: str) -> str:
        """Remove extra whitespace and normalize text."""
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Remove spaces before punctuation
        text = re.sub(r'\s+([,.!?;:])', r'\1', text)
        
        # Add space after punctuation if missing
        text = re.sub(r'([,.!?;:])([A-Za-z])', r'\1 \2', text)
        
        return text.strip()
    
    def _add_punctuation(self, text: str) -> str:
        """
        Add punctuation to text based on patterns and context.
        This is a rule-based approach - for better results, consider using
        a punctuation restoration model like punctuator2 or deepmultilingualpunctuation.
        """
        sentences = []
        current_sentence = []
        words = text.split()
        
        for i, word in enumerate(words):
            current_sentence.append(word)
            
            # Check if this word should end a sentence
            if self._should_end_sentence(word, words, i):
                sentence = ' '.join(current_sentence)
                
                # Add appropriate ending punctuation if not present
                if not re.search(r'[.!?]$', sentence):
                    # Determine if it's a question
                    if self._is_question(sentence):
                        sentence += '?'
                    else:
                        sentence += '.'
                
                sentences.append(sentence)
                current_sentence = []
        
        # Add remaining words
        if current_sentence:
            sentence = ' '.join(current_sentence)
            if not re.search(r'[.!?]$', sentence):
                sentence += '.'
            sentences.append(sentence)
        
        return ' '.join(sentences)
    
    def _should_end_sentence(self, word: str, words: List[str], index: int) -> bool:
        """Determine if a word should end a sentence."""
        # Already has ending punctuation
        if re.search(r'[.!?]$', word):
            # Check if it's an abbreviation
            clean_word = word.rstrip('.!?').lower()
            if clean_word in self.abbreviations:
                return False
            return True
        
        # Check if next word starts with capital (in original transcription)
        if index + 1 < len(words):
            next_word = words[index + 1]
            if next_word[0].isupper() and next_word.lower() in self.sentence_starters:
                return True
        
        # Sentence length heuristic (avoid very long sentences)
        if index > 0 and (index + 1) % 15 == 0:  # Every ~15 words
            return True
        
        return False
    
    def _is_question(self, sentence: str) -> bool:
        """Determine if a sentence is a question."""
        question_words = ['who', 'what', 'when', 'where', 'why', 'how', 'is', 'are', 'do', 'does', 'did', 'can', 'could', 'would', 'should']
        
        # Check if sentence starts with a question word
        first_word = sentence.split()[0].lower().rstrip(',.!?')
        if first_word in question_words:
            return True
        
        # Check for question patterns
        if re.search(r'\b(is it|are you|do you|can you|could you|would you|should i)\b', sentence.lower()):
            return True
        
        return False
    
    def _fix_capitalization(self, text: str) -> str:
        """Fix capitalization of sentences and proper nouns."""
        # Split into sentences
        sentences = re.split(r'([.!?]\s+)', text)
        
        processed_sentences = []
        for i, part in enumerate(sentences):
            if i % 2 == 0 and part:  # Actual sentence (not delimiter)
                # Capitalize first letter
                part = part[0].upper() + part[1:] if len(part) > 1 else part.upper()
                
                # Capitalize 'I'
                part = re.sub(r'\bi\b', 'I', part)
                
                # Capitalize after quotes
                part = re.sub(r'(["\'])\s*([a-z])', lambda m: m.group(1) + ' ' + m.group(2).upper(), part)
            
            processed_sentences.append(part)
        
        return ''.join(processed_sentences)
    
    def _split_paragraphs_with_segments(self, text: str, segments: List[Dict]) -> str:
        """
        Split text into paragraphs based on segment timing and speaker changes.
        
        Args:
            text: Processed text
            segments: List of segments with start, end, text, and optionally speaker
            
        Returns:
            Text with paragraph breaks
        """
        paragraphs = []
        current_paragraph = []
        last_speaker = None
        last_end_time = 0
        
        for segment in segments:
            segment_text = segment.get('text', '').strip()
            if not segment_text:
                continue
            
            start_time = segment.get('start', 0)
            speaker = segment.get('speaker')
            
            # Calculate pause duration
            pause_duration = start_time - last_end_time
            
            # Start new paragraph if:
            # 1. Speaker changed
            # 2. Long pause detected
            # 3. Current paragraph is getting too long
            should_break = (
                (speaker and speaker != last_speaker) or
                (pause_duration > self.long_pause_threshold) or
                (len(current_paragraph) > 5)  # Max ~5 segments per paragraph
            )
            
            if should_break and current_paragraph:
                paragraphs.append(' '.join(current_paragraph))
                current_paragraph = []
            
            current_paragraph.append(segment_text)
            last_speaker = speaker
            last_end_time = segment.get('end', start_time)
        
        # Add remaining paragraph
        if current_paragraph:
            paragraphs.append(' '.join(current_paragraph))
        
        return '\n\n'.join(paragraphs)
    
    def _split_paragraphs_simple(self, text: str) -> str:
        """
        Simple paragraph splitting based on sentence count.
        Used when segment information is not available.
        """
        sentences = re.split(r'([.!?]\s+)', text)
        
        paragraphs = []
        current_paragraph = []
        sentence_count = 0
        
        for i, part in enumerate(sentences):
            current_paragraph.append(part)
            
            if i % 2 == 1:  # Delimiter
                sentence_count += 1
                
                # Create paragraph every 3-5 sentences
                if sentence_count >= 4:
                    paragraphs.append(''.join(current_paragraph).strip())
                    current_paragraph = []
                    sentence_count = 0
        
        # Add remaining content
        if current_paragraph:
            paragraphs.append(''.join(current_paragraph).strip())
        
        return '\n\n'.join(paragraphs)
    
    def _final_cleanup(self, text: str) -> str:
        """Final cleanup and normalization."""
        # Remove multiple consecutive punctuation marks
        text = re.sub(r'([.!?]){2,}', r'\1', text)
        
        # Fix spacing around quotes
        text = re.sub(r'\s+"', ' "', text)
        text = re.sub(r'"\s+', '" ', text)
        
        # Remove extra blank lines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Trim whitespace
        text = text.strip()
        
        return text
    
    def process_segments(self, segments: List[Dict]) -> List[Dict]:
        """
        Process individual segments for better punctuation and capitalization.
        
        Args:
            segments: List of segment dictionaries
            
        Returns:
            Processed segments
        """
        processed_segments = []
        
        for segment in segments:
            processed_segment = segment.copy()
            text = segment.get('text', '')
            
            if text:
                # Clean and capitalize
                text = self._clean_text(text)
                text = text[0].upper() + text[1:] if len(text) > 1 else text.upper()
                
                # Add ending punctuation if missing
                if not re.search(r'[.!?]$', text):
                    if self._is_question(text):
                        text += '?'
                    else:
                        text += '.'
                
                processed_segment['text'] = text
            
            processed_segments.append(processed_segment)
        
        return processed_segments


def apply_postprocessing(text: str, segments: Optional[List[Dict]] = None) -> Dict:
    """
    Convenience function to apply text post-processing.
    
    Args:
        text: Raw transcribed text
        segments: Optional list of segments
        
    Returns:
        Dictionary with processed text and segments
    """
    processor = TextPostProcessor()
    
    processed_text = processor.process_text(text, segments)
    processed_segments = processor.process_segments(segments) if segments else None
    
    return {
        'text': processed_text,
        'segments': processed_segments
    }


# Advanced: Integration with ML-based punctuation models
def apply_ml_punctuation(text: str) -> str:
    """
    Apply ML-based punctuation restoration.
    Requires: pip install deepmultilingualpunctuation
    
    This is more accurate than rule-based approaches.
    """
    try:
        from deepmultilingualpunctuation import PunctuationModel
        
        model = PunctuationModel()
        result = model.restore_punctuation(text)
        
        return result
    except ImportError:
        logger.warning("deepmultilingualpunctuation not installed, using rule-based approach")
        processor = TextPostProcessor()
        return processor.process_text(text)
    except Exception as e:
        logger.error(f"Error in ML punctuation: {e}")
        processor = TextPostProcessor()
        return processor.process_text(text)
