import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Dialog,
  DialogContent,
  IconButton,
  Fab,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  Divider 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import Layout from '../components/Layout';
import MaterialUploader from '../components/MaterialUploader';
import MaterialsList from '../components/MaterialsList';
import MaterialViewer from '../components/MaterialViewer';

interface Material {
  id: number;
  title: string;
  description: string;
  material_type: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  embedding_status: string;
  [key: string]: any;
}

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Fetch materials on component mount
  useEffect(() => {
    fetchMaterials();
  }, []);
  
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMaterials(response.data.materials || []);
      
    } catch (err) {
      console.error('Error fetching materials:', err);
      showSnackbar('Failed to load materials', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUploadSuccess = (material: Material) => {
    setUploaderOpen(false);
    setMaterials(prev => [material, ...prev]);
    showSnackbar('Material uploaded successfully!', 'success');
  };
  
  const handleDeleteMaterial = async (id: number) => {
    try {
      setDeleteLoading(true);
      
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/materials/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMaterials(prev => prev.filter(material => material.id !== id));
      
      // If the current selected material is being deleted, close the viewer
      if (selectedMaterial && selectedMaterial.id === id) {
        setViewerOpen(false);
        setSelectedMaterial(null);
      }
      
      showSnackbar('Material deleted successfully', 'success');
      
    } catch (err) {
      console.error('Error deleting material:', err);
      showSnackbar('Failed to delete material', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleRefreshStatus = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/materials/${id}/process`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update material status
      setMaterials(prev => prev.map(material => 
        material.id === id 
          ? { ...material, embedding_status: 'pending' }
          : material
      ));
      
      showSnackbar('Reprocessing started', 'success');
      
      // If this is the currently selected material, refresh it in the viewer
      if (selectedMaterial && selectedMaterial.id === id) {
        setSelectedMaterial(prev => prev ? { ...prev, embedding_status: 'pending' } : null);
      }
      
    } catch (err) {
      console.error('Error reprocessing material:', err);
      showSnackbar('Failed to reprocess material', 'error');
    }
  };
  
  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
  };
  
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  return (
    // <Layout title="Study Materials">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Study Materials
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setUploaderOpen(true)}
              size="large"
              sx={{ py: 1, px: 2 }}
            >
              Upload Material
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
              <CircularProgress size={48} />
            </Box>
          ) : (
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                mb: 3
              }}
            >
              <MaterialsList 
                materials={materials}
                onDelete={handleDeleteMaterial}
                onRefreshStatus={handleRefreshStatus}
                onViewContent={handleViewMaterial}
              />
            </Paper>
          )}
        </Box>
        
        {/* Upload Dialog */}
        <Dialog
          open={uploaderOpen}
          onClose={() => setUploaderOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                Upload New Material
              </Typography>
              <IconButton onClick={() => setUploaderOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <MaterialUploader onUploadSuccess={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
        
        {/* Material Viewer Dialog */}
        <Dialog
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          maxWidth="lg"
          fullWidth
          scroll="paper"
        >
          <DialogContent sx={{ p: 3 }}>
            {selectedMaterial && (
              <MaterialViewer 
                materialId={selectedMaterial.id}
                onClose={() => setViewerOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Floating action button for mobile */}
        <Box sx={{ display: { md: 'none' } }}>
          <Fab
            color="primary"
            aria-label="add material"
            sx={{ position: 'fixed', bottom: 20, right: 20, width: 60, height: 60 }}
            onClick={() => setUploaderOpen(true)}
          >
            <AddIcon sx={{ fontSize: 24 }} />
          </Fab>
        </Box>
        
        {/* Status snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        
        {/* Deletion loading backdrop */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={deleteLoading}
        >
          <CircularProgress color="inherit" size={48} />
        </Backdrop>
      </Container>
    // </Layout>
  );
};

export default MaterialsPage; 