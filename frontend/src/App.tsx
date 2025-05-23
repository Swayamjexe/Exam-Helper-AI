import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MaterialsPage from './pages/MaterialsPage';
import TestsPage from './pages/TestsPage';
import AuthGuard from './components/AuthGuard';
import TestTaker from './components/TestTaker';
import TestResults from './components/TestResults';
import Layout from './components/Layout';
import './App.css';

// Create a custom theme with modern neon colors
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0cffe1', // Neon teal
      contrastText: '#000000',
    },
    secondary: {
      main: '#fb00ff', // Neon purple
      contrastText: '#ffffff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 12px rgba(12, 255, 225, 0.5)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #0cffe1 0%, #00d4ff 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg, #0cffe1 20%, #00d4ff 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(90deg, #fb00ff 0%, #c400ff 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg, #fb00ff 20%, #c400ff 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '12px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <AuthGuard>
              <Layout title="Dashboard">
                <Dashboard />
              </Layout>
            </AuthGuard>
          } />
          <Route path="/materials" element={
            <AuthGuard>
              <Layout title="Study Materials">
                <MaterialsPage />
              </Layout>
            </AuthGuard>
          } />
          <Route path="/tests" element={
            <AuthGuard>
              <Layout title="Tests & Quizzes">
                <TestsPage />
              </Layout>
            </AuthGuard>
          } />
          <Route path="/tests/:testId" element={
            <AuthGuard>
              <Layout title="Test Details">
                <TestsPage />
              </Layout>
            </AuthGuard>
          } />
          <Route path="/tests/:testId/take" element={
            <AuthGuard>
              <TestTaker />
            </AuthGuard>
          } />
          <Route path="/tests/:testId/results/:attemptId" element={
            <AuthGuard>
              <TestResults />
            </AuthGuard>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
