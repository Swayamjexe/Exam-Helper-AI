import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
  Fade,
  IconButton,
  Alert,
  Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ArticleIcon from '@mui/icons-material/Article';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

interface MaterialUploaderProps {
  onUploadSuccess: (material: any) => void;
}

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf', 
  'text/plain', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/markdown'
];

// File type to icon mapping
const FILE_ICONS: Record<string, React.ReactNode> = {
  'application/pdf': <PdfIcon fontSize="large" color="error" />,
  'text/plain': <DescriptionIcon fontSize="large" color="primary" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <ArticleIcon fontSize="large" color="info" />,
  'image/jpeg': <ImageIcon fontSize="large" color="success" />,
  'image/png': <ImageIcon fontSize="large" color="success" />,
  'text/markdown': <DescriptionIcon fontSize="large" color="secondary" />
};

const MaterialUploader: React.FC<MaterialUploaderProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState('notes');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError('');
    
    // Check file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('File type not supported. Please upload PDF, TXT, DOCX, MD, JPG, or PNG files.');
      return;
    }
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(selectedFile);
    
    // Set default title from filename
    if (!title) {
      const fileName = selectedFile.name.split('.');
      fileName.pop(); // Remove extension
      setTitle(fileName.join('.'));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMaterialTypeChange = (e: SelectChangeEvent) => {
    setMaterialType(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title for the material');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('material_type', materialType);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/api/materials',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      onUploadSuccess(response.data.material);
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setMaterialType('notes');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      
      // Display more detailed error information
      let errorMessage = 'Error uploading file. Please try again.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        
        if (err.response.data && err.response.data.message) {
          errorMessage = `Server error: ${err.response.data.message}`;
        } else if (err.response.status === 413) {
          errorMessage = 'File too large for the server to process.';
        } else if (err.response.status === 415) {
          errorMessage = 'Unsupported file format.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error while processing the file. Please check server logs.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError('')}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            backgroundColor: isDragging ? 'rgba(12, 255, 225, 0.05)' : 'transparent',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(12, 255, 225, 0.05)',
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <Box sx={{ mb: 2 }}>
                {FILE_ICONS[file.type] || <DescriptionIcon fontSize="large" color="primary" />}
              </Box>
              <Typography variant="body1" gutterBottom>
                {file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
              <Button
                startIcon={<CloseIcon />}
                color="error"
                size="small"
                sx={{ mt: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                Remove File
              </Button>
            </Box>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag & Drop File
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to browse files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports PDF, TXT, DOCX, MD, JPG, PNG (max 10MB)
              </Typography>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.txt,.docx,.md,.jpg,.jpeg,.png"
          />
        </Box>
      </Box>
      
      <TextField
        fullWidth
        label="Title"
        variant="outlined"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
        disabled={uploading}
        required
      />
      
      <TextField
        fullWidth
        label="Description"
        variant="outlined"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={3}
        sx={{ mb: 2 }}
        disabled={uploading}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="material-type-label">Material Type</InputLabel>
          <Select
            labelId="material-type-label"
            value={materialType}
            label="Material Type"
            onChange={handleMaterialTypeChange}
            disabled={uploading}
          >
            <MenuItem value="notes">Notes</MenuItem>
            <MenuItem value="book">Book</MenuItem>
            <MenuItem value="paper">Paper</MenuItem>
            <MenuItem value="slides">Slides</MenuItem>
            <MenuItem value="article">Article</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Material type helps organize and categorize your content for better searching and test generation">
          <IconButton sx={{ ml: 1 }}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={!file || uploading}
        onClick={handleUpload}
        sx={{
          py: 1.5,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {uploading ? (
          <>
            <CircularProgress
              size={24}
              sx={{
                color: 'white',
                position: 'absolute',
                left: '50%',
                marginLeft: '-12px'
              }}
            />
            <Fade in={uploading}>
              <Typography variant="button" sx={{ visibility: uploading ? 'visible' : 'hidden' }}>
                Uploading...
              </Typography>
            </Fade>
          </>
        ) : (
          'Upload Material'
        )}
      </Button>
    </Paper>
  );
};

export default MaterialUploader; 