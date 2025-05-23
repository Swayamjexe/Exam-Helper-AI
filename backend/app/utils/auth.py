from functools import wraps
import traceback
from flask import request, jsonify, g, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models import User

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check if Authorization header exists
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            current_app.logger.error("No Authorization header found in request")
            return jsonify({"error": "Authentication required", "details": "No Authorization header provided"}), 401
            
        # Check Authorization header format
        if not auth_header.startswith('Bearer '):
            current_app.logger.error(f"Invalid Authorization header format: {auth_header}")
            return jsonify({"error": "Authentication required", "details": "Invalid Authorization header format"}), 401
            
        try:
            # Verify the JWT is valid
            verify_jwt_in_request()
            
            # Get the current user's identity from the JWT
            user_id = get_jwt_identity()
            current_app.logger.info(f"User authenticated with ID: {user_id}")
            
            # Store DB session in g for later use
            from .. import db
            g.db = db.session
            
            # Get the user from the database
            user = User.query.get(user_id)
            if not user:
                current_app.logger.error(f"User ID {user_id} from token not found in database")
                return jsonify({"error": "User not found", "details": "Token contains a user ID that doesn't exist"}), 401
            
            # Store user in g for convenience
            g.user = {"id": user.id, "username": user.username, "email": user.email}
            
            return f(*args, **kwargs)
        except Exception as e:
            # Print the full stack trace for debugging
            traceback.print_exc()
            current_app.logger.error(f"Authentication error: {str(e)}")
            
            # Return a more helpful error message
            error_msg = str(e)
            if "expired" in error_msg.lower():
                return jsonify({"error": "Token expired", "details": "Please log in again"}), 401
            elif "invalid" in error_msg.lower():
                return jsonify({"error": "Invalid token", "details": "Please log in again"}), 401
            else:
                return jsonify({"error": "Authentication required", "details": str(e)}), 401
            
    return decorated 