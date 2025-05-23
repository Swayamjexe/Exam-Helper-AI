import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container,
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

interface Test {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  time_limit_minutes: number | null;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options?: { id: number; text: string }[];
}

const TakeTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testId) {
      fetchTest(parseInt(testId));
    }
  }, [testId]);

  const fetchTest = async (id: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tests/${id}`);
      setTest(response.data);
    } catch (err) {
      console.error('Error fetching test:', err);
      setError('Failed to load test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={test?.title || 'Take Test'}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
            <CircularProgress size={48} />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h5" color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/tests')}
              sx={{ mt: 2 }}
            >
              Back to Tests
            </Button>
          </Paper>
        ) : test ? (
          <Box>
            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h4" gutterBottom>
                {test.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {test.description}
              </Typography>
              {test.time_limit_minutes && (
                <Typography variant="subtitle2">
                  Time Limit: {test.time_limit_minutes} minutes
                </Typography>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h5" gutterBottom>
                Questions will appear here
              </Typography>
              <Typography variant="body1">
                This component will be implemented to display and navigate through test questions.
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Test not found
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/tests')}
              sx={{ mt: 2 }}
            >
              Back to Tests
            </Button>
          </Paper>
        )}
      </Container>
    </Layout>
  );
};

export default TakeTest; 