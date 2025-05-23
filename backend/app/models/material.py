from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from .. import db

class Material(db.Model):
    __tablename__ = 'materials'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    content_text = Column(Text, nullable=True)
    material_type = Column(String(64), nullable=True)
    file_type = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    author = Column(String(128), nullable=True)
    publication_date = Column(String(64), nullable=True)
    page_count = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=True)
    chapters = Column(Text, nullable=True)
    topics = Column(Text, nullable=True)
    chroma_collection_id = Column(String(64), nullable=True)
    embedding_status = Column(String(32), nullable=True, default="pending")
    chunk_count = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationship with user
    user = relationship("User", back_populates="materials")
    
    def __repr__(self):
        return f"<Material {self.title}>" 