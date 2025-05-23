import os
import json
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from ..models.test import Test, Question, QuestionChoice, TestAttempt, StudentAnswer
from ..models.material import Material
from .ai_service import AIService

class TestService:
    def __init__(self, db: Session, ai_service=None):
        """Initialize the test service"""
        self.db = db
        self.ai_service = ai_service or AIService()
    
    def create_test(self, user_id: int, title: str, description: str, test_type: str, 
                   material_ids: List[int] = None, settings: Dict[str, Any] = None) -> Test:
        """
        Create a new test with the specified parameters
        
        Args:
            user_id: ID of the user creating the test
            title: Test title
            description: Test description
            test_type: Type of test (mcq, short_answer, long_answer, mixed)
            material_ids: List of material IDs to use for generating questions
            settings: Additional test settings (time limit, difficulty, etc.)
            
        Returns:
            Newly created Test object
        """
        # Create the test record
        test = Test(
            user_id=user_id,
            title=title,
            description=description,
            test_type=test_type,
            settings=settings or {},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Set time limit if provided
        if settings and 'time_limit_minutes' in settings:
            test.time_limit_minutes = settings['time_limit_minutes']
        
        self.db.add(test)
        self.db.commit()
        
        # If material IDs are provided, generate questions from those materials
        if material_ids:
            try:
                self.generate_questions_from_materials(test.id, material_ids, settings)
            except Exception as e:
                print(f"Error generating questions: {str(e)}")
                # Still return the test even if question generation fails
        
        # Refresh the test to include the generated questions
        self.db.refresh(test)
        return test
    
    def generate_questions_from_materials(self, test_id: int, material_ids: List[int], 
                                         settings: Dict[str, Any] = None) -> int:
        """
        Generate questions for a test based on specified materials
        
        Args:
            test_id: ID of the test to generate questions for
            material_ids: List of material IDs to use for generating questions
            settings: Additional settings for question generation
            
        Returns:
            Number of questions generated
        """
        # Get the test
        test = self.db.query(Test).filter(Test.id == test_id).first()
        if not test:
            raise ValueError(f"Test with ID {test_id} not found")
        
        # Default settings
        num_questions = settings.get('num_questions', 5) if settings else 5
        difficulty = settings.get('difficulty', 'medium') if settings else 'medium'
        instructions = settings.get('instructions', '') if settings else ''
        
        # Counter for generated questions
        total_questions = 0
        
        # Process each material
        for material_id in material_ids:
            material = self.db.query(Material).filter(Material.id == material_id).first()
            if not material:
                print(f"Material with ID {material_id} not found, skipping")
                continue
            
            # Extract text content from the material
            material_text = self._extract_material_content(material)
            if not material_text:
                print(f"No text content found for material {material_id}, skipping")
                continue
            
            # Calculate questions per material (at least 1 per material)
            questions_per_material = max(1, num_questions // len(material_ids))
            
            # Generate questions using the AI service
            try:
                questions = self.ai_service.generate_questions(
                    material_text=material_text,
                    test_type=test.test_type,
                    num_questions=questions_per_material,
                    difficulty=difficulty,
                    instructions=instructions
                )
                
                # Save the generated questions
                for q_data in questions:
                    self._save_question(test.id, q_data, material_id)
                    total_questions += 1
                    
            except Exception as e:
                print(f"Error generating questions for material {material_id}: {str(e)}")
                continue
        
        # Update the test's total questions count
        test.total_questions = total_questions
        self.db.commit()
        
        return total_questions
    
    def _extract_material_content(self, material: Material) -> str:
        """Extract text content from a material"""
        # If content is already stored in the material
        if material.content_text:
            return material.content_text
        
        # Otherwise, try to extract from file
        if not material.file_path or not os.path.exists(material.file_path):
            return ""
            
        content = ""
        try:
            # Extract based on file type
            if material.file_type == 'pdf':
                import PyPDF2
                with open(material.file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    for page in reader.pages:
                        content += page.extract_text() + "\n\n"
                        
            elif material.file_type in ['txt', 'md']:
                with open(material.file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    
            elif material.file_type == 'docx':
                import docx
                doc = docx.Document(material.file_path)
                content = "\n".join([para.text for para in doc.paragraphs])
            
        except Exception as e:
            print(f"Error extracting content from material file: {str(e)}")
            
        return content
        
    def _save_question(self, test_id: int, question_data: Dict[str, Any], material_id: Optional[int] = None) -> Question:
        """Save a question and its choices to the database"""
        question_type = question_data.get('question_type', 'mcq')
        
        # Create question record
        question = Question(
            test_id=test_id,
            question_text=question_data.get('question_text', ''),
            question_type=question_type,
            difficulty=question_data.get('difficulty', 'medium'),
            points=question_data.get('points', 1),
            explanation=question_data.get('explanation', ''),
            question_metadata={
                'material_id': material_id,
                'source': 'ai_generated'
            }
        )
        
        # For long-answer questions, store key points in question_metadata
        if question_type == 'long_answer' and 'key_points' in question_data:
            question.question_metadata['key_points'] = question_data['key_points']
            question.question_metadata['evaluation_criteria'] = question_data.get('evaluation_criteria', '')
            
        # For short-answer questions, store correct answer in question_metadata
        if question_type == 'short_answer' and 'correct_answer' in question_data:
            question.question_metadata['correct_answer'] = question_data['correct_answer']
        
        self.db.add(question)
        self.db.flush()  # Get the question ID without committing transaction
        
        # For MCQ questions, add the choices
        if question_type == 'mcq' and 'choices' in question_data:
            for choice_data in question_data['choices']:
                choice = QuestionChoice(
                    question_id=question.id,
                    choice_text=choice_data.get('text', ''),
                    is_correct=choice_data.get('is_correct', False)
                )
                self.db.add(choice)
        
        self.db.commit()
        return question
    
    def get_test(self, test_id: int, user_id: Optional[int] = None) -> Optional[Test]:
        """Get a test by ID, optionally validating user ownership"""
        query = self.db.query(Test).filter(Test.id == test_id)
        
        # If user_id is provided, validate ownership
        if user_id is not None:
            query = query.filter(Test.user_id == user_id)
            
        return query.first()
    
    def get_user_tests(self, user_id: int) -> List[Test]:
        """Get all tests for a user"""
        return self.db.query(Test).filter(Test.user_id == user_id).order_by(Test.created_at.desc()).all()
    
    def delete_test(self, test_id: int) -> bool:
        """Delete a test and all associated questions and attempts"""
        test = self.db.query(Test).filter(Test.id == test_id).first()
        
        if not test:
            return False
            
        self.db.delete(test)
        self.db.commit()
        
        return True
    
    def start_test_attempt(self, test_id: int, user_id: int) -> TestAttempt:
        """Start a new attempt for a test"""
        test = self.get_test(test_id)
        if not test:
            raise ValueError(f"Test with ID {test_id} not found")
            
        # Create a new attempt
        attempt = TestAttempt(
            test_id=test_id,
            user_id=user_id,
            started_at=datetime.utcnow()
        )
        
        self.db.add(attempt)
        self.db.commit()
        
        return attempt
    
    def submit_answer(self, attempt_id: int, question_id: int, answer_data: Dict[str, Any]) -> StudentAnswer:
        """
        Submit an answer for a question in a test attempt
        
        Args:
            attempt_id: ID of the test attempt
            question_id: ID of the question being answered
            answer_data: Answer data (text for short/long answers, choice ID for MCQ)
            
        Returns:
            The created StudentAnswer object
        """
        # Validate the attempt and question
        attempt = self.db.query(TestAttempt).filter(TestAttempt.id == attempt_id).first()
        if not attempt:
            raise ValueError(f"Test attempt with ID {attempt_id} not found")
            
        question = self.db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise ValueError(f"Question with ID {question_id} not found")
            
        # Create the answer based on question type
        if question.question_type == 'mcq':
            selected_choice_id = answer_data.get('selected_choice_id')
            
            if not selected_choice_id:
                raise ValueError("Selected choice ID is required for MCQ answers")
                
            # Get the selected choice to check if it's correct
            choice = self.db.query(QuestionChoice).filter(
                QuestionChoice.id == selected_choice_id,
                QuestionChoice.question_id == question_id
            ).first()
            
            if not choice:
                raise ValueError(f"Choice with ID {selected_choice_id} not found for question {question_id}")
                
            answer = StudentAnswer(
                attempt_id=attempt_id,
                question_id=question_id,
                selected_choice_id=selected_choice_id,
                is_correct=choice.is_correct,
                points_awarded=question.points if choice.is_correct else 0,
                feedback=question.explanation
            )
            
        else:  # short_answer or long_answer
            answer_text = answer_data.get('answer_text', '')
            
            if not answer_text:
                raise ValueError("Answer text is required for short/long answers")
                
            # For short/long answers, we'll evaluate later or use AI
            answer = StudentAnswer(
                attempt_id=attempt_id,
                question_id=question_id,
                answer_text=answer_text,
                # Initially set to None, will be evaluated later
                is_correct=None,
                points_awarded=None
            )
        
        self.db.add(answer)
        self.db.commit()
        
        return answer
    
    def complete_test_attempt(self, attempt_id: int) -> TestAttempt:
        """Complete a test attempt and calculate the final score"""
        attempt = self.db.query(TestAttempt).filter(TestAttempt.id == attempt_id).first()
        if not attempt:
            raise ValueError(f"Test attempt with ID {attempt_id} not found")
            
        # Mark as completed
        attempt.completed_at = datetime.utcnow()
        
        # Get all questions for this test
        questions = self.db.query(Question).filter(Question.test_id == attempt.test_id).all()
        
        # Get all answers for this attempt
        answers = self.db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt_id).all()
        
        # Evaluate any unevaluated answers (short/long answers)
        for answer in answers:
            if answer.is_correct is None and answer.points_awarded is None:
                question = next((q for q in questions if q.id == answer.question_id), None)
                if question:
                    self._evaluate_answer(answer, question)
        
        # Calculate the score
        total_points = sum(q.points for q in questions)
        earned_points = sum(a.points_awarded or 0 for a in answers)
        
        attempt.max_score = total_points
        attempt.score = earned_points
        
        # Generate feedback based on performance
        if total_points > 0:
            percentage = (earned_points / total_points) * 100
            if percentage >= 90:
                feedback = "Excellent! You've demonstrated a thorough understanding of the material."
            elif percentage >= 80:
                feedback = "Great job! You have a good grasp of most concepts."
            elif percentage >= 70:
                feedback = "Good work! You understand many key concepts, but there's room for improvement."
            elif percentage >= 60:
                feedback = "Satisfactory. You've grasped some concepts, but should review the material further."
            else:
                feedback = "You need more practice. Review the material and try again."
                
            attempt.feedback = feedback
        
        self.db.commit()
        return attempt
    
    def _evaluate_answer(self, answer: StudentAnswer, question: Question) -> None:
        """Evaluate a short/long answer using the AI service or simple heuristics"""
        if not answer.answer_text:
            answer.is_correct = False
            answer.points_awarded = 0
            answer.feedback = "No answer provided."
            return
            
        # Extract question data for evaluation
        question_data = {
            'question_text': question.question_text,
            'question_type': question.question_type,
            'points': question.points,
            'explanation': question.explanation
        }
        
        # Add type-specific data
        if question.question_type == 'short_answer' and question.question_metadata:
            question_data['correct_answer'] = question.question_metadata.get('correct_answer', '')
            
        elif question.question_type == 'long_answer' and question.question_metadata:
            question_data['key_points'] = question.question_metadata.get('key_points', [])
            question_data['evaluation_criteria'] = question.question_metadata.get('evaluation_criteria', '')
        
        # Use AI service for evaluation
        try:
            is_correct, points, feedback = self.ai_service.evaluate_answer(
                question_data, answer.answer_text
            )
            
            answer.is_correct = is_correct
            answer.points_awarded = points
            answer.feedback = feedback
            
        except Exception as e:
            print(f"Error evaluating answer: {str(e)}")
            # Fallback to simple evaluation - give partial credit for non-empty answers
            answer.points_awarded = question.points * 0.5
            answer.feedback = "Your answer was automatically scored due to an evaluation error."
    
    def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """Get test statistics for a user"""
        # Get all completed test attempts for the user
        attempts = self.db.query(TestAttempt).filter(
            TestAttempt.user_id == user_id,
            TestAttempt.completed_at != None
        ).all()
        
        if not attempts:
            return {
                'total_tests': 0,
                'average_score': 0,
                'highest_score': 0,
                'lowest_score': 0,
                'tests_by_type': {},
                'recent_attempts': []
            }
        
        # Calculate statistics
        scores = [
            (a.score / a.max_score * 100) if a.max_score > 0 else 0 
            for a in attempts
        ]
        
        # Group attempts by test type
        test_ids = [a.test_id for a in attempts]
        tests = self.db.query(Test).filter(Test.id.in_(test_ids)).all()
        test_types = {t.id: t.test_type for t in tests}
        
        tests_by_type = {}
        for attempt in attempts:
            test_type = test_types.get(attempt.test_id, "unknown")
            if test_type not in tests_by_type:
                tests_by_type[test_type] = 0
            tests_by_type[test_type] += 1
        
        # Get recent attempts
        recent_attempts = sorted(attempts, key=lambda a: a.completed_at or datetime.min, reverse=True)[:5]
        recent_attempt_data = []
        
        for attempt in recent_attempts:
            test = next((t for t in tests if t.id == attempt.test_id), None)
            if test:
                recent_attempt_data.append({
                    'id': attempt.id,
                    'test_id': test.id,
                    'test_title': test.title,
                    'score': attempt.score,
                    'max_score': attempt.max_score,
                    'percentage': (attempt.score / attempt.max_score * 100) if attempt.max_score > 0 else 0,
                    'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None
                })
        
        return {
            'total_tests': len(attempts),
            'average_score': sum(scores) / len(scores) if scores else 0,
            'highest_score': max(scores) if scores else 0,
            'lowest_score': min(scores) if scores else 0,
            'tests_by_type': tests_by_type,
            'recent_attempts': recent_attempt_data
        } 