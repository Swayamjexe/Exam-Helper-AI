import json
import requests
from flask import current_app


def call_together_api(prompt, model=None, temperature=0.7, max_tokens=2000):
    """
    Call the Together API to get a response from the LLM.
    """
    api_key = current_app.config.get('LLM_API_KEY')
    model = model or current_app.config.get('LLM_MODEL')
    
    if not api_key:
        # For development without API key, return mock responses
        return "This is a mock response for development without API key."
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "prompt": prompt,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stop": ["</response>"]
    }
    
    response = requests.post(
        "https://api.together.xyz/v1/completions",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        return response.json()["choices"][0]["text"].strip()
    else:
        raise Exception(f"API request failed with status {response.status_code}: {response.text}")


def generate_test(material_contents, test_type, question_count=5):
    """
    Generate test questions based on provided material content.
    
    Args:
        material_contents: List of strings containing the content of materials
        test_type: Type of test to generate (mcq, short_answer, long_answer, mixed)
        question_count: Number of questions to generate
        
    Returns:
        List of question objects
    """
    # Combine material contents (limit size to avoid token limits)
    combined_content = "\n\n".join(material_contents)
    max_chars = 10000  # Arbitrary limit to avoid exceeding token limits
    if len(combined_content) > max_chars:
        combined_content = combined_content[:max_chars]
    
    prompt = f"""
You are an expert education assistant. Based on the following educational material, 
create a test with {question_count} questions of type: {test_type}.

Educational Material:
{combined_content}

For each question, provide:
1. The question text
2. The question type (mcq, short_answer, long_answer)
3. For MCQ: 4 options in a list format
4. The correct answer
5. Points value for the question

Format your response as a JSON array with the following structure:
<response>
[
  {{
    "question": "Question text here",
    "type": "mcq OR short_answer OR long_answer",
    "options": ["Option A", "Option B", "Option C", "Option D"],  // Only for MCQs
    "answer": "Correct answer here",
    "points": 2
  }},
  // More questions...
]
</response>

Make the questions challenging and test deep understanding of the material.
"""
    
    try:
        response = call_together_api(prompt, temperature=0.8)
        
        # Extract JSON from response
        if "<response>" in response:
            response = response.split("<response>")[1].split("</response>")[0]
        
        questions_data = json.loads(response)
        return questions_data
    except Exception as e:
        # Fallback to mock data if API fails
        print(f"Error generating test: {str(e)}")
        return generate_mock_test(test_type, question_count)


def evaluate_test(question_data):
    """
    Evaluate test answers and provide feedback.
    
    Args:
        question_data: List of question objects with user answers
        
    Returns:
        Evaluation object with score, feedback, strengths, weaknesses
    """
    # Calculate basic score
    total_points = sum(q.get('points', 1) for q in question_data)
    earned_points = 0
    
    # Create prompt with questions and answers
    questions_text = []
    for i, question in enumerate(question_data):
        q_text = f"Question {i+1}: {question['question_text']}\n"
        q_text += f"Type: {question['question_type']}\n"
        
        if question['question_type'] == 'mcq' and question.get('options'):
            try:
                options = json.loads(question['options'])
                for j, opt in enumerate(options):
                    q_text += f"Option {chr(65+j)}: {opt}\n"
            except:
                q_text += "Options: Error parsing options\n"
        
        q_text += f"Correct Answer: {question['correct_answer']}\n"
        q_text += f"Student's Answer: {question['user_answer']}\n"
        
        # Simple scoring logic
        if question['question_type'] == 'mcq':
            if question['user_answer'].strip().lower() == question['correct_answer'].strip().lower():
                earned_points += question.get('points', 1)
                q_text += "Score: Correct\n"
            else:
                q_text += "Score: Incorrect\n"
        else:
            # For non-MCQ, we'll let the LLM evaluate
            q_text += "Score: Needs evaluation\n"
        
        questions_text.append(q_text)
    
    # Create prompt for evaluation
    prompt = f"""
You are an expert educational evaluator. Assess the following test answers and provide feedback.

Test Details:
{"\n\n".join(questions_text)}

For non-MCQ questions, evaluate the student's answer against the correct answer.
Determine if each answer is correct, partially correct, or incorrect.

Provide:
1. A total score out of {total_points} points
2. General feedback on the student's performance
3. A list of strengths (areas the student demonstrated good understanding)
4. A list of weaknesses (areas the student needs to improve)

Format your response as a JSON object:
<response>
{{
  "score": 85,
  "max_score": {total_points},
  "feedback": "Detailed feedback here...",
  "strengths": ["Strength 1", "Strength 2", ...],
  "weaknesses": ["Weakness 1", "Weakness 2", ...]
}}
</response>
"""
    
    try:
        response = call_together_api(prompt, temperature=0.4, max_tokens=3000)
        
        # Extract JSON from response
        if "<response>" in response:
            response = response.split("<response>")[1].split("</response>")[0]
        
        evaluation = json.loads(response)
        return evaluation
    except Exception as e:
        # Fallback to basic scoring if API fails
        print(f"Error evaluating test: {str(e)}")
        return {
            "score": earned_points,
            "max_score": total_points,
            "feedback": "We could not generate detailed feedback at this time.",
            "strengths": ["Unable to determine strengths"],
            "weaknesses": ["Unable to determine areas for improvement"]
        }


def generate_mock_test(test_type, question_count):
    """Generate mock test data for development without API key."""
    if test_type == 'mcq':
        return [
            {
                "question": "What is the capital of France?",
                "type": "mcq",
                "options": ["London", "Berlin", "Paris", "Madrid"],
                "answer": "Paris",
                "points": 1
            },
            {
                "question": "Which planet is known as the Red Planet?",
                "type": "mcq",
                "options": ["Venus", "Mars", "Jupiter", "Saturn"],
                "answer": "Mars",
                "points": 1
            }
        ]
    elif test_type == 'short_answer':
        return [
            {
                "question": "Explain the water cycle in 2-3 sentences.",
                "type": "short_answer",
                "answer": "The water cycle is the continuous movement of water within the Earth and atmosphere. It includes processes like evaporation, condensation, precipitation, and collection.",
                "points": 2
            }
        ]
    elif test_type == 'long_answer':
        return [
            {
                "question": "Describe the causes and effects of climate change.",
                "type": "long_answer",
                "answer": "Climate change is primarily caused by human activities that increase greenhouse gas emissions, such as burning fossil fuels and deforestation. Effects include rising global temperatures, melting ice caps, rising sea levels, and more frequent extreme weather events.",
                "points": 5
            }
        ]
    else:  # mixed
        return [
            {
                "question": "What is the capital of France?",
                "type": "mcq",
                "options": ["London", "Berlin", "Paris", "Madrid"],
                "answer": "Paris",
                "points": 1
            },
            {
                "question": "Explain the water cycle in 2-3 sentences.",
                "type": "short_answer",
                "answer": "The water cycle is the continuous movement of water within the Earth and atmosphere. It includes processes like evaporation, condensation, precipitation, and collection.",
                "points": 2
            }
        ] 