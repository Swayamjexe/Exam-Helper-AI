from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Float, Enum
from sqlalchemy.orm import relationship
from .. import db
import enum

class TestType(enum.Enum):
    mcq = "mcq"
    short_answer = "short_answer"
    long_answer = "long_answer"
    mixed = "mixed"

class QuestionType(enum.Enum):
    mcq = "mcq"
    short_answer = "short_answer"
    long_answer = "long_answer"

class Test(db.Model):
    __tablename__ = 'tests'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    test_type = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    settings = Column(JSON, nullable=True)  # Store any test-specific settings
    total_questions = Column(Integer, default=0)
    time_limit_minutes = Column(Integer, nullable=True)  # Optional time limit
    
    # Relationships
    user = relationship("User", back_populates="tests")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Test {self.title}>"

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True)
    test_id = Column(Integer, ForeignKey('tests.id'), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), nullable=False)  # mcq, short_answer, long_answer
    difficulty = Column(String(20), nullable=True)  # easy, medium, hard
    points = Column(Integer, default=1)
    explanation = Column(Text, nullable=True)  # Explanation for the correct answer
    question_metadata = Column(JSON, nullable=True)  # Additional metadata like source material reference
    
    # Relationships
    test = relationship("Test", back_populates="questions")
    choices = relationship("QuestionChoice", back_populates="question", cascade="all, delete-orphan")
    answers = relationship("StudentAnswer", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Question {self.id} for Test {self.test_id}>"

class QuestionChoice(db.Model):
    __tablename__ = 'question_choices'
    
    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False)
    choice_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    
    # Relationship
    question = relationship("Question", back_populates="choices")
    
    def __repr__(self):
        return f"<Choice {self.id} for Question {self.question_id}>"

class TestAttempt(db.Model):
    __tablename__ = 'test_attempts'
    
    id = Column(Integer, primary_key=True)
    test_id = Column(Integer, ForeignKey('tests.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    
    # Relationships
    test = relationship("Test", back_populates="attempts")
    user = relationship("User", back_populates="test_attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<TestAttempt {self.id} by User {self.user_id}>"

class StudentAnswer(db.Model):
    __tablename__ = 'student_answers'
    
    id = Column(Integer, primary_key=True)
    attempt_id = Column(Integer, ForeignKey('test_attempts.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False)
    answer_text = Column(Text, nullable=True)  # For short/long answers
    selected_choice_id = Column(Integer, ForeignKey('question_choices.id'), nullable=True)  # For MCQ
    is_correct = Column(Boolean, nullable=True)  # May be NULL for essays requiring manual grading
    points_awarded = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    
    # Relationships
    attempt = relationship("TestAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    selected_choice = relationship("QuestionChoice", foreign_keys=[selected_choice_id])
    
    def __repr__(self):
        return f"<Answer {self.id} for Question {self.question_id}>" 