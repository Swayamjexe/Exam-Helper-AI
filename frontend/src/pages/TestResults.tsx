import React from 'react';
import { Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';

const TestResults: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();

  return (
    <Layout title="Test Results">
      <Box>
        <Typography variant="h4" gutterBottom>
          Test Results
        </Typography>
        <Typography variant="body1">
          Result ID: {resultId}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This page will display your test results and provide feedback on your performance.
        </Typography>
      </Box>
    </Layout>
  );
};

export default TestResults; 