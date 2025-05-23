import re
import nltk
from nltk.tokenize import sent_tokenize

class TextProcessor:
    def __init__(self):
        # Download NLTK data if not already downloaded
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
    
    def chunk_text(self, text, metadata=None, max_chunk_size=1000, overlap=200):
        """
        Chunk text into smaller segments for embedding
        
        Simplified version that focuses only on semantic chunking
        
        Args:
            text: The document text
            metadata: Optional metadata (not used in simplified version)
            max_chunk_size: Maximum characters per chunk
            overlap: Number of characters to overlap between chunks
            
        Returns:
            List of chunk dictionaries with text
        """
        # Always use semantic chunking in simplified version
        return self._chunk_by_semantic(text, max_chunk_size, overlap)
    
    def _chunk_by_semantic(self, text, max_chunk_size, overlap):
        """
        Chunk text semantically by trying to preserve sentence boundaries
        """
        chunks = []
        
        # Split text into sentences
        sentences = sent_tokenize(text)
        
        current_chunk = []
        current_chunk_size = 0
        
        for sentence in sentences:
            sentence_len = len(sentence)
            
            # If a single sentence exceeds max size, split it
            if sentence_len > max_chunk_size:
                # Process current chunk if not empty
                if current_chunk:
                    chunks.append({
                        "text": " ".join(current_chunk)
                    })
                    current_chunk = []
                    current_chunk_size = 0
                
                # Split long sentence into words and create chunks
                words = sentence.split()
                temp_chunk = []
                temp_size = 0
                
                for word in words:
                    word_len = len(word) + 1  # +1 for space
                    
                    if temp_size + word_len > max_chunk_size:
                        if temp_chunk:
                            chunks.append({
                                "text": " ".join(temp_chunk)
                            })
                        temp_chunk = [word]
                        temp_size = word_len
                    else:
                        temp_chunk.append(word)
                        temp_size += word_len
                
                if temp_chunk:
                    chunks.append({
                        "text": " ".join(temp_chunk)
                    })
            
            # Normal case: try to add sentence to current chunk
            elif current_chunk_size + sentence_len + 1 <= max_chunk_size:
                current_chunk.append(sentence)
                current_chunk_size += sentence_len + 1  # +1 for space
            else:
                # Finish current chunk and start a new one
                if current_chunk:
                    chunks.append({
                        "text": " ".join(current_chunk)
                    })
                
                current_chunk = [sentence]
                current_chunk_size = sentence_len
        
        # Add the last chunk if not empty
        if current_chunk:
            chunks.append({
                "text": " ".join(current_chunk)
            })
        
        return chunks
    
    def extract_key_information(self, text):
        """
        Extract potentially useful information from text
        such as topics, entities, etc.
        """
        # Simple topic extraction based on frequency
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        word_freq = {}
        
        for word in words:
            if word in word_freq:
                word_freq[word] += 1
            else:
                word_freq[word] = 1
        
        # Filter common words and sort by frequency
        common_words = {'the', 'and', 'for', 'that', 'this', 'with', 'are', 'from'}
        topics = [word for word, freq in 
                 sorted(word_freq.items(), key=lambda x: x[1], reverse=True) 
                 if word not in common_words][:10]
        
        return {
            "potential_topics": topics
        } 