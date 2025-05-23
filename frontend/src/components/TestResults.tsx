import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Grid, Paper, Typography, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

// Types
interface QuestionResult {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  explanation: string;
  answer?: {
    id: number;
    is_correct: boolean;
    points_awarded: number;
    feedback: string;
    selected_choice_id?: number;
    text?: string;
  };
  choices?: {
    id: number;
    text: string;
  }[];
}

interface TestResults {
  attempt_id: number;
  test_id: number;
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  started_at: string;
  completed_at: string;
  questions: QuestionResult[];
}

const TestResults: React.FC = () => {
  const navigate = useNavigate();
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  
  // State
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch results data
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/tests/attempts/${attemptId}/complete`);
        setResults(response.data);
      } catch (err: any) {
        console.error('Error fetching test results:', err);
        setError(err.response?.data?.error || 'Failed to load test results. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [attemptId]);
  
  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    // Convert to minutes and seconds
    const minutes = Math.floor(durationMs / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };
  
  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Great';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };
  
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success.main';
    if (percentage >= 70) return 'success.main';
    if (percentage >= 60) return 'warning.main';
    return 'error.main';
  };
  
  // Render question result
  const renderQuestion = (question: QuestionResult, index: number) => {
    const answer = question.answer;
    const isAnswered = !!answer;
    const isCorrect = isAnswered && answer.is_correct;
    
    return (
      <Accordion key={question.id} defaultExpanded={index === 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {isAnswered && (
              <Box sx={{ mr: 1 }}>
                {isCorrect ? (
                  <CorrectIcon color="success" />
                ) : (
                  <IncorrectIcon color="error" />
                )}
              </Box>
            )}
            <Typography sx={{ flex: 1 }}>
              Question {index + 1}: {question.question_text.substring(0, 50)}
              {question.question_text.length > 50 ? '...' : ''}
            </Typography>
            <Box sx={{ ml: 2 }}>
              {isAnswered ? (
                <Chip 
                  label={`${answer.points_awarded}/${question.points} points`}
                  color={answer.points_awarded > 0 ? 'primary' : 'default'}
                  size="small"
                />
              ) : (
                <Chip label="Not answered" color="default" size="small" />
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" gutterBottom>
            {question.question_text}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {/* For MCQ questions, show options */}
          {question.question_type === 'mcq' && question.choices && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Options:
              </Typography>
              <Box sx={{ pl: 2 }}>
                {question.choices.map((choice) => {
                  const isSelected = answer?.selected_choice_id === choice.id;
                  const isCorrectChoice = question.choices?.find(c => 
                    isSelected && answer?.is_correct && c.id === choice.id
                  );
                  
                  return (
                    <Typography 
                      key={choice.id} 
                      variant="body2" 
                      sx={{ 
                        mb: 1,
                        fontWeight: isSelected ? 'bold' : 'normal',
                        color: isSelected ? (isCorrectChoice ? 'success.main' : 'error.main') : 'inherit'
                      }}
                    >
                      {isSelected ? '► ' : ''}
                      {choice.text}
                      {isSelected ? ' (Your answer)' : ''}
                    </Typography>
                  );
                })}
              </Box>
            </Box>
          )}
          
          {/* For short/long answer questions, show the answer */}
          {(question.question_type === 'short_answer' || question.question_type === 'long_answer') && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Your Answer:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="body2">
                  {answer?.text || 'No answer provided'}
                </Typography>
              </Paper>
            </Box>
          )}
          
          {/* Feedback */}
          {answer && (
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="subtitle2" 
                gutterBottom
                color={answer.is_correct ? 'success.main' : 'error.main'}
              >
                Feedback:
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                {answer.feedback || 'No feedback provided'}
              </Typography>
            </Box>
          )}
          
          {/* Explanation */}
          {question.explanation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Explanation:
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                {question.explanation}
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };
  
  // Main render
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Loading results...</Typography>
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
        <Button variant="contained" onClick={() => navigate(`/tests`)}>
          Return to Tests
        </Button>
      </Container>
    );
  }
  
  if (!results) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          No results found for this test attempt.
        </Alert>
        <Button variant="contained" onClick={() => navigate(`/tests`)}>
          Return to Tests
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Results
        </Typography>
        <Button variant="outlined" onClick={() => navigate(`/tests`)}>
          Back to Tests
        </Button>
      </Box>
      
      {/* Results Summary */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              Your Score: {results.percentage.toFixed(1)}%
            </Typography>
            <Typography 
              variant="h6" 
              color={getGradeColor(results.percentage)}
              gutterBottom
            >
              Grade: {getGradeLabel(results.percentage)}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Points: {results.score} out of {results.max_score}
              </Typography>
              <Typography variant="body2">
                Completed: {formatDate(results.completed_at)}
              </Typography>
              <Typography variant="body2">
                Duration: {calculateDuration(results.started_at, results.completed_at)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  mb: 2
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={results.percentage}
                  size={120}
                  thickness={5}
                  color={
                    results.percentage >= 70 ? 'success' :
                    results.percentage >= 60 ? 'warning' : 'error'
                  }
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h5" component="div">
                    {Math.round(results.percentage)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        {results.feedback && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Feedback:
            </Typography>
            <Typography variant="body1">
              {results.feedback}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Question breakdown */}
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ChartIcon sx={{ mr: 1 }} />
        Question Breakdown
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        {results.questions.map((question, index) => renderQuestion(question, index))}
      </Box>
      
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => navigate(`/tests`)}>
          Back to Tests
        </Button>
        <Button variant="contained" onClick={() => navigate(`/tests/${testId}/take`)}>
          Retake Test
        </Button>
      </Box>
    </Container>
  );
};

export default TestResults; 