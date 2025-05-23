import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Alert,
  TextField,
  InputAdornment,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import BookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import ChapterIcon from '@mui/icons-material/FormatListNumbered';
import TopicIcon from '@mui/icons-material/Topic';
import PageIcon from '@mui/icons-material/Pages';
import CommentIcon from '@mui/icons-material/Comment';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import axios from 'axios';

interface Chapter {
  title: string;
  level: number;
  position: number;
}

interface MaterialViewerProps {
  materialId: number;
  onClose: () => void;
}

const MaterialViewer: React.FC<MaterialViewerProps> = ({ materialId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [contentChunks, setContentChunks] = useState<string[]>([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const CHUNK_SIZE = 5000; // Characters per chunk

  // Fetch material content on mount
  useEffect(() => {
    fetchMaterialContent();
  }, [materialId]);

  // Split content into chunks when content changes
  useEffect(() => {
    if (content) {
      const chunks = [];
      for (let i = 0; i < content.length; i += CHUNK_SIZE) {
        chunks.push(content.slice(i, i + CHUNK_SIZE));
      }
      setContentChunks(chunks);
      setCurrentChunk(0);
    }
  }, [content]);

  const fetchMaterialContent = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/materials/${materialId}/content`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setContent(response.data.content || '');
      setMetadata(response.data.metadata || {});
      
    } catch (err: any) {
      console.error('Error fetching material content:', err);
      setError(err.response?.data?.message || 'Failed to load material content');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || metadata.embedding_status !== 'completed') {
      return;
    }
    
    try {
      setSearching(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/materials/${materialId}/search`,
        {
          params: { query: searchQuery },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setSearchResults(response.data.results || []);
      setTabValue(1); // Switch to search tab
      
    } catch (err: any) {
      console.error('Error searching content:', err);
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/materials/${materialId}/file`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Use the original title with the file extension
      const fileExtension = metadata.file_type || '';
      link.setAttribute('download', `${metadata.title || 'document'}.${fileExtension}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderMetadataTable = () => (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
      <Table size="small">
        <TableBody>
          {metadata.title && (
            <TableRow>
              <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BookIcon fontSize="small" sx={{ mr: 1 }} />
                  Title
                </Box>
              </TableCell>
              <TableCell>{metadata.title}</TableCell>
            </TableRow>
          )}
          
          {metadata.author && (
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                  Author
                </Box>
              </TableCell>
              <TableCell>{metadata.author}</TableCell>
            </TableRow>
          )}
          
          {metadata.publication_date && (
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                  Publication Date
                </Box>
              </TableCell>
              <TableCell>{metadata.publication_date}</TableCell>
            </TableRow>
          )}
          
          {metadata.page_count > 0 && (
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PageIcon fontSize="small" sx={{ mr: 1 }} />
                  Pages
                </Box>
              </TableCell>
              <TableCell>{metadata.page_count}</TableCell>
            </TableRow>
          )}
          
          {metadata.word_count > 0 && (
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextSnippetIcon fontSize="small" sx={{ mr: 1 }} />
                  Word Count
                </Box>
              </TableCell>
              <TableCell>{metadata.word_count.toLocaleString()}</TableCell>
            </TableRow>
          )}
          
          <TableRow>
            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CategoryIcon fontSize="small" sx={{ mr: 1 }} />
                Material Type
              </Box>
            </TableCell>
            <TableCell sx={{ textTransform: 'capitalize' }}>{metadata.material_type || 'Unknown'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTopics = () => {
    if (!metadata.topics || metadata.topics.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
          No topics identified
        </Typography>
      );
    }
    
    return (
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TopicIcon fontSize="small" sx={{ mr: 1 }} />
            Key Topics
          </Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {metadata.topics.map((topic: string, index: number) => (
            <Chip 
              key={index} 
              label={topic} 
              variant="outlined" 
              size="small"
              color="primary"
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  const renderChapters = () => {
    if (!metadata.chapters || metadata.chapters.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
          No chapters identified
        </Typography>
      );
    }
    
    return (
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ChapterIcon fontSize="small" sx={{ mr: 1 }} />
            Chapters
          </Box>
        </Typography>
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {metadata.chapters.map((chapter: Chapter, index: number) => (
            <ListItem key={index}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CommentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={chapter.title}
                secondary={`Level ${chapter.level}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderContentChunk = () => {
    if (!contentChunks.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No content available
        </Typography>
      );
    }

    return (
      <Box>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 2, 
            maxHeight: '500px', 
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.6
          }}
        >
          {contentChunks[currentChunk]}
        </Paper>
        
        {contentChunks.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              disabled={currentChunk === 0} 
              onClick={() => setCurrentChunk(prev => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <Typography variant="body2">
              Page {currentChunk + 1} of {contentChunks.length}
            </Typography>
            <Button 
              disabled={currentChunk === contentChunks.length - 1} 
              onClick={() => setCurrentChunk(prev => Math.min(contentChunks.length - 1, prev + 1))}
            >
              Next
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          {searchQuery ? 'No results found. Try a different search term.' : 'Enter a search term to find relevant content.'}
        </Typography>
      );
    }

    return (
      <Box>
        {searchResults.map((result, index) => (
          <Paper 
            key={index} 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderLeft: '4px solid',
              borderLeftColor: 'primary.main',
            }}
          >
            <Typography 
              variant="body2" 
              component="pre" 
              sx={{ 
                whiteSpace: 'pre-wrap', 
                mb: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.6 
              }}
            >
              {result.text}
            </Typography>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="caption" color="text.secondary">
              Relevance: {(result.relevance_score * 100).toFixed(0)}%
              {result.metadata.chapter && (
                <> | Chapter: {result.metadata.chapter}</>
              )}
              {result.metadata.section && (
                <> | Section: {result.metadata.section}</>
              )}
            </Typography>
          </Paper>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="600">
          {loading ? <Skeleton width={200} /> : metadata.title || 'Material View'}
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mr: 1 }}
          >
            Download
          </Button>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            {renderMetadataTable()}
            
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Search in Document"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={metadata.embedding_status !== 'completed'}
                placeholder={metadata.embedding_status !== 'completed' ? 
                  'Document not processed for search yet' : 
                  'Search for concepts or topics...'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {searching ? (
                        <CircularProgress size={24} />
                      ) : (
                        <IconButton
                          onClick={handleSearch}
                          disabled={!searchQuery.trim() || metadata.embedding_status !== 'completed'}
                        >
                          <SearchIcon />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim() && metadata.embedding_status === 'completed') {
                    handleSearch();
                  }
                }}
              />
              {metadata.embedding_status !== 'completed' && (
                <Typography variant="caption" color="text.secondary">
                  Document processing: {metadata.embedding_status}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab label="Content" />
                <Tab label="Search Results" disabled={searchResults.length === 0} />
                <Tab label="Topics & Chapters" />
              </Tabs>
            </Box>
            
            <Box hidden={tabValue !== 0}>
              {renderContentChunk()}
            </Box>
            
            <Box hidden={tabValue !== 1}>
              {renderSearchResults()}
            </Box>
            
            <Box hidden={tabValue !== 2}>
              {renderTopics()}
              {renderChapters()}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default MaterialViewer; 