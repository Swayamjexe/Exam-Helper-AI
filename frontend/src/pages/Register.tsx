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
import PersonIcon from '@mui/icons-material/Person';
import { AuthContext } from '../context/AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  // Username validation function
  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };
  
  // Handle username change with validation
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    if (newUsername && !validateUsername(newUsername)) {
      setUsernameError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
    } else {
      setUsernameError('');
    }
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Password validation function
  const validatePassword = (password: string) => {
    // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  };

  // Handle password change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    if (newPassword && !validatePassword(newPassword)) {
      setPasswordError('Password must be at least 6 characters and include uppercase, lowercase, and numbers');
    } else {
      setPasswordError('');
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username
    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password strength
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters and include uppercase, lowercase, and numbers');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
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
        background: 'radial-gradient(circle at top right, rgba(251, 0, 255, 0.1), transparent 40%)',
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
              Create an Account
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sign up to start improving your exam preparation
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
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={handleUsernameChange}
              error={!!usernameError}
              helperText={usernameError}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
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
              value={password}
              onChange={handlePasswordChange}
              error={!!passwordError}
              helperText={passwordError}
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={password !== confirmPassword && confirmPassword.length > 0}
              helperText={
                password !== confirmPassword && confirmPassword.length > 0 
                  ? "Passwords don't match" 
                  : ""
              }
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
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
              {loading ? 'Creating Account...' : 'Register'}
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid sx={{ display: 'block' }}>
                <Link component={RouterLink} to="/login" variant="body2" color="primary">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register; 