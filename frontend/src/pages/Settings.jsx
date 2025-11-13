import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../selectors/authSelectors';
import {
  Box,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Switch,
  Typography,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';

function Settings() {
  const user = useSelector(selectUser);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para as configurações
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      newTickets: true,
      ticketUpdates: true,
      marketing: false,
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      highContrast: false,
    },
    privacy: {
      showProfile: true,
      showOnlineStatus: true,
      allowLocationAccess: true,
    },
    language: 'pt-BR',
  });

  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [name]: checked,
      },
    });
  };

  const handleAppearanceChange = (event) => {
    const { name, checked, value } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;
    
    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        [name]: newValue,
      },
    });
  };

  const handlePrivacyChange = (event) => {
    const { name, checked } = event.target;
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [name]: checked,
      },
    });
  };

  const handleLanguageChange = (event) => {
    setSettings({
      ...settings,
      language: event.target.value,
    });
  };

  const handleSaveSettings = () => {
    // Aqui você enviaria os dados para a API
    // Simulando uma atualização bem-sucedida
    setSuccessMessage('Configurações salvas com sucesso!');
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          mt: '64px',
        }}
      >
        <Container maxWidth="lg">
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                Configurações
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
              >
                Salvar Alterações
              </Button>
            </Box>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Notificações */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Notificações</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Canais de Notificação
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Notificações por Email" />
                        <Switch
                          edge="end"
                          name="email"
                          checked={settings.notifications.email}
                          onChange={handleNotificationChange}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Notificações Push" />
                        <Switch
                          edge="end"
                          name="push"
                          checked={settings.notifications.push}
                          onChange={handleNotificationChange}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Notificações por SMS" />
                        <Switch
                          edge="end"
                          name="sms"
                          checked={settings.notifications.sms}
                          onChange={handleNotificationChange}
                        />
                      </ListItem>
                    </List>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Tipos de Notificação
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Novos Chamados" />
                        <Switch
                          edge="end"
                          name="newTickets"
                          checked={settings.notifications.newTickets}
                          onChange={handleNotificationChange}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Atualizações de Chamados" />
                        <Switch
                          edge="end"
                          name="ticketUpdates"
                          checked={settings.notifications.ticketUpdates}
                          onChange={handleNotificationChange}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Comunicações de Marketing" />
                        <Switch
                          edge="end"
                          name="marketing"
                          checked={settings.notifications.marketing}
                          onChange={handleNotificationChange}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Aparência */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PaletteIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Aparência</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="theme-select-label">Tema</InputLabel>
                      <Select
                        labelId="theme-select-label"
                        id="theme-select"
                        name="theme"
                        value={settings.appearance.theme}
                        label="Tema"
                        onChange={handleAppearanceChange}
                      >
                        <MenuItem value="light">Claro</MenuItem>
                        <MenuItem value="dark">Escuro</MenuItem>
                        <MenuItem value="system">Sistema</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="font-size-select-label">Tamanho da Fonte</InputLabel>
                      <Select
                        labelId="font-size-select-label"
                        id="font-size-select"
                        name="fontSize"
                        value={settings.appearance.fontSize}
                        label="Tamanho da Fonte"
                        onChange={handleAppearanceChange}
                      >
                        <MenuItem value="small">Pequeno</MenuItem>
                        <MenuItem value="medium">Médio</MenuItem>
                        <MenuItem value="large">Grande</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          name="highContrast"
                          checked={settings.appearance.highContrast}
                          onChange={handleAppearanceChange}
                        />
                      }
                      label="Alto Contraste"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Idioma */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LanguageIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Idioma</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="language-select-label">Idioma do Sistema</InputLabel>
                      <Select
                        labelId="language-select-label"
                        id="language-select"
                        value={settings.language}
                        label="Idioma do Sistema"
                        onChange={handleLanguageChange}
                      >
                        <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                        <MenuItem value="en-US">English (United States)</MenuItem>
                        <MenuItem value="es">Español</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Privacidade */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <VisibilityIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Privacidade</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Mostrar Perfil para Outros Usuários" 
                          secondary="Permite que outros usuários vejam seu perfil"
                        />
                        <Switch
                          edge="end"
                          name="showProfile"
                          checked={settings.privacy.showProfile}
                          onChange={handlePrivacyChange}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Mostrar Status Online" 
                          secondary="Permite que outros usuários vejam quando você está online"
                        />
                        <Switch
                          edge="end"
                          name="showOnlineStatus"
                          checked={settings.privacy.showOnlineStatus}
                          onChange={handlePrivacyChange}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Permitir Acesso à Localização" 
                          secondary="Permite que o sistema use sua localização para encontrar técnicos próximos"
                        />
                        <Switch
                          edge="end"
                          name="allowLocationAccess"
                          checked={settings.privacy.allowLocationAccess}
                          onChange={handlePrivacyChange}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Segurança da Conta */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SecurityIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Segurança da Conta</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Verificação em Duas Etapas
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          Adicione uma camada extra de segurança à sua conta ativando a verificação em duas etapas.
                        </Typography>
                        <Button variant="outlined" color="primary">
                          Configurar Verificação em Duas Etapas
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Sessões Ativas
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          Você tem 2 dispositivos conectados à sua conta. Você pode encerrar todas as sessões exceto a atual.
                        </Typography>
                        <Button variant="outlined" color="secondary">
                          Gerenciar Sessões
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default Settings;