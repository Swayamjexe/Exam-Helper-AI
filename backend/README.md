# Exam Helper Backend

This is the backend server for the Exam Helper application. It provides APIs for managing study materials, generating tests, and more.

## Setup Instructions

### Basic Setup (Without ML Features)

If you just want to use the core features without ML capabilities (file upload, manual test creation), you can follow these steps:

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

3. Install basic dependencies:
   ```
   pip install Flask==2.3.3 Flask-RESTful==0.3.10 Flask-SQLAlchemy==3.1.1 Flask-Migrate==4.0.5 Flask-CORS==4.0.0 Flask-JWT-Extended==4.5.3 python-dotenv==1.0.0 requests==2.31.0 PyJWT==2.10.1 cryptography==42.0.5 pdfminer.six==20221105 python-docx==1.0.1 werkzeug==2.3.7
   ```

4. Initialize the database:
   ```
   python init_db.py
   ```

5. Run the application:
   ```
   python run.py
   ```

### Full Setup (With ML Features)

To use all features including ChromaDB for vector search and ML-powered test generation, you'll need additional dependencies:

1. Install Microsoft Visual C++ Build Tools:
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Make sure to select "Desktop development with C++"

2. Install ML dependencies (after installing basic dependencies):
   ```
   pip install chromadb==0.4.22 sentence-transformers==2.2.2 numpy==1.26.2 langchain==0.1.1
   ```

   Note: If you encounter errors with the above command, try installing an older version of huggingface_hub:
   ```
   pip install huggingface_hub==0.16.4
   ```

3. Run the application as normal.

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Materials

- `GET /api/materials` - Get all materials for the current user
- `POST /api/materials` - Upload a new material
- `GET /api/materials/:id` - Get a specific material
- `PUT /api/materials/:id` - Update a material
- `DELETE /api/materials/:id` - Delete a material
- `GET /api/materials/:id/download` - Download a material

### Tests

- `GET /api/tests` - Get all tests for the current user
- `POST /api/tests` - Create a new test
- `GET /api/tests/:id` - Get a specific test
- `PUT /api/tests/:id` - Update a test
- `DELETE /api/tests/:id` - Delete a test
- `POST /api/tests/:id/questions` - Add a question to a test
- `POST /api/tests/:id/results` - Submit a test result
- `GET /api/tests/results` - Get all test results for the current user

## Troubleshooting

### ChromaDB Issues

If you're having issues with ChromaDB or other ML dependencies, the application will fall back to minimal functionality. You'll see warning logs like:

```
ChromaDB not available: cannot import name 'OfflineModeIsEnabled' from 'huggingface_hub.utils'
```

In this mode, you can still:
- Upload and manage study materials (though they won't be processed for vector search)
- Manually create tests and questions
- Take tests and see results

### 422 Unprocessable Entity Errors

If you're seeing 422 errors when accessing protected routes, make sure:
1. You're logged in and have a valid JWT token
2. The token is properly included in the Authorization header
3. The token hasn't expired 