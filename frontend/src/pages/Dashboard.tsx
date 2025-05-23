import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Divider,
  useTheme,
  Container,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';
import QuizIcon from '@mui/icons-material/Quiz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // These would come from API calls in a real app
  const stats = {
    materials: 0,
    tests: 0,
    completedTests: 0,
    averageScore: 0,
  };

  // Fix the type definition for the StatCard component
  interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactElement;
    color: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: color,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: `${color}20`, // 20% opacity
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color, // Set the color on the container instead
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" fontWeight="600">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    // <Layout title="Dashboard">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="600" mb={3}>
            Welcome back, {user?.username || 'User'}
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Study Materials"
                value={stats.materials}
                icon={<BookIcon />}
                color="#0cffe1"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Tests"
                value={stats.tests}
                icon={<QuizIcon />}
                color="#fb00ff"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed Tests"
                value={stats.completedTests}
                icon={<AssessmentIcon />}
                color="#00d4ff"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Average Score"
                value={`${stats.averageScore}%`}
                icon={<AssessmentIcon />}
                color="#c400ff"
              />
            </Grid>
          </Grid>

          <Paper
            sx={{
              p: 3,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              mb: 4,
            }}
          >
            <Typography variant="h5" fontWeight="600" mb={2}>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/materials')}
                  sx={{
                    py: 2,
                    borderRadius: '8px',
                    fontWeight: 500,
                  }}
                >
                  Add Materials
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<QuizIcon />}
                  onClick={() => navigate('/tests/create')}
                  sx={{
                    py: 2,
                    borderRadius: '8px',
                    fontWeight: 500,
                  }}
                >
                  Create Test
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper
            sx={{
              p: 3,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              mb: 2,
            }}
          >
            <Typography variant="h5" fontWeight="600" mb={3}>
              Getting Started
            </Typography>
            <Box>
              <Typography variant="subtitle1" fontWeight="500" color="primary">
                1. Upload your study materials
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Start by uploading your reference books, notes, and previous year question papers.
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" fontWeight="500" color="primary">
                2. Create a custom test
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Generate a test based on your uploaded materials to check your understanding.
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" fontWeight="500" color="primary">
                3. Review your performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get detailed feedback on your strengths and weaknesses to improve your exam preparation.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    // </Layout>
  );
};

export default Dashboard; 