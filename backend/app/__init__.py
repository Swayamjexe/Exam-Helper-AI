from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

import sys
import os
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_app(config_name='default'):
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Additional JWT configurations to ensure proper token validation
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ERROR_MESSAGE_KEY'] = 'message'
    
    # Document upload configurations
    app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')
    app.config['ALLOWED_EXTENSIONS'] = ['pdf', 'txt', 'docx']
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max upload
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    
    # Register blueprints
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Register materials routes
    from .routes.materials import materials_bp
    app.register_blueprint(materials_bp)  # URL prefix is already set in the blueprint
    logger.info("Materials API registered at /api/materials")
    
    # Register tests routes
    from .routes.tests import tests_bp
    app.register_blueprint(tests_bp)  # URL prefix is already set in the blueprint
    logger.info("Tests API registered at /api/tests")
    
    # Add a simple health check route
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'version': '1.0', 'phase': '2'}, 200
    
    return app
