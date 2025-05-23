import os
import uuid
import chromadb
from sentence_transformers import SentenceTransformer

class VectorService:
    def __init__(self):
        # Check if running on Render platform and use in-memory storage
        is_render = os.environ.get("RENDER", "false").lower() == "true"
        persist_directory = os.environ.get("CHROMA_DB_PATH", os.environ.get("CHROMA_PERSIST_DIR", "chroma_db"))
        
        try:
            if is_render:
                # Use in-memory storage on Render to avoid persistence issues
                print("Running on Render platform. Using in-memory ChromaDB.")
                self.client = chromadb.Client()
            else:
                # Use persistent storage for local development
                print(f"Using persistent ChromaDB at {persist_directory}")
                self.client = chromadb.PersistentClient(path=persist_directory)
        except Exception as e:
            print(f"Error initializing ChromaDB client: {str(e)}")
            # Create a directory if it doesn't exist and we're not on Render
            if not is_render:
                os.makedirs(persist_directory, exist_ok=True)
                # Try again with persistent storage
                self.client = chromadb.PersistentClient(path=persist_directory)
            else:
                # Fall back to in-memory for Render
                self.client = chromadb.Client()
        
        # Initialize sentence transformer model
        try:
            self.model_name = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            self.model = SentenceTransformer(self.model_name)
        except Exception as e:
            print(f"Error loading model {self.model_name}: {str(e)}")
            # Try a different model as fallback
            self.model_name = "all-MiniLM-L6-v2"  # Default fallback
            self.model = SentenceTransformer(self.model_name)
        
        self.collections = {}
    
    def ensure_collection(self, collection_name):
        """Get or create a collection"""
        try:
            if collection_name not in self.collections:
                self.collections[collection_name] = self.client.get_or_create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            return self.collections[collection_name]
        except Exception as e:
            print(f"Error creating collection {collection_name}: {str(e)}")
            # Try a simple name without special characters as fallback
            safe_name = "".join(c for c in collection_name if c.isalnum())
            if not safe_name:
                safe_name = "default_collection"
            print(f"Trying with safe name: {safe_name}")
            self.collections[collection_name] = self.client.get_or_create_collection(
                name=safe_name,
                metadata={"hnsw:space": "cosine"}
            )
            return self.collections[collection_name]
    
    def store_document(self, collection_name, texts, metadatas=None, ids=None):
        """
        Store a document's chunks in the vector database
        
        Args:
            collection_name: Name of the collection to store in
            texts: List of text chunks
            metadatas: List of metadata dictionaries for each chunk
            ids: List of IDs for each chunk
            
        Returns:
            Success status boolean
        """
        try:
            # Validate inputs
            if not texts:
                print("Error: No texts provided for embedding")
                return False
                
            # Generate IDs if not provided
            if not ids:
                ids = [str(uuid.uuid4()) for _ in range(len(texts))]
            elif len(ids) != len(texts):
                print(f"Error: Number of IDs ({len(ids)}) does not match number of texts ({len(texts)})")
                # Generate missing IDs if needed
                if len(ids) < len(texts):
                    ids.extend([str(uuid.uuid4()) for _ in range(len(texts) - len(ids))])
                else:
                    ids = ids[:len(texts)]
            
            # Handle metadata
            if not metadatas:
                metadatas = [{} for _ in range(len(texts))]
            elif len(metadatas) != len(texts):
                print(f"Error: Number of metadata objects ({len(metadatas)}) does not match number of texts ({len(texts)})")
                # Generate missing metadata if needed
                if len(metadatas) < len(texts):
                    metadatas.extend([{} for _ in range(len(texts) - len(metadatas))])
                else:
                    metadatas = metadatas[:len(texts)]
            
            # Clean metadata to ensure it contains only valid types
            safe_metadatas = []
            for meta in metadatas:
                safe_meta = {}
                for key, value in meta.items():
                    # Convert all values to strings to avoid type issues
                    if value is not None:
                        safe_meta[key] = str(value)
                    else:
                        safe_meta[key] = ""
                safe_metadatas.append(safe_meta)
            
            # Ensure texts are strings
            clean_texts = []
            for text in texts:
                if not isinstance(text, str):
                    text = str(text)
                clean_texts.append(text.strip())
            
            # Filter out empty texts
            valid_indices = [i for i, text in enumerate(clean_texts) if text]
            if not valid_indices:
                print("Warning: All texts are empty after cleaning")
                return False
                
            filtered_texts = [clean_texts[i] for i in valid_indices]
            filtered_ids = [ids[i] for i in valid_indices]
            filtered_metadatas = [safe_metadatas[i] for i in valid_indices]
            
            # Get embeddings for all texts
            embeddings = self.model.encode(filtered_texts)
            
            # Get collection
            collection = self.ensure_collection(collection_name)
            
            # Add to collection
            collection.add(
                ids=filtered_ids,
                embeddings=[embedding.tolist() for embedding in embeddings],
                documents=filtered_texts,
                metadatas=filtered_metadatas
            )
            
            return True
        except Exception as e:
            print(f"Error storing document in vector database: {str(e)}")
            return False
    
    def add_text(self, collection_name, text, metadata=None):
        """Add text to vector database"""
        try:
            # Create a unique ID for this embedding
            embedding_id = str(uuid.uuid4())
            
            # Ensure text is a string
            if not isinstance(text, str):
                print(f"Warning: Converting non-string text to string: {text}")
                text = str(text)
            
            # Clean text to ensure it works with the model
            text = text.strip()
            if not text:
                print("Warning: Empty text, skipping embedding creation")
                return None
                
            # Clean metadata to ensure it contains only valid types
            safe_metadata = {}
            if metadata:
                for key, value in metadata.items():
                    # Convert all values to strings to avoid type issues
                    if value is not None:
                        safe_metadata[key] = str(value)
                    else:
                        safe_metadata[key] = ""
            
            # Get embeddings
            embedding = self.model.encode(text)
            
            # Get collection
            collection = self.ensure_collection(collection_name)
            
            # Add to collection
            collection.add(
                ids=[embedding_id],
                embeddings=[embedding.tolist()],
                documents=[text],
                metadatas=[safe_metadata]
            )
            
            return embedding_id
        except Exception as e:
            print(f"Error adding text to vector database: {str(e)}")
            return None
    
    def search(self, collection_name, query, n_results=5, filter_criteria=None):
        """Search for similar texts"""
        try:
            # Ensure query is a string
            if not isinstance(query, str):
                query = str(query)
                
            # Get collection
            collection = self.ensure_collection(collection_name)
            
            # Get query embedding
            query_embedding = self.model.encode(query)
            
            # Clean filter criteria to ensure it contains only valid types
            safe_filter = None
            if filter_criteria:
                safe_filter = {}
                for key, value in filter_criteria.items():
                    # Convert all values to strings to avoid type issues
                    if value is not None:
                        safe_filter[key] = str(value)
            
            # Search
            results = collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=n_results,
                where=safe_filter
            )
            
            return results
        except Exception as e:
            print(f"Error searching vector database: {str(e)}")
            return {"ids": [], "distances": [], "metadata": [], "documents": []}
    
    def delete_collection(self, collection_name):
        """Delete a collection"""
        try:
            self.client.delete_collection(name=collection_name)
            if collection_name in self.collections:
                del self.collections[collection_name]
            return True
        except Exception as e:
            print(f"Error deleting collection {collection_name}: {str(e)}")
            return False
    
    def delete_document_embeddings(self, collection_name, document_id):
        """Delete all embeddings for a document"""
        try:
            collection = self.ensure_collection(collection_name)
            
            # Delete by metadata filter
            collection.delete(
                where={"document_id": str(document_id)}
            )
            return True
        except Exception as e:
            print(f"Error deleting embeddings for document {document_id}: {str(e)}")
            return False 