import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Container, Divider, Grid, Paper, Tab, Tabs, 
  Typography, Card, CardContent, CardActions, CircularProgress,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  PlayArrow as StartIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TestCreator from '../components/TestCreator';
import api from '../services/api';

// Types
interface Test {
  id: number;
  title: string;
  description: string;
  test_type: string;
  total_questions: number;
  time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total_tests: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  tests_by_type: Record<string, number>;
  recent_attempts: Array<{
    id: number;
    test_id: number;
    test_title: string;
    score: number;
    max_score: number;
    percentage: number;
    completed_at: string;
  }>;
}

const TestsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [tests, setTests] = useState<Test[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTestId, setDeleteTestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch tests on component mount
  useEffect(() => {
    fetchTests();
    fetchStats();
  }, []);
  
  // Functions
  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tests');
      setTests(response.data.tests || []);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/tests/statistics');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // No need to show error for stats
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleCreateTest = () => {
    setCreating(true);
  };
  
  const handleCancelCreate = () => {
    setCreating(false);
  };
  
  const handleTestCreated = (testId: number) => {
    setCreating(false);
    setSuccess('Test created successfully!');
    fetchTests();
    navigate(`/tests/${testId}`);
  };
  
  const handleDeleteTest = async (testId: number) => {
    try {
      await api.delete(`/api/tests/${testId}`);
      setTests(tests.filter(test => test.id !== testId));
      setSuccess('Test deleted successfully');
      setDeleteTestId(null);
    } catch (err) {
      console.error('Error deleting test:', err);
      setError('Failed to delete test');
    }
  };
  
  const handleStartTest = (testId: number) => {
    navigate(`/tests/${testId}/take`);
  };
  
  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'Multiple Choice';
      case 'short_answer': return 'Short Answer';
      case 'long_answer': return 'Long Answer';
      case 'mixed': return 'Mixed';
      default: return type;
    }
  };
  
  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'mcq': return 'primary';
      case 'short_answer': return 'success';
      case 'long_answer': return 'warning';
      case 'mixed': return 'info';
      default: return 'default';
    }
  };
  
  // JSX for test list
  const renderTestList = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (tests.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" gutterBottom>
            You haven't created any tests yet.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleCreateTest}
            sx={{ mt: 2 }}
          >
            Create Your First Test
          </Button>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {tests.map((test) => (
          <Grid item xs={12} sm={6} md={4} key={test.id}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 2,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom noWrap>
                  {test.title}
                </Typography>
                
                <Chip 
                  label={getTestTypeLabel(test.test_type)} 
                  color={getTestTypeColor(test.test_type) as any}
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {test.description?.substring(0, 100) || 'No description'}
                  {test.description?.length > 100 ? '...' : ''}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Questions: {test.total_questions}
                  </Typography>
                  {test.time_limit_minutes && (
                    <Typography variant="body2" color="text.secondary">
                      Time Limit: {test.time_limit_minutes} minutes
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(test.created_at)}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<StartIcon />} 
                  onClick={() => handleStartTest(test.id)}
                >
                  Take Test
                </Button>
                <Button 
                  size="small"
                  onClick={() => navigate(`/tests/${test.id}`)}
                >
                  View
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => setDeleteTestId(test.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // JSX for statistics
  const renderStatistics = () => {
    if (!stats) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (stats.total_tests === 0) {
      return (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1">
            You haven't taken any tests yet. Complete a test to see your statistics.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" color="primary">{stats.total_tests}</Typography>
              <Typography variant="body2">Tests Taken</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" color="primary">{stats.average_score.toFixed(1)}%</Typography>
              <Typography variant="body2">Average Score</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" color="success.main">{stats.highest_score.toFixed(1)}%</Typography>
              <Typography variant="body2">Highest Score</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" color="error.main">{stats.lowest_score.toFixed(1)}%</Typography>
              <Typography variant="body2">Lowest Score</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Typography variant="h6" gutterBottom>Recent Test Attempts</Typography>
        {stats.recent_attempts.length > 0 ? (
          <Grid container spacing={2}>
            {stats.recent_attempts.map((attempt) => (
              <Grid item xs={12} key={attempt.id}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle1">{attempt.test_title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed on {formatDate(attempt.completed_at)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography 
                        variant="h6" 
                        color={attempt.percentage >= 70 ? 'success.main' : attempt.percentage >= 50 ? 'warning.main' : 'error.main'}
                      >
                        {attempt.percentage.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        {attempt.score} / {attempt.max_score} points
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      size="small" 
                      onClick={() => navigate(`/tests/${attempt.test_id}/results/${attempt.id}`)}
                    >
                      View Results
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2">No recent tests taken.</Typography>
        )}
      </Box>
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tests & Quizzes
        </Typography>
        
        {activeTab === 0 && !creating && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleCreateTest}
          >
            Create Test
          </Button>
        )}
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="My Tests" />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>
      
      {/* Content based on active tab */}
      {activeTab === 0 ? (
        creating ? (
          <>
            <Box sx={{ mb: 2 }}>
              <Button onClick={handleCancelCreate}>← Back to Tests</Button>
            </Box>
            <TestCreator onTestCreated={handleTestCreated} />
          </>
        ) : (
          renderTestList()
        )
      ) : (
        renderStatistics()
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTestId !== null} onClose={() => setDeleteTestId(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this test? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTestId(null)}>Cancel</Button>
          <Button 
            color="error" 
            onClick={() => deleteTestId && handleDeleteTest(deleteTestId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TestsPage; 