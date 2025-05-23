import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Card, CardContent, Checkbox, 
  CircularProgress, Container, FormControl, FormControlLabel, 
  FormGroup, FormHelperText, FormLabel, Grid, 
  InputLabel, MenuItem, Paper, Radio, RadioGroup, 
  Select, TextField, Typography, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Types for the component
interface Material {
  id: number;
  title: string;
  description: string;
  material_type: string;
  fileName: string;
}

interface TestSettings {
  difficulty: string;
  num_questions: number;
  time_limit_minutes: number | null;
  instructions: string;
}

const DEFAULT_SETTINGS: TestSettings = {
  difficulty: 'medium',
  num_questions: 5,
  time_limit_minutes: null,
  instructions: '',
};

interface TestCreatorProps {
  onTestCreated?: (testId: number) => void;
}

const TestCreator: React.FC<TestCreatorProps> = ({ onTestCreated }) => {
  const navigate = useNavigate();
  
  // Component state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Test details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [testType, setTestType] = useState('mcq');
  const [settings, setSettings] = useState<TestSettings>(DEFAULT_SETTINGS);
  
  // Error validation
  const [titleError, setTitleError] = useState(false);
  const [materialError, setMaterialError] = useState(false);
  
  // Fetch materials on component mount
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/materials');
        setMaterials(response.data.materials || []);
      } catch (err) {
        console.error('Error fetching materials:', err);
        setError('Failed to load materials. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, []);
  
  // Handle material selection
  const handleMaterialToggle = (materialId: number) => {
    setSelectedMaterials(prevSelected => {
      if (prevSelected.includes(materialId)) {
        return prevSelected.filter(id => id !== materialId);
      } else {
        return [...prevSelected, materialId];
      }
    });
    setMaterialError(false);
  };
  
  // Handle settings changes
  const handleSettingsChange = (field: keyof TestSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    let hasError = false;
    
    if (!title.trim()) {
      setTitleError(true);
      hasError = true;
    }
    
    if (selectedMaterials.length === 0) {
      setMaterialError(true);
      hasError = true;
    }
    
    if (hasError) {
      setError('Please fix the errors in the form.');
      return;
    }
    
    // Submit the test
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await api.post('/api/tests/generate', {
        title,
        description,
        test_type: testType,
        material_ids: selectedMaterials,
        settings,
      });
      
      setSuccess('Test created successfully! Generating questions...');
      
      // Call the callback if provided
      if (onTestCreated && response.data.id) {
        onTestCreated(response.data.id);
      } else {
        // Navigate to the test page after a short delay
        setTimeout(() => {
          navigate(`/tests/${response.data.id}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating test:', err);
      setError(err.response?.data?.error || 'Failed to create test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Test
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Test Basic Information */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="test-title"
                label="Test Title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError(false);
                }}
                error={titleError}
                helperText={titleError ? 'Title is required' : ''}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="test-description"
                label="Description"
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </Grid>
          </Grid>
          
          {/* Test Type Selection */}
          <Box sx={{ mb: 4 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Test Type</FormLabel>
              <RadioGroup
                row
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
              >
                <FormControlLabel 
                  value="mcq" 
                  control={<Radio disabled={submitting} />} 
                  label="Multiple Choice" 
                />
                <FormControlLabel 
                  value="short_answer" 
                  control={<Radio disabled={submitting} />} 
                  label="Short Answer" 
                />
                <FormControlLabel 
                  value="long_answer" 
                  control={<Radio disabled={submitting} />} 
                  label="Long Answer" 
                />
                <FormControlLabel 
                  value="mixed" 
                  control={<Radio disabled={submitting} />} 
                  label="Mixed" 
                />
              </RadioGroup>
              <FormHelperText>
                {testType === 'mcq' && 'Creates a test with multiple-choice questions.'}
                {testType === 'short_answer' && 'Creates a test with short-answer questions requiring brief responses.'}
                {testType === 'long_answer' && 'Creates a test with essay-style questions requiring detailed responses.'}
                {testType === 'mixed' && 'Creates a test with a mix of different question types.'}
              </FormHelperText>
            </FormControl>
          </Box>
          
          {/* Materials Selection */}
          <Box sx={{ mb: 4 }}>
            <FormControl 
              component="fieldset" 
              error={materialError}
              sx={{ width: '100%' }}
            >
              <FormLabel component="legend">Select Materials</FormLabel>
              <FormHelperText error={materialError}>
                {materialError ? 'Please select at least one material' : 'Select materials to generate questions from'}
              </FormHelperText>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              ) : materials.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No materials available. Please upload materials first.
                </Alert>
              ) : (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {materials.map((material) => (
                    <Grid item xs={12} sm={6} md={4} key={material.id}>
                      <Card 
                        variant="outlined"
                        sx={{
                          border: selectedMaterials.includes(material.id) 
                            ? '2px solid #1976d2' 
                            : '1px solid #e0e0e0',
                          cursor: 'pointer',
                          height: '100%'
                        }}
                        onClick={() => handleMaterialToggle(material.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Checkbox
                              checked={selectedMaterials.includes(material.id)}
                              onChange={() => handleMaterialToggle(material.id)}
                              disabled={submitting}
                            />
                            <Box>
                              <Typography variant="subtitle1" component="div">
                                {material.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {material.description?.substring(0, 60)}
                                {material.description?.length > 60 ? '...' : ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {material.material_type || 'Type: Unknown'} | {material.fileName}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </FormControl>
          </Box>
          
          {/* Advanced Settings */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Advanced Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="difficulty-label">Difficulty</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    id="difficulty"
                    value={settings.difficulty}
                    label="Difficulty"
                    onChange={(e) => handleSettingsChange('difficulty', e.target.value)}
                    disabled={submitting}
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="num-questions"
                  label="Number of Questions"
                  type="number"
                  InputProps={{ inputProps: { min: 1, max: 20 } }}
                  value={settings.num_questions}
                  onChange={(e) => handleSettingsChange('num_questions', parseInt(e.target.value) || 5)}
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="time-limit"
                  label="Time Limit (minutes, optional)"
                  type="number"
                  InputProps={{ inputProps: { min: 5 } }}
                  value={settings.time_limit_minutes || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : null;
                    handleSettingsChange('time_limit_minutes', value);
                  }}
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="instructions"
                  label="Special Instructions for AI (optional)"
                  multiline
                  rows={2}
                  placeholder="e.g., Focus on specific topics, include diagrams, etc."
                  value={settings.instructions}
                  onChange={(e) => handleSettingsChange('instructions', e.target.value)}
                  disabled={submitting}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={submitting || loading || materials.length === 0}
              sx={{ minWidth: 150 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Create Test'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Error/Success Messages */}
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

export default TestCreator; 