from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, verify_jwt_in_request
from .. import db
from ..models.user import User
import traceback

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 409
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.password = data['password']
    
    db.session.add(user)
    db.session.commit()
    
    # Generate access token
    access_token = create_access_token(identity=str(user.id), additional_claims={"sub": str(user.id)})

    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    # Verify user and password
    if not user or not user.verify_password(data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Generate access token
    access_token = create_access_token(identity=str(user.id), additional_claims={"sub": str(user.id)})
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict()
    }), 200


@auth_bp.route('/debug-token', methods=['GET'])
def debug_token():
    """Debug endpoint to help troubleshoot JWT token issues"""
    try:
        # Get the Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        # Log the headers for debugging
        headers_info = dict(request.headers)
        
        # Try to verify the JWT
        jwt_valid = False
        jwt_error = None
        jwt_identity = None
        
        try:
            # Manually verify the JWT token
            verify_jwt_in_request()
            jwt_valid = True
            jwt_identity = get_jwt_identity()
        except Exception as e:
            jwt_error = str(e)
            traceback.print_exc()
        
        return jsonify({
            'auth_header': auth_header,
            'jwt_valid': jwt_valid,
            'jwt_error': jwt_error,
            'jwt_identity': jwt_identity,
            'headers_info': headers_info,
            'jwt_config': {
                'header_name': current_app.config.get('JWT_HEADER_NAME'),
                'header_type': current_app.config.get('JWT_HEADER_TYPE'),
                'token_location': current_app.config.get('JWT_TOKEN_LOCATION')
            }
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500 