import React, { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { AuthContext } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        background: 'radial-gradient(circle at top right, rgba(12, 255, 225, 0.1), transparent 40%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #0cffe1 20%, #fb00ff 80%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Exam Helper
            </Typography>
            <Typography variant="h5" color="textSecondary" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Log in to your account to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 3,
                py: 1.5,
                fontWeight: 600,
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '200%',
                  height: '100%',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'all 0.5s ease',
                },
                '&:hover::after': {
                  left: '100%',
                },
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Grid container>
              <Grid sx={{ flex: 1 }}>
                <Link href="#" variant="body2" color="primary">
                  Forgot password?
                </Link>
              </Grid>
              <Grid>
                <Link component={RouterLink} to="/register" variant="body2" color="primary">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 