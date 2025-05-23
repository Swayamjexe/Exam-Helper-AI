import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthContext } from '../context/AuthContext';

type AuthGuardProps = {
  children: React.ReactNode;
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#121212',
        }}
      >
        <CircularProgress 
          color="primary" 
          sx={{ 
            '& .MuiCircularProgress-circle': {
              stroke: 'url(#gradient)'
            }
          }} 
        />
        <svg width="0" height="0">
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0cffe1" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
        </svg>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard; 