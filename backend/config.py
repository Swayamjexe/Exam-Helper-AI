import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # LLM API Configuration (Together AI)
    LLM_API_KEY = os.environ.get('TOGETHER_API_KEY')
    LLM_MODEL = os.environ.get('LLM_MODEL') or 'mistralai/Mixtral-8x7B-Instruct-v0.1'
    
    @staticmethod
    def init_app(app):
        # Any application initialization code goes here
        pass


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


class ProductionConfig(Config):
    # Production specific settings
    DEBUG = False
    # Use more secure secrets in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI')


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
