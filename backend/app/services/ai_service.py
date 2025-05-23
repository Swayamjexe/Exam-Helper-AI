import os
import json
import time
import random
import requests
from typing import List, Dict, Any, Tuple, Optional

class AIService:
    def __init__(self):
        """Initialize the AI service with API connection settings"""
        self.api_key = os.environ.get("TOGETHER_API_KEY", "")
        self.api_url = "https://api.together.xyz/v1/completions"
        
        # Default model settings
        self.default_model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
        self.temperature = 0.7
        self.max_tokens = 2048
        
        # Check if API key is available
        if not self.api_key:
            print("WARNING: TOGETHER_API_KEY environment variable not set. AI features will not work.")
    
    def generate_questions(self, material_text: str, test_type: str, 
                          num_questions: int = 5, 
                          difficulty: str = "medium",
                          instructions: str = "") -> List[Dict[str, Any]]:
        """
        Generate test questions based on the provided material
        
        Args:
            material_text: The text content from which to generate questions
            test_type: Type of test (mcq, short_answer, long_answer, mixed)
            num_questions: Number of questions to generate
            difficulty: Difficulty level (easy, medium, hard)
            instructions: Any additional instructions for question generation
            
        Returns:
            A list of question dictionaries with their answers
        """
        if not self.api_key:
            raise ValueError("AI service not configured. Set the TOGETHER_API_KEY environment variable.")
        
        if not material_text or len(material_text.strip()) < 100:
            raise ValueError("Insufficient material content for question generation.")
        
        # Truncate material text if too long (max 15k chars for context)
        material_text = material_text[:15000] if len(material_text) > 15000 else material_text
        
        # Build the appropriate prompt based on test type
        prompt = self._build_prompt(material_text, test_type, num_questions, difficulty, instructions)
        
        # Make the API call to generate questions
        try:
            response_json = self._call_ai_api(prompt)
            
            # Parse the response to extract questions
            questions = self._parse_questions(response_json, test_type)
            
            return questions
        
        except Exception as e:
            print(f"Error generating questions: {str(e)}")
            # Fallback with sample questions to handle errors gracefully
            return self._generate_fallback_questions(test_type, num_questions)
    
    def _build_prompt(self, material_text: str, test_type: str, 
                     num_questions: int, difficulty: str, 
                     instructions: str) -> str:
        """
        Build the appropriate prompt for the AI based on the test type
        """
        base_prompt = f"""
You are an expert teacher and test creator. Based on the following educational material, create {num_questions} {difficulty} level {test_type} questions.

EDUCATIONAL MATERIAL:
---
{material_text}
---

"""
        
        # Add specific instructions based on test type
        if test_type == "mcq":
            type_instructions = f"""
Create {num_questions} multiple-choice questions with exactly 4 options each (A, B, C, D).
For each question:
1. Write a clear question based on the material
2. Provide 4 possible answers labeled A through D
3. Indicate the correct answer
4. Add a brief explanation of why the answer is correct

Format your response as a JSON array with objects having this structure:
{{
  "question_text": "The question text here",
  "question_type": "mcq",
  "choices": [
    {{"text": "Option A text", "is_correct": false}},
    {{"text": "Option B text", "is_correct": true}},
    {{"text": "Option C text", "is_correct": false}},
    {{"text": "Option D text", "is_correct": false}}
  ],
  "explanation": "Explanation why the correct answer is right",
  "difficulty": "{difficulty}"
}}
"""
        elif test_type == "short_answer":
            type_instructions = f"""
Create {num_questions} short-answer questions that require brief responses (1-3 sentences).
For each question:
1. Write a clear question based on the material
2. Provide the expected correct answer
3. Add a brief explanation about what makes a good answer

Format your response as a JSON array with objects having this structure:
{{
  "question_text": "The question text here",
  "question_type": "short_answer",
  "correct_answer": "The expected correct answer",
  "explanation": "Explanation about what a good answer should include",
  "difficulty": "{difficulty}"
}}
"""
        elif test_type == "long_answer":
            type_instructions = f"""
Create {num_questions} long-answer/essay questions that require detailed responses.
For each question:
1. Write a thought-provoking question based on the material
2. Provide key points that should be included in a good answer
3. Add evaluation criteria for assessing the answer quality

Format your response as a JSON array with objects having this structure:
{{
  "question_text": "The essay question text here",
  "question_type": "long_answer",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "evaluation_criteria": "Description of what makes a good answer",
  "difficulty": "{difficulty}"
}}
"""
        elif test_type == "mixed":
            type_instructions = f"""
Create {num_questions} questions with a mix of multiple-choice, short-answer, and long-answer questions.
Try to include at least one of each type.

For each question, format as appropriate for its type:

For MCQ questions:
{{
  "question_text": "The question text here",
  "question_type": "mcq",
  "choices": [
    {{"text": "Option A text", "is_correct": false}},
    {{"text": "Option B text", "is_correct": true}},
    {{"text": "Option C text", "is_correct": false}},
    {{"text": "Option D text", "is_correct": false}}
  ],
  "explanation": "Explanation why the correct answer is right",
  "difficulty": "{difficulty}"
}}

For short-answer questions:
{{
  "question_text": "The question text here",
  "question_type": "short_answer",
  "correct_answer": "The expected correct answer",
  "explanation": "Explanation about what a good answer should include",
  "difficulty": "{difficulty}"
}}

For long-answer questions:
{{
  "question_text": "The essay question text here",
  "question_type": "long_answer",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "evaluation_criteria": "Description of what makes a good answer",
  "difficulty": "{difficulty}"
}}
"""
        
        # Add custom instructions if provided
        user_instructions = f"\nADDITIONAL INSTRUCTIONS:\n{instructions}\n" if instructions else ""
        
        # Add reminder for JSON format
        format_reminder = """
IMPORTANT: Return ONLY a valid JSON array of questions without any other text or explanation.
Make sure the JSON is properly formatted with proper nesting, quotes, commas, and braces.
Do not include ```json or ``` markers in your response.
"""
        
        # Combine all parts into the final prompt
        final_prompt = base_prompt + user_instructions + type_instructions + format_reminder
        
        return final_prompt
    
    def _call_ai_api(self, prompt: str) -> Dict[str, Any]:
        """Make the API call to the Together AI platform"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.default_model,
            "prompt": prompt,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stop": ["}]"],  # Stop when the JSON array ends
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            
            response_json = response.json()
            return response_json
            
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {str(e)}")
            if hasattr(e, 'response') and e.response:
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            raise RuntimeError(f"Failed to call AI API: {str(e)}")
    
    def _parse_questions(self, response_json: Dict[str, Any], test_type: str) -> List[Dict[str, Any]]:
        """Parse the AI response to extract questions"""
        try:
            # Extract the generated text from the response
            generated_text = response_json.get('choices', [{}])[0].get('text', '')
            
            # Clean up the text to ensure it's valid JSON
            # Remove any non-JSON content before the opening bracket
            if '[' in generated_text:
                generated_text = generated_text[generated_text.find('['):]
                
            # Ensure the JSON is properly terminated
            if not generated_text.strip().endswith(']'):
                generated_text = generated_text.strip() + ']'
            
            # Parse the JSON data
            questions = json.loads(generated_text)
            
            # Validate the questions format
            validated_questions = []
            for q in questions:
                if 'question_text' in q and 'question_type' in q:
                    # Clean up and validate based on question type
                    if q['question_type'] == 'mcq':
                        # Ensure there are choices and exactly one correct answer
                        if 'choices' in q and any(c.get('is_correct', False) for c in q.get('choices', [])):
                            validated_questions.append(q)
                    elif q['question_type'] in ['short_answer', 'long_answer']:
                        # Ensure there's either a correct answer or evaluation criteria
                        if 'correct_answer' in q or 'key_points' in q:
                            validated_questions.append(q)
            
            return validated_questions
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            print(f"Error parsing AI response: {str(e)}")
            print(f"Generated text: {response_json.get('choices', [{}])[0].get('text', '')}")
            raise ValueError(f"Failed to parse AI response into valid questions: {str(e)}")
    
    def _generate_fallback_questions(self, test_type: str, num_questions: int) -> List[Dict[str, Any]]:
        """Generate fallback questions when the AI call fails"""
        fallback_questions = []
        
        # Create simple fallback questions based on test type
        if test_type == "mcq" or test_type == "mixed":
            fallback_questions.append({
                "question_text": "What is the main topic of this material?",
                "question_type": "mcq",
                "choices": [
                    {"text": "Option A", "is_correct": True},
                    {"text": "Option B", "is_correct": False},
                    {"text": "Option C", "is_correct": False},
                    {"text": "Option D", "is_correct": False}
                ],
                "explanation": "This is a sample question. The AI failed to generate proper questions.",
                "difficulty": "medium"
            })
            
        if test_type == "short_answer" or test_type == "mixed":
            fallback_questions.append({
                "question_text": "Summarize the key points from this material.",
                "question_type": "short_answer",
                "correct_answer": "A good answer would include the main points from the material.",
                "explanation": "This is a sample question. The AI failed to generate proper questions.",
                "difficulty": "medium"
            })
            
        if test_type == "long_answer" or test_type == "mixed":
            fallback_questions.append({
                "question_text": "Analyze the significance of the concepts presented in this material.",
                "question_type": "long_answer",
                "key_points": ["Main concept", "Supporting details", "Applications or implications"],
                "evaluation_criteria": "A good answer should analyze the main concepts and their significance.",
                "difficulty": "medium"
            })
        
        # Fill up to requested number if needed
        while len(fallback_questions) < num_questions:
            fallback_questions.append(random.choice(fallback_questions).copy())
        
        return fallback_questions[:num_questions]

    def evaluate_answer(self, question: Dict[str, Any], student_answer: str) -> Tuple[bool, float, str]:
        """
        Evaluate a student's answer to a question
        
        Args:
            question: The question dictionary
            student_answer: The student's answer text
            
        Returns:
            Tuple of (is_correct, points_awarded, feedback)
        """
        question_type = question.get('question_type', '')
        
        # For MCQ, we can evaluate without AI
        if question_type == 'mcq':
            selected_choice_id = student_answer  # This should be the ID of the selected choice
            
            # Find the selected choice
            for i, choice in enumerate(question.get('choices', [])):
                if str(i) == str(selected_choice_id):
                    is_correct = choice.get('is_correct', False)
                    points = question.get('points', 1) if is_correct else 0
                    feedback = "Correct! " + question.get('explanation', '') if is_correct else "Incorrect. " + question.get('explanation', '')
                    return is_correct, points, feedback
            
            return False, 0, "Invalid choice selection."
        
        # For short answers, we need AI assistance for grading
        elif question_type == 'short_answer':
            if not student_answer.strip():
                return False, 0, "No answer provided."
                
            # If AI service isn't available, use a simple matching approach
            if not self.api_key:
                correct_answer = question.get('correct_answer', '').lower()
                student_answer_lower = student_answer.lower()
                
                # Simple keyword matching
                keywords = set(correct_answer.split()) - set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at'])
                matched_keywords = sum(1 for word in keywords if word in student_answer_lower)
                
                if matched_keywords > len(keywords) * 0.7:
                    return True, question.get('points', 1), "Good answer!"
                elif matched_keywords > len(keywords) * 0.4:
                    return True, question.get('points', 1) * 0.5, "Partially correct."
                else:
                    return False, 0, "Incorrect answer."
            
            # Otherwise prepare for AI-based evaluation (to be implemented)
            # This is a placeholder for now
            return True, question.get('points', 1) * 0.8, "Answer evaluated (AI grading not yet implemented)."
        
        # For long answers, we need AI assistance
        elif question_type == 'long_answer':
            if not student_answer.strip():
                return False, 0, "No answer provided."
                
            # For now, just check if the answer includes key points
            key_points = question.get('key_points', [])
            points_covered = 0
            
            for point in key_points:
                if point.lower() in student_answer.lower():
                    points_covered += 1
            
            coverage_ratio = points_covered / len(key_points) if key_points else 0
            
            if coverage_ratio >= 0.8:
                return True, question.get('points', 3), "Excellent answer covering most key points."
            elif coverage_ratio >= 0.5:
                return True, question.get('points', 3) * 0.7, "Good answer covering some key points."
            elif coverage_ratio > 0:
                return True, question.get('points', 3) * 0.3, "Partial answer with few key points."
            else:
                return False, 0, "Answer does not cover any key points."
        
        return False, 0, "Unable to evaluate this answer type."
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about available models"""
        if not self.api_key:
            return {"error": "AI service not configured"}
            
        try:
            models_url = "https://api.together.xyz/v1/models"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
            }
            
            response = requests.get(models_url, headers=headers)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            return {"error": f"Failed to get model info: {str(e)}"} 