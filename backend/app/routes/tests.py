import json
from flask import Blueprint, request, jsonify, g, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models.test import Test, Question, TestAttempt, StudentAnswer
from ..models.material import Material
from ..services.test_service import TestService
from ..services.ai_service import AIService
from ..utils.auth import login_required

tests_bp = Blueprint('tests', __name__, url_prefix='/api/tests')


@tests_bp.route('', methods=['GET'])
@login_required
def get_user_tests():
    """Get all tests for the current user"""
    try:
        test_service = TestService(g.db)
        tests = test_service.get_user_tests(g.user['id'])
        
        result = []
        for test in tests:
            result.append({
                'id': test.id,
                'title': test.title,
                'description': test.description,
                'test_type': test.test_type,
                'total_questions': test.total_questions,
                'time_limit_minutes': test.time_limit_minutes,
                'created_at': test.created_at.isoformat() if test.created_at else None,
                'updated_at': test.updated_at.isoformat() if test.updated_at else None,
            })
        
        return jsonify({'tests': result})
    except Exception as e:
        current_app.logger.error(f"Error fetching tests: {str(e)}")
        return jsonify({'error': 'Failed to fetch tests'}), 500


@tests_bp.route('/<test_id>', methods=['GET'])
@login_required
def get_test(test_id):
    """Get a specific test with its questions"""
    try:
        test_service = TestService(g.db)
        test = test_service.get_test(test_id, g.user['id'])
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
        
        # Get questions for the test
        questions = []
        for question in test.questions:
            q_data = {
                'id': question.id,
                'question_text': question.question_text,
                'question_type': question.question_type,
                'difficulty': question.difficulty,
                'points': question.points,
                'explanation': question.explanation,
            }
            
            # For MCQ questions, include choices
            if question.question_type == 'mcq':
                q_data['choices'] = [
                    {
                        'id': choice.id,
                        'text': choice.choice_text
                    }
                    for choice in question.choices
                ]
            
            questions.append(q_data)
        
        # Prepare response
        response = {
            'id': test.id,
            'title': test.title,
            'description': test.description,
            'test_type': test.test_type,
            'total_questions': test.total_questions,
            'time_limit_minutes': test.time_limit_minutes,
            'created_at': test.created_at.isoformat() if test.created_at else None,
            'updated_at': test.updated_at.isoformat() if test.updated_at else None,
            'questions': questions
        }
        
        return jsonify(response)
    except Exception as e:
        current_app.logger.error(f"Error fetching test {test_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch test'}), 500


@tests_bp.route('/generate', methods=['POST'])
@login_required
def create_test():
    """Create a new test"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
            
        # Required fields validation
        required_fields = ['title', 'test_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Validate test type
        valid_test_types = ['mcq', 'short_answer', 'long_answer', 'mixed']
        if data['test_type'] not in valid_test_types:
            return jsonify({'error': f'Invalid test type. Must be one of: {", ".join(valid_test_types)}'}), 400
        
        # Initialize services
        test_service = TestService(g.db, AIService())
        
        # Extract fields
        title = data['title']
        description = data.get('description', '')
        test_type = data['test_type']
        material_ids = data.get('material_ids', [])
        settings = data.get('settings', {})
        
        # Create the test
        test = test_service.create_test(
            user_id=g.user['id'],
            title=title,
            description=description,
            test_type=test_type,
            material_ids=material_ids,
            settings=settings
        )
        
        # Prepare response
        return jsonify({
            'id': test.id,
            'title': test.title,
            'description': test.description,
            'test_type': test.test_type,
            'total_questions': test.total_questions,
            'time_limit_minutes': test.time_limit_minutes,
            'created_at': test.created_at.isoformat() if test.created_at else None,
            'updated_at': test.updated_at.isoformat() if test.updated_at else None,
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error creating test: {str(e)}")
        return jsonify({'error': 'Failed to create test'}), 500


@tests_bp.route('/<test_id>', methods=['DELETE'])
@login_required
def delete_test(test_id):
    """Delete a test"""
    try:
        test_service = TestService(g.db)
        test = test_service.get_test(test_id, g.user['id'])
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
            
        test_service.delete_test(test_id)
        return jsonify({'message': 'Test deleted successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting test {test_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete test'}), 500


@tests_bp.route('/<test_id>/attempt', methods=['POST'])
@login_required
def start_test_attempt(test_id):
    """Start a new test attempt"""
    try:
        test_service = TestService(g.db)
        test = test_service.get_test(test_id)
        
        if not test:
            return jsonify({'error': 'Test not found'}), 404
            
        attempt = test_service.start_test_attempt(test_id, g.user['id'])
        
        return jsonify({
            'attempt_id': attempt.id,
            'test_id': attempt.test_id,
            'started_at': attempt.started_at.isoformat() if attempt.started_at else None
        }), 201
    except Exception as e:
        current_app.logger.error(f"Error starting test attempt for test {test_id}: {str(e)}")
        return jsonify({'error': 'Failed to start test attempt'}), 500


@tests_bp.route('/attempts/<attempt_id>/submit', methods=['POST'])
@login_required
def submit_answer(attempt_id):
    """Submit an answer for a question in a test attempt"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
            
        # Required fields validation
        required_fields = ['question_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        test_service = TestService(g.db)
        answer = test_service.submit_answer(
            attempt_id=attempt_id,
            question_id=data['question_id'],
            answer_data=data
        )
        
        # Return appropriate data based on question type
        if answer.is_correct is not None:
            # For MCQ, we can return immediate evaluation
            return jsonify({
                'id': answer.id,
                'is_correct': answer.is_correct,
                'points_awarded': answer.points_awarded,
                'feedback': answer.feedback
            })
        else:
            # For short/long answers, indicate pending evaluation
            return jsonify({
                'id': answer.id,
                'status': 'submitted'
            })
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error submitting answer for attempt {attempt_id}: {str(e)}")
        return jsonify({'error': 'Failed to submit answer'}), 500


@tests_bp.route('/attempts/<attempt_id>/complete', methods=['GET', 'POST'])
@login_required
def complete_test_attempt(attempt_id):
    """Complete a test attempt and get results"""
    try:
        test_service = TestService(g.db)
        
        # If POST request, mark as completed
        if request.method == 'POST':
            attempt = test_service.complete_test_attempt(attempt_id)
        else:
            # For GET requests, just retrieve the attempt
            attempt = test_service.db.query(TestAttempt).filter(TestAttempt.id == attempt_id).first()
            if not attempt:
                return jsonify({'error': 'Test attempt not found'}), 404
        
        # Get all questions and answers
        questions = []
        for question in attempt.test.questions:
            # Find the corresponding answer
            answer = next((a for a in attempt.answers if a.question_id == question.id), None)
            
            q_data = {
                'id': question.id,
                'question_text': question.question_text,
                'question_type': question.question_type,
                'points': question.points,
                'explanation': question.explanation,
            }
            
            # Add answer data if available
            if answer:
                q_data['answer'] = {
                    'id': answer.id,
                    'is_correct': answer.is_correct,
                    'points_awarded': answer.points_awarded,
                    'feedback': answer.feedback
                }
                
                if question.question_type == 'mcq':
                    q_data['answer']['selected_choice_id'] = answer.selected_choice_id
                else:
                    q_data['answer']['text'] = answer.answer_text
            
            questions.append(q_data)
        
        # Calculate percentage score
        percentage = (attempt.score / attempt.max_score * 100) if attempt.max_score > 0 else 0
        
        return jsonify({
            'attempt_id': attempt.id,
            'test_id': attempt.test_id,
            'score': attempt.score,
            'max_score': attempt.max_score,
            'percentage': percentage,
            'feedback': attempt.feedback,
            'started_at': attempt.started_at.isoformat() if attempt.started_at else None,
            'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
            'questions': questions
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error completing test attempt {attempt_id}: {str(e)}")
        return jsonify({'error': 'Failed to complete test attempt'}), 500


@tests_bp.route('/statistics', methods=['GET'])
@login_required
def get_user_statistics():
    """Get test statistics for the current user"""
    try:
        test_service = TestService(g.db)
        stats = test_service.get_user_statistics(g.user['id'])
        
        return jsonify(stats)
    except Exception as e:
        current_app.logger.error(f"Error fetching user statistics: {str(e)}")
        return jsonify({'error': 'Failed to fetch user statistics'}), 500 