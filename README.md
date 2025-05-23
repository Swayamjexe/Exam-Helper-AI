# Exam Helper AI

A sophisticated web application designed to enhance exam preparation through AI-powered test generation. Exam Helper AI enables students to upload their study materials and receive customized tests tailored to their learning needs, helping them assess their understanding and identify areas for improvement.

## Features

- **Secure User Authentication:** Robust login and registration system with JWT protection
- **Comprehensive Material Management:** Upload, organize, and access study materials efficiently
- **AI-Powered Test Generation:** Create personalized tests based on uploaded learning materials
- **Versatile Question Types:** Support for multiple-choice, short-answer, and long-answer questions
- **Intelligent Evaluation:** AI-powered assessment of student responses
- **Detailed Performance Analytics:** Comprehensive insights to identify knowledge gaps and strengths

## Tech Stack

### Backend
- **Framework:** Flask (Python)
- **Database:** SQLAlchemy with SQLite
- **Authentication:** JWT (JSON Web Tokens)
- **Vector Database:** ChromaDB
- **LLM Integration:** Together AI

### Frontend
- **Framework:** React with TypeScript
- **UI Library:** Material-UI
- **Routing:** React Router
- **API Client:** Axios

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- pip
- Microsoft Visual C++ 14.0 or greater (for Windows users, required for some ML dependencies)

### Backend Setup

There are two ways to set up the backend:

#### Basic Setup (Without ML Features)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

4. Install basic dependencies:
```bash
pip install -r requirements.txt
```

5. Initialize the database:
```bash
python init_db.py
```

6. Run the Flask server:
```bash
python run.py
```

#### Full Setup (With ML Features)

For the full experience with ML features, you need to install additional dependencies:

1. Install Microsoft Visual C++ Build Tools:
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Make sure to select "Desktop development with C++"

2. Follow steps 1-3 from the Basic Setup, then:

3. Install all dependencies:
```bash
pip install -r requirements.txt
```

4. If you encounter errors with huggingface_hub, try:
```bash
pip install huggingface_hub==0.16.4
```

5. Create a `.env` file based on `sample.env`:
```bash
cp sample.env .env
```

6. Edit the `.env` file and add your Together AI API key (get one from [together.ai](https://together.ai/))

7. Initialize the database:
```bash
python init_db.py
```

8. Run the Flask server:
```bash
python run.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and go to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
exam-helper/
├── backend/               # Flask backend
│   ├── app/
│   │   ├── __init__.py    # Flask app initialization
│   │   ├── routes/        # API endpoints
│   │   │   └── minimal/   # Minimal versions of routes (no ML)
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic and LLM integration
│   │   └── utils/         # Helper functions
│   ├── config.py          # Configuration settings
│   ├── requirements.txt   # Python dependencies
│   └── run.py             # Entry point
├── frontend/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client services
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Helper functions
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
└── README.md              # Project documentation
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile

### Materials
- `GET /api/materials` - Get user's materials
- `GET /api/materials/:id` - Get specific material
- `POST /api/materials` - Upload new material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material
- `GET /api/materials/:id/download` - Download a material

### Tests
- `GET /api/tests` - Get user's tests
- `GET /api/tests/:id` - Get specific test
- `POST /api/tests` - Create a new test
- `POST /api/tests/:id/questions` - Add a question to a test
- `POST /api/tests/:id/results` - Submit test results
- `GET /api/tests/results` - Get all test results

## Troubleshooting

### ChromaDB and ML Dependencies

If you encounter issues with ChromaDB or other ML dependencies, the application will fall back to minimal functionality. You'll see warning logs like:

```
ChromaDB not available: cannot import name 'OfflineModeIsEnabled' from 'huggingface_hub.utils'
```

The most common issue on Windows is the missing Microsoft Visual C++ 14.0 or greater, which is required to build the ChromaDB native extensions.

In minimal mode, you can still:
- Upload and manage study materials (though they won't be processed for vector search)
- Manually create tests and questions
- Take tests and see results

### 422 Unprocessable Entity Errors

If you're seeing 422 errors when accessing protected routes, make sure:
1. You're logged in and have a valid JWT token
2. The token is properly included in the Authorization header
3. The token hasn't expired

### Material UI Icon Import Errors

If you encounter compilation errors related to Material UI icon imports, change the import style:

From:
```jsx
import { Menu as MenuIcon } from '@mui/icons-material'
```

To:
```jsx
import MenuIcon from '@mui/icons-material/Menu'
```

## Future Enhancements

- **AI-Powered Text Answer Grading:** Implementation of advanced NLP algorithms to evaluate and provide feedback on free-text responses
- **Intelligent Text Extraction:** Enhanced capabilities to extract and process text from various study materials including images, PDFs, and handwritten notes
- **Real-time Collaboration:** Integrated tools that enable students to study together, share materials, and engage in group test preparation
- **Cross-Platform Mobile Application:** Native mobile experience for iOS and Android to enable learning on-the-go
- **Enhanced Test Statistics and Analytics:** Comprehensive performance metrics with visual dashboards to track progress and identify learning patterns

## Application Screenshots
### Dashboard

![Dashboard](https://github.com/user-attachments/assets/e2758743-27bf-41f9-88da-4b8c333dd852)

### Study Materials
![Study Materials](https://github.com/user-attachments/assets/f1ae1f60-a72d-49be-b243-844391d903cf)

### Adding a Material
![add_material](https://github.com/user-attachments/assets/4e0c9b30-ee85-49a4-8f68-ed89ddfd203a)

### Tests & Quizzes
![tests_quizzes](https://github.com/user-attachments/assets/f01dbaba-aa3f-4623-b412-27d2a6f2b9b5)

### Statistics
![stats](https://github.com/user-attachments/assets/ce22fcf1-73b0-49dd-91b2-681e5f7eaff5)

### Creating a Test
![create_test](https://github.com/user-attachments/assets/6aa66b3c-43eb-4d39-bb25-882f3a993ac3)

### Attempting Test 1
![attempt_test_1](https://github.com/user-attachments/assets/ecb68ac1-261a-4612-9406-8f481a28bc73)

### Attempting Test 2
![attempt_test_2](https://github.com/user-attachments/assets/5c57e34f-8ca5-4488-ae5d-9fb14d70a181)

### Test Results
![results](https://github.com/user-attachments/assets/0efbada5-770a-45f6-9b21-70a318eaa46e)


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Together AI for providing the LLM API
- Material-UI for the component library
- Flask community for the excellent documentation 
