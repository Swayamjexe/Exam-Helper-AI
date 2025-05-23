import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress,
  Container, FormControl, FormControlLabel, FormHelperText,
  LinearProgress, Paper, Radio, RadioGroup, TextField,
  Typography, Stepper, Step, StepLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle as CheckIcon, Timer as TimerIcon } from '@mui/icons-material';
import api from '../services/api';

// Types
interface Question {
  id: number;
  question_text: string;
  question_type: string;
  explanation?: string;
  points: number;
  choices?: Array<{
    id: number;
    text: string;
  }>;
}

interface TestData {
  id: number;
  title: string;
  description: string;
  test_type: string;
  time_limit_minutes: number | null;
  questions: Question[];
}

interface UserAnswer {
  question_id: number;
  answer_text?: string;
  selected_choice_id?: number;
}

const TestTaker: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  
  // State
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  // Load test data and start an attempt
  useEffect(() => {
    const fetchTestAndStartAttempt = async () => {
      try {
        setLoading(true);
        
        // Fetch test data
        const testResponse = await api.get(`/api/tests/${testId}`);
        setTest(testResponse.data);
        
        // Start a new attempt
        const attemptResponse = await api.post(`/api/tests/${testId}/attempt`);
        setAttemptId(attemptResponse.data.attempt_id);
        
        // Set timer if test has a time limit
        if (testResponse.data.time_limit_minutes) {
          setTimeRemaining(testResponse.data.time_limit_minutes * 60);
        }
        
      } catch (err: any) {
        console.error('Error starting test:', err);
        setError(err.response?.data?.error || 'Failed to load test. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestAndStartAttempt();
  }, [testId]);
  
  // Timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || loading) return;
    
    // Show warning when 20% of time is left
    if (test?.time_limit_minutes && 
        timeRemaining <= test.time_limit_minutes * 60 * 0.2 && 
        !showTimeWarning) {
      setShowTimeWarning(true);
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up, submit automatically
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, loading]);
  
  // Format time display
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle navigation between questions
  const handleNext = () => {
    if (test && activeStep < test.questions.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };
  
  // Handle answer changes
  const handleAnswerChange = (questionId: number, answerData: Partial<UserAnswer>) => {
    setUserAnswers(prev => {
      const currentAnswer = prev[questionId] || { question_id: questionId };
      return {
        ...prev,
        [questionId]: {
          ...currentAnswer,
          ...answerData
        }
      };
    });
  };
  
  // Submit an individual answer
  const handleSubmitAnswer = async (questionId: number) => {
    if (!attemptId || !userAnswers[questionId]) return;
    
    try {
      const answer = userAnswers[questionId];
      await api.post(`/api/tests/attempts/${attemptId}/submit`, answer);
      // For MCQ we could show immediate feedback here if desired
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Not showing errors for individual answers to avoid disruption
    }
  };
  
  // Submit the entire test
  const handleSubmitTest = async () => {
    if (!attemptId || submitting) return;
    
    try {
      setSubmitting(true);
      
      // Submit any remaining answers
      const currentQuestion = test?.questions[activeStep];
      if (currentQuestion && userAnswers[currentQuestion.id]) {
        await handleSubmitAnswer(currentQuestion.id);
      }
      
      // Complete the test attempt
      const response = await api.post(`/api/tests/attempts/${attemptId}/complete`);
      
      // Navigate to results page
      navigate(`/tests/${testId}/results/${attemptId}`);
      
    } catch (err: any) {
      console.error('Error completing test:', err);
      setError(err.response?.data?.error || 'Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Render current question
  const renderQuestion = () => {
    if (!test || activeStep >= test.questions.length) return null;
    
    const question = test.questions[activeStep];
    const userAnswer = userAnswers[question.id] || { question_id: question.id };
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Question {activeStep + 1} of {test.questions.length} 
            {question.points > 1 ? ` • ${question.points} points` : ''}
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            {question.question_text}
          </Typography>
          
          {/* Multiple choice question */}
          {question.question_type === 'mcq' && question.choices && (
            <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
              <RadioGroup
                value={userAnswer.selected_choice_id || ''}
                onChange={(e) => handleAnswerChange(question.id, { 
                  selected_choice_id: Number(e.target.value) 
                })}
              >
                {question.choices.map((choice) => (
                  <FormControlLabel
                    key={choice.id}
                    value={choice.id}
                    control={<Radio />}
                    label={choice.text}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
          
          {/* Short answer question */}
          {question.question_type === 'short_answer' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Enter your answer here..."
              value={userAnswer.answer_text || ''}
              onChange={(e) => handleAnswerChange(question.id, { 
                answer_text: e.target.value 
              })}
              sx={{ mt: 2 }}
            />
          )}
          
          {/* Long answer question */}
          {question.question_type === 'long_answer' && (
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Enter your detailed answer here..."
              value={userAnswer.answer_text || ''}
              onChange={(e) => handleAnswerChange(question.id, { 
                answer_text: e.target.value 
              })}
              sx={{ mt: 2 }}
            />
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Render the progress indicator
  const renderProgress = () => {
    if (!test) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">
            Progress: {activeStep + 1} / {test.questions.length} questions
          </Typography>
          
          {timeRemaining !== null && (
            <Typography 
              variant="body2" 
              color={timeRemaining < 300 ? 'error.main' : 'text.primary'}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <TimerIcon fontSize="small" sx={{ mr: 0.5 }} />
              Time left: {formatTime(timeRemaining)}
            </Typography>
          )}
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (test.questions.length - 1)) * 100} 
        />
      </Box>
    );
  };
  
  // Render test information
  const renderTestInfo = () => {
    if (!test) return null;
    
    return (
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {test.title}
        </Typography>
        {test.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {test.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">
            Questions: {test.questions.length}
          </Typography>
          {test.time_limit_minutes && (
            <Typography variant="body2">
              Time Limit: {test.time_limit_minutes} minutes
            </Typography>
          )}
        </Box>
      </Paper>
    );
  };
  
  // Calculate if the current question has been answered
  const isCurrentQuestionAnswered = (): boolean => {
    if (!test) return false;
    
    const question = test.questions[activeStep];
    if (!question) return false;
    
    const answer = userAnswers[question.id];
    if (!answer) return false;
    
    if (question.question_type === 'mcq') {
      return answer.selected_choice_id !== undefined;
    } else {
      return !!answer.answer_text?.trim();
    }
  };
  
  // Main render
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Loading test...</Typography>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/tests')}>
          Return to Tests
        </Button>
      </Container>
    );
  }
  
  if (!test) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Test not found.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/tests')}>
          Return to Tests
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Test info and progress */}
      {renderTestInfo()}
      {renderProgress()}
      
      {/* Current question */}
      {renderQuestion()}
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={handleBack} 
          disabled={activeStep === 0 || submitting}
        >
          Previous
        </Button>
        
        <Box>
          {activeStep < test.questions.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={() => {
                if (isCurrentQuestionAnswered()) {
                  handleSubmitAnswer(test.questions[activeStep].id);
                }
                handleNext();
              }}
              disabled={submitting}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
              startIcon={<CheckIcon />}
            >
              {submitting ? <CircularProgress size={24} /> : 'Finish Test'}
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Confirmation dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Submit Test</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to submit this test?
          </Typography>
          
          {Object.keys(userAnswers).length < test.questions.length && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You have only answered {Object.keys(userAnswers).length} out of {test.questions.length} questions.
            </Alert>
          )}
          
          <Typography variant="body2">
            Once submitted, you won't be able to change your answers.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitTest} 
            color="primary" 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Submit Test'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Time warning */}
      <Snackbar
        open={showTimeWarning}
        autoHideDuration={6000}
        onClose={() => setShowTimeWarning(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowTimeWarning(false)} severity="warning">
          Less than {Math.ceil((test.time_limit_minutes || 0) * 0.2)} minutes remaining!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TestTaker; 