import React from 'react';
import { Typography, Box } from '@mui/material';
import Layout from '../components/Layout';

const TestCreation: React.FC = () => {
  return (
    <Layout title="Create Test">
      <Box>
        <Typography variant="h4" gutterBottom>
          Create a New Test
        </Typography>
        <Typography variant="body1">
          This page will allow you to create custom tests based on your study materials.
        </Typography>
      </Box>
    </Layout>
  );
};

export default TestCreation; 