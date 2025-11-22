import logging
from typing import List, Dict, Optional, Tuple
import re

logger = logging.getLogger(__name__)


class SummaryKeywordExtractor:
    """
    Extracts summaries and keywords from transcribed text using small language models.
    Uses BART/T5 for summarization and KeyBERT/RAKE for keyword extraction.
    """
    
    def __init__(self, summarization_model: str = "facebook/bart-large-cnn"):
        """
        Initialize the extractor with specified models.
        
        Args:
            summarization_model: HuggingFace model name for summarization
        """
        self.summarization_model_name = summarization_model
        self.summarizer = None
        self.keyword_extractor = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Lazy load models to save memory."""
        pass  # Models loaded on first use
    
    def _load_summarization_model(self):
        """Load the summarization model."""
        if self.summarizer is not None:
            return
        
        try:
            from transformers import pipeline
            
            logger.info(f"Loading summarization model: {self.summarization_model_name}")
            self.summarizer = pipeline(
                "summarization",
                model=self.summarization_model_name,
                device=-1  # CPU, use 0 for GPU
            )
            logger.info("Summarization model loaded successfully")
        except ImportError:
            logger.error("transformers library not installed. Install with: pip install transformers")
            raise
        except Exception as e:
            logger.error(f"Error loading summarization model: {e}")
            raise
    
    def _load_keyword_extractor(self):
        """Load the keyword extraction model."""
        if self.keyword_extractor is not None:
            return
        
        try:
            from keybert import KeyBERT
            
            logger.info("Loading keyword extraction model")
            self.keyword_extractor = KeyBERT()
            logger.info("Keyword extraction model loaded successfully")
        except ImportError:
            logger.warning("keybert not installed, will use fallback RAKE method")
            self.keyword_extractor = "rake"  # Fallback
        except Exception as e:
            logger.error(f"Error loading keyword extractor: {e}")
            self.keyword_extractor = "rake"
    
    def generate_summary(
        self,
        text: str,
        max_length: int = 150,
        min_length: int = 50,
        summary_type: str = "auto"
    ) -> Dict[str, str]:
        """
        Generate a summary of the text.
        
        Args:
            text: Input text to summarize
            max_length: Maximum length of summary in tokens
            min_length: Minimum length of summary in tokens
            summary_type: Type of summary - "short", "medium", "long", or "auto"
            
        Returns:
            Dictionary with summary and metadata
        """
        if not text or len(text.strip()) < 100:
            return {
                "summary": text,
                "type": "original",
                "message": "Text too short to summarize"
            }
        
        # Adjust lengths based on summary type
        if summary_type == "short":
            max_length = 100
            min_length = 30
        elif summary_type == "medium":
            max_length = 200
            min_length = 75
        elif summary_type == "long":
            max_length = 400
            min_length = 150
        elif summary_type == "auto":
            # Auto-adjust based on input length
            word_count = len(text.split())
            if word_count < 200:
                max_length = 80
                min_length = 30
            elif word_count < 500:
                max_length = 150
                min_length = 50
            else:
                max_length = 250
                min_length = 100
        
        try:
            self._load_summarization_model()
            
            # Split long texts into chunks if needed
            chunks = self._split_text_for_summarization(text, max_chunk_size=1024)
            
            if len(chunks) == 1:
                # Single chunk - direct summarization
                summary = self.summarizer(
                    text,
                    max_length=max_length,
                    min_length=min_length,
                    do_sample=False
                )[0]['summary_text']
            else:
                # Multiple chunks - summarize each then combine
                chunk_summaries = []
                for chunk in chunks:
                    chunk_summary = self.summarizer(
                        chunk,
                        max_length=max_length // len(chunks),
                        min_length=min_length // len(chunks),
                        do_sample=False
                    )[0]['summary_text']
                    chunk_summaries.append(chunk_summary)
                
                # Combine and re-summarize if needed
                combined = " ".join(chunk_summaries)
                if len(combined.split()) > max_length:
                    summary = self.summarizer(
                        combined,
                        max_length=max_length,
                        min_length=min_length,
                        do_sample=False
                    )[0]['summary_text']
                else:
                    summary = combined
            
            return {
                "summary": summary,
                "type": summary_type,
                "word_count": len(summary.split()),
                "compression_ratio": round(len(text.split()) / len(summary.split()), 2)
            }
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            # Fallback to extractive summary
            return self._extractive_summary(text, max_length)
    
    def extract_keywords(
        self,
        text: str,
        num_keywords: int = 10,
        use_phrases: bool = True
    ) -> List[Dict[str, any]]:
        """
        Extract keywords from text.
        
        Args:
            text: Input text
            num_keywords: Number of keywords to extract
            use_phrases: Whether to extract phrases (2-3 words) or single words
            
        Returns:
            List of keyword dictionaries with scores
        """
        if not text or len(text.strip()) < 50:
            return []
        
        try:
            self._load_keyword_extractor()
            
            if self.keyword_extractor == "rake":
                # Fallback to RAKE
                return self._extract_keywords_rake(text, num_keywords)
            
            # Use KeyBERT
            keyphrase_ngram_range = (1, 3) if use_phrases else (1, 1)
            
            keywords = self.keyword_extractor.extract_keywords(
                text,
                keyphrase_ngram_range=keyphrase_ngram_range,
                stop_words='english',
                top_n=num_keywords,
                use_maxsum=True,
                nr_candidates=20
            )
            
            # Format results
            return [
                {
                    "keyword": kw[0],
                    "score": round(kw[1], 3),
                    "rank": i + 1
                }
                for i, kw in enumerate(keywords)
            ]
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return self._extract_keywords_rake(text, num_keywords)
    
    def generate_bullet_points(self, text: str, num_points: int = 5) -> List[str]:
        """
        Generate bullet point summary of key points.
        
        Args:
            text: Input text
            num_points: Number of bullet points to generate
            
        Returns:
            List of bullet point strings
        """
        # Split text into sentences
        sentences = self._split_into_sentences(text)
        
        if len(sentences) <= num_points:
            return sentences
        
        # Use extractive approach - select most important sentences
        important_sentences = self._select_important_sentences(sentences, num_points)
        
        return important_sentences
    
    def analyze_text(self, text: str, segments: Optional[List[Dict]] = None) -> Dict:
        """
        Comprehensive text analysis including summary, keywords, and insights.
        
        Args:
            text: Input text
            segments: Optional segments for additional analysis
            
        Returns:
            Dictionary with all analysis results
        """
        logger.info("Starting comprehensive text analysis")
        
        analysis = {
            "word_count": len(text.split()),
            "character_count": len(text),
            "sentence_count": len(self._split_into_sentences(text))
        }
        
        # Generate summary
        try:
            summary_result = self.generate_summary(text, summary_type="auto")
            analysis["summary"] = summary_result
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            analysis["summary"] = {"error": str(e)}
        
        # Extract keywords
        try:
            keywords = self.extract_keywords(text, num_keywords=10)
            analysis["keywords"] = keywords
        except Exception as e:
            logger.error(f"Keyword extraction failed: {e}")
            analysis["keywords"] = []
        
        # Generate bullet points
        try:
            bullet_points = self.generate_bullet_points(text, num_points=5)
            analysis["key_points"] = bullet_points
        except Exception as e:
            logger.error(f"Bullet point generation failed: {e}")
            analysis["key_points"] = []
        
        # Add segment-based insights if available
        if segments:
            analysis["segment_insights"] = self._analyze_segments(segments)
        
        logger.info("Text analysis complete")
        return analysis
    
    # Helper methods
    
    def _split_text_for_summarization(self, text: str, max_chunk_size: int = 1024) -> List[str]:
        """Split text into chunks for processing."""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_chunk.append(word)
            current_size += len(word) + 1
            
            if current_size >= max_chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_size = 0
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _extractive_summary(self, text: str, max_length: int) -> Dict:
        """Fallback extractive summarization."""
        sentences = self._split_into_sentences(text)
        
        # Calculate target number of sentences
        target_sentences = max(1, min(len(sentences), max_length // 20))
        
        # Select sentences (simple: take first and last, and evenly distributed)
        if len(sentences) <= target_sentences:
            summary = " ".join(sentences)
        else:
            indices = [0]  # First sentence
            step = len(sentences) // (target_sentences - 1)
            for i in range(1, target_sentences - 1):
                indices.append(i * step)
            indices.append(len(sentences) - 1)  # Last sentence
            
            summary = " ".join([sentences[i] for i in sorted(set(indices))])
        
        return {
            "summary": summary,
            "type": "extractive",
            "word_count": len(summary.split())
        }
    
    def _select_important_sentences(self, sentences: List[str], num_sentences: int) -> List[str]:
        """Select most important sentences using simple heuristics."""
        # Score sentences based on length and position
        scored_sentences = []
        
        for i, sentence in enumerate(sentences):
            score = 0
            
            # Position score (first and last sentences are important)
            if i == 0 or i == len(sentences) - 1:
                score += 2
            
            # Length score (prefer medium-length sentences)
            word_count = len(sentence.split())
            if 10 <= word_count <= 30:
                score += 1
            
            # Question score
            if '?' in sentence:
                score += 1
            
            scored_sentences.append((score, i, sentence))
        
        # Sort by score and select top sentences
        scored_sentences.sort(reverse=True)
        selected = scored_sentences[:num_sentences]
        
        # Sort by original order
        selected.sort(key=lambda x: x[1])
        
        return [s[2] for s in selected]
    
    def _extract_keywords_rake(self, text: str, num_keywords: int) -> List[Dict]:
        """Fallback keyword extraction using RAKE algorithm."""
        try:
            from rake_nltk import Rake
            
            rake = Rake()
            rake.extract_keywords_from_text(text)
            keywords = rake.get_ranked_phrases_with_scores()
            
            return [
                {
                    "keyword": kw[1],
                    "score": round(kw[0], 3),
                    "rank": i + 1
                }
                for i, kw in enumerate(keywords[:num_keywords])
            ]
        except ImportError:
            logger.warning("rake_nltk not installed, using simple frequency-based extraction")
            return self._extract_keywords_frequency(text, num_keywords)
    
    def _extract_keywords_frequency(self, text: str, num_keywords: int) -> List[Dict]:
        """Simple frequency-based keyword extraction."""
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
                     'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                     'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
                     'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        
        # Tokenize and count
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        word_freq = {}
        
        for word in words:
            if word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        return [
            {
                "keyword": word,
                "score": freq,
                "rank": i + 1
            }
            for i, (word, freq) in enumerate(sorted_words[:num_keywords])
        ]
    
    def _analyze_segments(self, segments: List[Dict]) -> Dict:
        """Analyze segments for additional insights."""
        total_duration = 0
        speakers = set()
        
        for segment in segments:
            if 'start' in segment and 'end' in segment:
                total_duration += segment['end'] - segment['start']
            
            if 'speaker' in segment and segment['speaker']:
                speakers.add(segment['speaker'])
        
        return {
            "total_duration": round(total_duration, 2),
            "num_speakers": len(speakers),
            "speakers": sorted(list(speakers)),
            "avg_segment_duration": round(total_duration / len(segments), 2) if segments else 0
        }


# Convenience functions

def generate_summary(text: str, **kwargs) -> str:
    """Generate a summary of the text."""
    extractor = SummaryKeywordExtractor()
    result = extractor.generate_summary(text, **kwargs)
    return result.get("summary", text)


def extract_keywords(text: str, num_keywords: int = 10) -> List[str]:
    """Extract keywords from text."""
    extractor = SummaryKeywordExtractor()
    keywords = extractor.extract_keywords(text, num_keywords=num_keywords)
    return [kw["keyword"] for kw in keywords]


def analyze_transcription(text: str, segments: Optional[List[Dict]] = None) -> Dict:
    """Comprehensive analysis of transcription."""
    extractor = SummaryKeywordExtractor()
    return extractor.analyze_text(text, segments)
