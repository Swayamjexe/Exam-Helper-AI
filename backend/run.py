import os
import logging
from dotenv import load_dotenv
from app import create_app, db
from app.models.user import User
from app.models.test import Test, Question, TestAttempt, StudentAnswer
from app.utils.startup import rebuild_vectors_for_all_materials

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Create app with specified configuration
app = create_app(os.getenv('FLASK_CONFIG') or 'default')

# Initialize vector database on startup if on Render platform
with app.app_context():
    if os.environ.get("RENDER", "false").lower() == "true":
        logger.info("Running on Render platform, rebuilding vector database...")
        rebuild_vectors_for_all_materials(db.session)


@app.shell_context_processor
def make_shell_context():
    """Make objects available in the shell without imports."""
    return {
        'db': db,
        'User': User,
        'Test': Test,
        'Question': Question,
        'TestAttempt': TestAttempt,
        'StudentAnswer': StudentAnswer
    }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
