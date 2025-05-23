# Services package initialization
import logging

logger = logging.getLogger(__name__)

# Try to import LLM-related services
# These might fail if dependencies are not properly installed
try:
    from .llm_service import generate_test, evaluate_test
    LLM_AVAILABLE = True
except ImportError as e:
    logger.warning(f"LLM services not available: {str(e)}")
    # Create dummy functions
    def generate_test(*args, **kwargs):
        raise NotImplementedError("LLM service is not available due to missing dependencies")
    
    def evaluate_test(*args, **kwargs):
        raise NotImplementedError("LLM service is not available due to missing dependencies")
    
    LLM_AVAILABLE = False

# Export all services
__all__ = [
    'generate_test', 
    'evaluate_test', 
    'LLM_AVAILABLE'
]
