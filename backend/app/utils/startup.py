import os
import logging
from app.services.material_service import MaterialService
from app.services.vector_service import VectorService
from app.services.text_processor import TextProcessor

logger = logging.getLogger(__name__)

def rebuild_vectors_for_all_materials(db_session):
    """
    Rebuild the vector database for all materials on startup.
    This is used when running on platforms like Render where persistence isn't available.
    
    Args:
        db_session: SQLAlchemy database session
    """
    if os.environ.get("RENDER", "false").lower() != "true":
        logger.info("Not running on Render, skipping vector rebuild")
        return False
        
    try:
        logger.info("Starting vector database rebuild process...")
        
        # Initialize required services
        vector_service = VectorService()
        text_processor = TextProcessor()
        material_service = MaterialService(db_session, vector_service, text_processor)
        
        # Get all materials from all users
        from app.models.material import Material
        materials = db_session.query(Material).all()
        logger.info(f"Found {len(materials)} materials to process")
        
        success_count = 0
        failure_count = 0
        
        # Process each material
        for material in materials:
            try:
                logger.info(f"Processing material {material.id}: {material.title}")
                result = material_service.process_material_for_vectors(material)
                if result:
                    success_count += 1
                else:
                    failure_count += 1
                    logger.error(f"Failed to process material {material.id}")
            except Exception as e:
                failure_count += 1
                logger.error(f"Error processing material {material.id}: {str(e)}")
        
        logger.info(f"Vector database rebuild complete. Success: {success_count}, Failures: {failure_count}")
        return True
        
    except Exception as e:
        logger.error(f"Error during vector database rebuild: {str(e)}")
        return False 