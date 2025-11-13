import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';

// Material UI
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
  Tooltip,
  useMediaQuery,
  useTheme,
  Fab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Build as BuildIcon,
  Payment as PaymentIcon,
  LocationOn as LocationOnIcon,
  Campaign as CampaignIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as AddIcon,
  // ExitToApp as ExitToAppIcon, // Não utilizado
  Store as StoreIcon,
} from '@mui/icons-material';

// Logo
import logo from '../assets/logo.svg';

const drawerWidth = 240;

function Sidebar() {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fechar drawer em dispositivos móveis por padrão
  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const onLogout = () => {
    handleProfileMenuClose();
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };
  
  const handleNewTicket = () => {
    navigate('/client/new-ticket');
  };

  const clientMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/client/dashboard',
    },
    {
      text: 'Meus Chamados',
      icon: <AssignmentIcon />,
      path: '/client/dashboard',
    },
    {
      text: 'Técnicos Próximos',
      icon: <LocationOnIcon />,
      path: '/client/nearby-technicians',
    },
    {
      text: 'Serviços Locais',
      icon: <StoreIcon />,
      path: '/client/local-services',
    },
    {
      text: 'Pagamentos',
      icon: <PaymentIcon />,
      path: '/client/payments',
    },
  ];

  const technicianMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/technician/dashboard',
    },
    {
      text: 'Chamados',
      icon: <AssignmentIcon />,
      path: '/technician/dashboard',
    },
    {
      text: 'Meus Serviços',
      icon: <BuildIcon />,
      path: '/technician/services',
    },
    {
      text: 'Serviços Locais',
      icon: <StoreIcon />,
      path: '/technician/local-services',
    },
    {
      text: 'Recebimentos',
      icon: <PaymentIcon />,
      path: '/technician/payments',
    },
  ];

  const menuItems = user?.role === 'technician' ? technicianMenuItems : clientMenuItems;

  const drawer = (
    <>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: [1] }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Logo" height="40" />
          <Typography variant="h6" noWrap component="div" sx={{ ml: 1 }}>
            TechSupport
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to={`/${user?.role}/profile`}
            selected={location.pathname === `/${user?.role}/profile`}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Perfil" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to={`/${user?.role}/settings`}
            selected={location.pathname === `/${user?.role}/settings`}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Configurações" />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} TechSupport
          </Typography>
        </Box>
      </Box>
    </>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img src={logo} alt="Logo" height="30" style={{ marginRight: '8px' }} />
                TechSupport
              </Box>
            )}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Anúncios">
              <IconButton color="inherit">
                <CampaignIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Perfil">
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar alt={user?.name} src={user?.profileImage} sx={{ width: 32, height: 32 }}>
                  {user?.name?.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <MenuItem component={Link} to="/settings" onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Configurações
        </MenuItem>
        <Divider />
        <MenuItem onClick={onLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>
      {/* Main placeholder removido; as páginas gerenciam sua própria área principal e espaçamento do AppBar */}
      
      {/* Botão flutuante para criar novo chamado (apenas para clientes) */}
      {user?.role === 'client' && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleNewTicket}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </>
  );
}

export default Sidebar;