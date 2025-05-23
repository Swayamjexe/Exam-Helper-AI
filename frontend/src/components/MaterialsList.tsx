import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  CircularProgress,
  LinearProgress,
  InputAdornment,
  Badge,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ArticleIcon from '@mui/icons-material/Article';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookIcon from '@mui/icons-material/Book';
import NotesIcon from '@mui/icons-material/Notes';
import PaperIcon from '@mui/icons-material/FileCopy';
import SlidesIcon from '@mui/icons-material/Slideshow';
import ArticleTextIcon from '@mui/icons-material/Feed';
import axios from 'axios';
import { format, isValid } from 'date-fns';

interface Material {
  id: number;
  title: string;
  description: string;
  material_type: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  embedding_status: string;
  author?: string;
  page_count?: number;
  word_count?: number;
  topics?: string[];
  chapters?: Array<{ title: string; level: number; position: number }>;
  error_message?: string;
}

interface MaterialsListProps {
  materials: Material[];
  onDelete: (id: number) => void;
  onRefreshStatus: (id: number) => void;
  onViewContent: (material: Material) => void;
}

// A helper function to safely format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  if (!isValid(date)) return 'Unknown date';
  
  try {
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

const MaterialsList: React.FC<MaterialsListProps> = ({
  materials,
  onDelete,
  onRefreshStatus,
  onViewContent
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, materialId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedMaterialId(materialId);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMaterialId(null);
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string, materialType: string) => {
    switch (fileType) {
      case 'pdf':
        return <PdfIcon fontSize="large" />;
      case 'txt':
      case 'md':
        return <DescriptionIcon fontSize="large" />;
      case 'docx':
        return <ArticleIcon fontSize="large" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon fontSize="large" />;
      default:
        // If file type is unknown, fallback to material type
        switch (materialType) {
          case 'book':
            return <BookIcon fontSize="large" />;
          case 'notes':
            return <NotesIcon fontSize="large" />;
          case 'paper':
            return <PaperIcon fontSize="large" />;
          case 'slides':
            return <SlidesIcon fontSize="large" />;
          case 'article':
            return <ArticleTextIcon fontSize="large" />;
          default:
            return <DescriptionIcon fontSize="large" />;
        }
    }
  };

  // Get color based on material type
  const getMaterialColor = (materialType: string) => {
    switch (materialType) {
      case 'book':
        return theme.palette.primary.main;
      case 'notes':
        return theme.palette.secondary.main;
      case 'paper':
        return theme.palette.info.main;
      case 'slides':
        return theme.palette.success.main;
      case 'article':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Filter materials based on search query and filter
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          material.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') {
      return matchesSearch;
    }
    
    return matchesSearch && material.material_type === filter;
  });

  // Download file
  const downloadFile = async (materialId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/materials/${materialId}/file`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Find the material to get the title
      const material = materials.find(m => m.id === materialId);
      if (!material) return;
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Use the original title with the file extension
      const fileExtension = material.file_type;
      link.setAttribute('download', `${material.title}.${fileExtension}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Get progress indicator based on embedding status
  const getProgressIndicator = (status: string, errorMessage?: string) => {
    switch (status) {
      case 'pending':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Waiting to process
            </Typography>
          </Box>
        );
      case 'processing':
        return (
          <Box sx={{ width: '100%' }}>
            <LinearProgress color="primary" />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Processing...
            </Typography>
          </Box>
        );
      case 'completed':
        return (
          <Chip
            label="Ready"
            size="small"
            color="success"
            variant="outlined"
          />
        );
      case 'failed':
        return (
          <Tooltip title={errorMessage || "Unknown error"} arrow>
            <Chip
              label="Processing Failed"
              size="small"
              color="error"
              variant="outlined"
            />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label="All"
            color={filter === 'all' ? 'primary' : 'default'}
            onClick={() => setFilter('all')}
            clickable
          />
          <Chip
            label="Notes"
            color={filter === 'notes' ? 'primary' : 'default'}
            onClick={() => setFilter('notes')}
            clickable
          />
          <Chip
            label="Books"
            color={filter === 'book' ? 'primary' : 'default'}
            onClick={() => setFilter('book')}
            clickable
          />
          <Chip
            label="Papers"
            color={filter === 'paper' ? 'primary' : 'default'}
            onClick={() => setFilter('paper')}
            clickable
          />
        </Box>
      </Box>

      {filteredMaterials.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery || filter !== 'all' ? 'No materials match your search' : 'No materials uploaded yet'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredMaterials.map((material) => (
            <Grid key={material.id} item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: getMaterialColor(material.material_type),
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Badge 
                        color={material.embedding_status === 'completed' ? 'success' : 'default'}
                        variant="dot"
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Box sx={{ 
                          color: getMaterialColor(material.material_type),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {getFileIcon(material.file_type, material.material_type)}
                        </Box>
                      </Badge>
                      <Chip 
                        label={material.material_type} 
                        size="small" 
                        sx={{ ml: 1 }} 
                        variant="outlined"
                      />
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, material.id)}
                      aria-label="more options"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {material.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}
                  >
                    {material.description || 'No description provided'}
                  </Typography>

                  <Box sx={{ mb: 1 }}>
                    {getProgressIndicator(material.embedding_status, material.error_message)}
                  </Box>

                  {material.embedding_status === 'completed' && (
                    <Box sx={{ mt: 2 }}>
                      {material.word_count && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {material.word_count.toLocaleString()} words
                        </Typography>
                      )}
                      {material.page_count && material.page_count > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {material.page_count} pages
                        </Typography>
                      )}
                      {material.author && (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                          By {material.author}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                    Uploaded on {formatDate(material.created_at)}
                  </Typography>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ p: 1, pt: 1, justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    startIcon={<VisibilityIcon />}
                    onClick={() => onViewContent(material)}
                  >
                    View
                  </Button>
                  
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadFile(material.id)}
                  >
                    Download
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 180 }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (selectedMaterialId) {
              const material = materials.find(m => m.id === selectedMaterialId);
              if (material) {
                onViewContent(material);
              }
            }
            handleMenuClose();
          }}
        >
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Content
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (selectedMaterialId) {
              downloadFile(selectedMaterialId);
            }
            handleMenuClose();
          }}
        >
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (selectedMaterialId) {
              onRefreshStatus(selectedMaterialId);
            }
            handleMenuClose();
          }}
          disabled={!selectedMaterialId || materials.find(m => m.id === selectedMaterialId)?.embedding_status === 'processing'}
        >
          <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
          Reprocess
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => {
            if (selectedMaterialId) {
              onDelete(selectedMaterialId);
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MaterialsList; 