import os
from datetime import timedelta

# Get the base directory
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'my-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'my-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max file size

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'dev.db')


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'test.db')


class ProductionConfig(Config):
    """Production configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 