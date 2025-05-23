from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from .. import db


class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, index=True)
    email = Column(String(120), unique=True, index=True)
    password_hash = Column(String(128))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tests = relationship('Test', back_populates='user', cascade='all, delete-orphan')
    test_attempts = relationship('TestAttempt', back_populates='user', cascade='all, delete-orphan')
    materials = relationship('Material', back_populates='user', cascade='all, delete-orphan')
    
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        } 