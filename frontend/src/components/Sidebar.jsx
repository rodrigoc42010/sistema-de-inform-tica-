import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import { selectUser } from '../selectors/authSelectors';
import { toast } from 'react-toastify';
// Removido import duplicado de useDispatch/useSelector
// import { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
import { fetchActiveAds } from '../features/ads/adsSlice';
import { Badge } from '@mui/material';

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
  Button,
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
  const [adsOpen, setAdsOpen] = useState(false);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const ads = useSelector((state) => state.ads?.items || []);

  // Fechar drawer em dispositivos móveis por padrão
  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  // Buscar anúncios ativos quando aplicável
  useEffect(() => {
    if (user?.token && !user.isAdFree) {
      dispatch(fetchActiveAds());
    }
  }, [dispatch, user?.token, user?.isAdFree]);
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

  const handleAnnouncementsClick = () => {
    if (user?.isAdFree) return;
    if (!ads || ads.length === 0) {
      toast.info('Nenhum anúncio ativo no momento');
      return;
    }
    setAdsOpen(true);
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
      text: 'Anúncios',
      icon: <CampaignIcon />,
      path: '/technician/ads',
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

  useEffect(() => {
    const seg = location.pathname.split('/')[1];
    if (user?.role === 'technician' && seg === 'client') {
      navigate('/technician/dashboard', { replace: true });
    } else if (user?.role === 'client' && seg === 'technician') {
      navigate('/client/dashboard', { replace: true });
    }
  }, [user?.role, location.pathname, navigate]);

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
            to={`/${(user?.role || (location.pathname.split('/')[1] === 'technician' ? 'technician' : 'client'))}/profile`}
            selected={location.pathname === `/${(user?.role || (location.pathname.split('/')[1] === 'technician' ? 'technician' : 'client'))}/profile`}
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
            to={`/${(user?.role || (location.pathname.split('/')[1] === 'technician' ? 'technician' : 'client'))}/settings`}
            selected={location.pathname === `/${(user?.role || (location.pathname.split('/')[1] === 'technician' ? 'technician' : 'client'))}/settings`}
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
            <Tooltip title={user?.isAdFree ? 'Sem anúncios (Ad-free ativo)' : 'Anúncios'}>
              <span>
                <IconButton color="inherit" onClick={handleAnnouncementsClick} disabled={user?.isAdFree}>
                  {user?.isAdFree ? (
                    <CampaignIcon />
                  ) : (
                    <Badge color="error" variant={ads?.length > 0 ? 'dot' : undefined} overlap="circular">
                      <CampaignIcon />
                    </Badge>
                  )}
                </IconButton>
              </span>
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
        <MenuItem component={Link} to={`/${(user?.role || (location.pathname.split('/')[1] === 'technician' ? 'technician' : 'client'))}/profile`} onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <MenuItem component={Link} to={`/${(user?.role || (location.pathname.split('/')[1] === 'technician' ? 'technician' : 'client'))}/settings`} onClick={handleProfileMenuClose}>
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
      {/* Drawer de anúncios (temporário, lado direito) */}
      <Drawer
        anchor="right"
        variant="temporary"
        open={adsOpen}
        onClose={() => setAdsOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 56 : 360) } }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Anúncios</Typography>
            <IconButton onClick={() => setAdsOpen(false)} size="small" aria-label="fechar anúncios">
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {(!ads || ads.length === 0) ? (
            <Typography variant="body2" color="text.secondary">Nenhum anúncio ativo no momento.</Typography>
          ) : (
            <List>
              {ads.map((ad) => (
                <Box key={ad._id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{ad.title}</Typography>
                  {ad.mediaUrl ? (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <img src={ad.mediaUrl} alt={ad.title} style={{ width: '100%', borderRadius: 4, objectFit: 'cover' }} />
                    </Box>
                  ) : null}
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{ad.text}</Typography>
                  {ad.linkUrl ? (
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button size="small" variant="outlined" color="primary" component="a" href={ad.linkUrl} target="_blank" rel="noopener noreferrer">
                        Acessar
                      </Button>
                    </Box>
                  ) : null}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
      {/* Botão flutuante existente */}
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
