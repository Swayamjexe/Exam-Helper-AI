import os
import logging
from app import create_app, db
from app.models.user import User
from app.models.material import Material
from app.models.test import Test, Question, QuestionChoice, TestAttempt, StudentAnswer

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    app = create_app('development')

    with app.app_context():
        logger.info("Dropping all tables...")
        db.drop_all()
        
        logger.info("Creating all tables...")
        db.create_all()
        
        logger.info("Creating test user...")
        test_user = User(
            username='testuser',
            email='test@example.com'
        )
        test_user.password = 'password123'
        
        db.session.add(test_user)
        db.session.commit()
        
        logger.info(f"Created test user: username=testuser, email=test@example.com, password=password123")
        
        # Create upload folder if it doesn't exist
        upload_folder = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            logger.info(f"Created upload folder: {upload_folder}")
        
        logger.info("Database tables created successfully!")
        logger.info("You can now run the Flask application.")
        
except Exception as e:
    logger.error(f"Error initializing database: {str(e)}")
    raise 