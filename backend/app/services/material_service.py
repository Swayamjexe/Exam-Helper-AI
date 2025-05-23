import os
import uuid
import PyPDF2
from werkzeug.utils import secure_filename
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.material import Material

class MaterialService:
    def __init__(self, db: Session, vector_service=None, text_processor=None):
        self.db = db
        self.vector_service = vector_service
        self.text_processor = text_processor
        self.upload_folder = os.environ.get("UPLOAD_FOLDER", "uploads")
        
        # Ensure upload directory exists
        os.makedirs(self.upload_folder, exist_ok=True)
    
    def upload_material(self, file, user_id, title=None, description=None, material_type=None):
        """
        Upload and process a material
        """
        # Generate secure filename
        original_filename = secure_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1].lower()
        
        # Define storage path
        user_folder = os.path.join(self.upload_folder, str(user_id))
        os.makedirs(user_folder, exist_ok=True)
        file_path = os.path.join(user_folder, original_filename)
        
        # Save the file
        file.save(file_path)
        
        # Create material record
        material = Material(
            user_id=int(user_id),
            title=title or os.path.splitext(original_filename)[0],
            description=description or "",
            file_path=file_path,
            material_type=material_type or "notes",
            file_type=file_extension[1:] if file_extension else "",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            embedding_status="processing"
        )
        
        self.db.add(material)
        self.db.commit()
        
        # Process material based on type
        try:
            # Process PDF files
            if file_extension.lower() == '.pdf':
                self._process_pdf(material, file_path)
            # Process other file types here as needed
            
            # Process material for vector embedding
            if self.vector_service and self.text_processor:
                self.process_material_for_vectors(material)
            else:
                material.embedding_status = "pending"
                self.db.commit()
                
            return material
        except Exception as e:
            material.embedding_status = "failed"
            material.error_message = str(e)
            self.db.commit()
            raise e
    
    def _process_pdf(self, material, file_path):
        """Process a PDF file to extract metadata and content"""
        try:
            with open(file_path, "rb") as pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                material.page_count = len(reader.pages)
                
                # Extract metadata
                if reader.metadata:
                    try:
                        if reader.metadata.title:
                            material.title = reader.metadata.title
                        if reader.metadata.author:
                            material.author = reader.metadata.author
                    except Exception as e:
                        print(f"Error extracting PDF metadata: {str(e)}")
                
                # Estimate word count
                if len(reader.pages) > 0:
                    try:
                        text = reader.pages[0].extract_text() or ""
                        words_per_page = len(text.split())
                        material.word_count = words_per_page * len(reader.pages)
                    except Exception as e:
                        print(f"Error counting words: {str(e)}")
        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            raise e
    
    def process_material_for_vectors(self, material):
        """Process a material for vector database storage"""
        if not self.vector_service or not self.text_processor:
            return False
            
        try:
            # Update status to processing
            material.embedding_status = "processing"
            self.db.commit()
            
            # Extract text from file based on file type
            extracted_text = ""
            
            if material.file_type == 'pdf':
                with open(material.file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    for page in reader.pages:
                        extracted_text += page.extract_text() + "\n\n"
                        
            elif material.file_type in ['txt', 'md']:
                with open(material.file_path, 'r', encoding='utf-8') as file:
                    extracted_text = file.read()
                    
            elif material.file_type == 'docx':
                import docx
                doc = docx.Document(material.file_path)
                extracted_text = "\n".join([para.text for para in doc.paragraphs])
            
            else:
                material.embedding_status = "failed"
                material.error_message = f"Unsupported file type for vector processing: {material.file_type}"
                self.db.commit()
                return False
                
            # Skip empty documents
            if not extracted_text.strip():
                material.embedding_status = "failed"
                material.error_message = "No text content could be extracted from the document"
                self.db.commit()
                return False
                
            # Chunk the text
            chunks = self.text_processor.chunk_text(extracted_text)
            
            if not chunks:
                material.embedding_status = "failed"
                material.error_message = "Failed to create text chunks"
                self.db.commit()
                return False
                
            # Create collection ID if not exists
            if not material.chroma_collection_id:
                material.chroma_collection_id = f"material_{material.id}_{uuid.uuid4().hex[:8]}"
            
            # Store in vector DB
            metadata_list = []
            
            for i, chunk in enumerate(chunks):
                metadata = {
                    "material_id": material.id,
                    "chunk_id": i,
                    "title": material.title,
                    "material_type": material.material_type,
                    "author": material.author or "",
                }
                metadata_list.append(metadata)
                
            # Store chunks in vector DB
            result = self.vector_service.store_document(
                collection_name=material.chroma_collection_id,
                texts=[chunk for chunk in chunks],
                metadatas=metadata_list,
                ids=[f"{material.id}_{i}" for i in range(len(chunks))]
            )
            
            # Update material record
            material.chunk_count = len(chunks)
            material.embedding_status = "completed"
            material.updated_at = datetime.utcnow()
            self.db.commit()
            
            return True
            
        except Exception as e:
            material.embedding_status = "failed"
            material.error_message = str(e)
            self.db.commit()
            print(f"Error processing material for vectors: {str(e)}")
            return False
    
    def get_material(self, material_id, user_id=None):
        """Get a material by ID, optionally validate user ownership"""
        query = self.db.query(Material).filter(Material.id == material_id)
        
        if user_id:
            query = query.filter(Material.user_id == int(user_id))
            
        return query.first()
    
    def get_user_materials(self, user_id):
        """Get all materials for a user"""
        return self.db.query(Material).filter(Material.user_id == int(user_id)).order_by(Material.created_at.desc()).all()
    
    def delete_material(self, material_id):
        """Delete a material and its file"""
        material = self.db.query(Material).filter(Material.id == material_id).first()
        
        if not material:
            return False
            
        # Delete the file if it exists
        try:
            if material.file_path and os.path.exists(material.file_path):
                os.remove(material.file_path)
        except Exception as e:
            print(f"Error deleting file {material.file_path}: {str(e)}")
        
        # Delete vector collection if it exists
        try:
            if material.chroma_collection_id and self.vector_service:
                self.vector_service.delete_collection(material.chroma_collection_id)
        except Exception as e:
            print(f"Error deleting vector collection {material.chroma_collection_id}: {str(e)}")
        
        # Delete from database
        self.db.delete(material)
        self.db.commit()
        
        return True 