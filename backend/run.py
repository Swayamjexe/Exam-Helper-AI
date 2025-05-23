import os
from dotenv import load_dotenv
from app import create_app, db
from app.models.user import User
from app.models.test import Test, Question, TestAttempt, StudentAnswer

# Load environment variables
load_dotenv()

# Create app with specified configuration
app = create_app(os.getenv('FLASK_CONFIG') or 'default')


@app.shell_context_processor
def make_shell_context():
    """Make objects available in the shell without imports."""
    return {
        'db': db,
        'User': User,
        'Test': Test,
        'Question': Question,
        'TestAttempt': TestAttempt,
        'StudentAnswer': StudentAnswer
    }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
