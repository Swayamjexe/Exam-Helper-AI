from celery import Celery
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.document_service import DocumentService
from app.services.vector_service import VectorService
from app.services.text_processor import TextProcessor
from app.models.database import Base

# Configure Celery
broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

celery = Celery('tasks', broker=broker_url, backend=result_backend)

# Configure SQLAlchemy session
database_url = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')
engine = create_engine(database_url)
SessionFactory = sessionmaker(bind=engine)
Session = scoped_session(SessionFactory)

@celery.task
def process_document_task(doc_id):
    """Process document asynchronously"""
    # Get database session
    db = Session()
    
    # Initialize services
    vector_service = VectorService()
    text_processor = TextProcessor()
    document_service = DocumentService(db, vector_service, text_processor)
    
    try:
        # Process document
        document_service.process_document(doc_id)
        return {'status': 'success', 'document_id': doc_id}
    except Exception as e:
        # Log error
        print(f"Error processing document {doc_id}: {str(e)}")
        return {'status': 'error', 'document_id': doc_id, 'error': str(e)}
    finally:
        # Close session
        db.close() 