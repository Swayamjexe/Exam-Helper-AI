import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookIcon from '@mui/icons-material/Book';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { AuthContext } from '../context/AuthContext';

const drawerWidth = 240;

type LayoutProps = {
  children: React.ReactNode;
  title: string;
};

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Study Materials', icon: <BookIcon />, path: '/materials' },
    { text: 'Tests', icon: <QuestionAnswerIcon />, path: '/tests' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: open ? `${drawerWidth}px` : 0 },
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          {isMobile && (
  <IconButton
    color="inherit"
    aria-label="open drawer"
    edge="start"
    onClick={handleDrawerToggle}
    sx={{ mr: 2 }}
  >
    <MenuIcon />
  </IconButton>
)}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #0cffe1 0%, #00d4ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={handleProfileMenuOpen}
            size="small"
            sx={{ ml: 2 }}
            aria-controls="user-menu"
            aria-haspopup="true"
          >
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                width: 36,
                height: 36,
                border: '2px solid',
                borderColor: 'secondary.light',
              }}
            >
              {user?.username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                backgroundColor: 'background.paper',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                border: '1px solid',
                borderColor: 'divider',
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleProfileMenuClose();
                // Navigate to profile page when implemented
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 1.5,
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(90deg, #0cffe1 0%, #fb00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Exam Helper
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: '8px',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(12, 255, 225, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(12, 255, 225, 0.2)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          // ml: { md: open ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          pt: { xs: 10, sm: 8 },
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 