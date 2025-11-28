import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../selectors/authSelectors';
import {
  Box, Container, Divider, FormControlLabel, Grid, List, ListItem, ListItemIcon, ListItemText,
  Paper, Switch, Typography, Button, Alert, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Stack, Chip
} from '@mui/material';
import {
  Notifications, Language, Palette, Visibility, Security, Save,
  Email, Smartphone, Sms, NewReleases, Update, Campaign,
  DarkMode, TextFields, Contrast, LocationOn, Public
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';

function Settings() {
  const user = useSelector(selectUser);
  const [successMessage, setSuccessMessage] = useState('');

  const [settings, setSettings] = useState({
    notifications: {
      email: true, push: true, sms: false,
      newTickets: true, ticketUpdates: true, marketing: false,
    },
    appearance: {
      theme: 'dark', fontSize: 'medium', highContrast: false,
    },
    privacy: {
      showProfile: true, showOnlineStatus: true, allowLocationAccess: true,
    },
    language: 'pt-BR',
  });

  const handleNotificationChange = (e) => {
    setSettings({ ...settings, notifications: { ...settings.notifications, [e.target.name]: e.target.checked } });
  };

  const handleAppearanceChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({ ...settings, appearance: { ...settings.appearance, [e.target.name]: val } });
  };

  const handlePrivacyChange = (e) => {
    setSettings({ ...settings, privacy: { ...settings.privacy, [e.target.name]: e.target.checked } });
  };

  const handleLanguageChange = (e) => {
    setSettings({ ...settings, language: e.target.value });
  };

  const handleSaveSettings = () => {
    setSuccessMessage('Configurações salvas com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Custom Switch Style
  const gradientSwitch = {
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#06b6d4',
      '&:hover': { backgroundColor: 'rgba(6, 182, 212, 0.08)' },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#06b6d4',
    },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: { sm: '240px' }, mt: '64px' }}>
        <Container maxWidth="lg">

          {/* Hero Section */}
          <Box sx={{ mb: 6, position: 'relative', textAlign: 'center' }}>
            <Box sx={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h3" fontWeight="800" sx={{ background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                Configurações
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Personalize sua experiência, notificações e preferências de privacidade.
              </Typography>
            </Box>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 4, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', backdropFilter: 'blur(10px)' }}>
              {successMessage}
            </Alert>
          )}

          <Grid container spacing={3}>

            {/* Notificações */}
            <Grid item xs={12} md={6}>
              <Paper className="glass-card-premium" sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                    <Notifications />
                  </Box>
                  <Typography variant="h6">Notificações</Typography>
                </Box>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Canais</Typography>
                  <List dense disablePadding>
                    <ListItem>
                      <ListItemIcon><Email sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Email" secondary="Receber atualizações por email" />
                      <Switch edge="end" name="email" checked={settings.notifications.email} onChange={handleNotificationChange} sx={gradientSwitch} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Smartphone sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Push" secondary="Notificações no navegador" />
                      <Switch edge="end" name="push" checked={settings.notifications.push} onChange={handleNotificationChange} sx={gradientSwitch} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Sms sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="SMS" secondary="Mensagens de texto urgentes" />
                      <Switch edge="end" name="sms" checked={settings.notifications.sms} onChange={handleNotificationChange} sx={gradientSwitch} />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Tipos</Typography>
                  <List dense disablePadding>
                    <ListItem>
                      <ListItemIcon><NewReleases sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Novos Chamados" />
                      <Switch edge="end" name="newTickets" checked={settings.notifications.newTickets} onChange={handleNotificationChange} sx={gradientSwitch} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Update sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Atualizações" />
                      <Switch edge="end" name="ticketUpdates" checked={settings.notifications.ticketUpdates} onChange={handleNotificationChange} sx={gradientSwitch} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Campaign sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Marketing" />
                      <Switch edge="end" name="marketing" checked={settings.notifications.marketing} onChange={handleNotificationChange} sx={gradientSwitch} />
                    </ListItem>
                  </List>
                </CardContent>
              </Paper>
            </Grid>

            {/* Aparência & Idioma */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3} sx={{ height: '100%' }}>
                <Paper className="glass-card-premium" sx={{ p: 0 }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                      <Palette />
                    </Box>
                    <Typography variant="h6">Aparência</Typography>
                  </Box>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Tema</InputLabel>
                          <Select name="theme" value={settings.appearance.theme} label="Tema" onChange={handleAppearanceChange} className="premium-input">
                            <MenuItem value="light"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Visibility fontSize="small" /> Claro</Box></MenuItem>
                            <MenuItem value="dark"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DarkMode fontSize="small" /> Escuro</Box></MenuItem>
                            <MenuItem value="system">Sistema</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Fonte</InputLabel>
                          <Select name="fontSize" value={settings.appearance.fontSize} label="Fonte" onChange={handleAppearanceChange} className="premium-input">
                            <MenuItem value="small">Pequena</MenuItem>
                            <MenuItem value="medium">Média</MenuItem>
                            <MenuItem value="large">Grande</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Contrast color="action" />
                        <Typography>Alto Contraste</Typography>
                      </Box>
                      <Switch name="highContrast" checked={settings.appearance.highContrast} onChange={handleAppearanceChange} sx={gradientSwitch} />
                    </Box>
                  </CardContent>
                </Paper>

                <Paper className="glass-card-premium" sx={{ p: 0, flexGrow: 1 }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <Language />
                    </Box>
                    <Typography variant="h6">Idioma</Typography>
                  </Box>
                  <CardContent>
                    <FormControl fullWidth>
                      <InputLabel>Idioma do Sistema</InputLabel>
                      <Select value={settings.language} label="Idioma do Sistema" onChange={handleLanguageChange} className="premium-input">
                        <MenuItem value="pt-BR">🇧🇷 Português (Brasil)</MenuItem>
                        <MenuItem value="en-US">🇺🇸 English (United States)</MenuItem>
                        <MenuItem value="es">🇪🇸 Español</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Paper>
              </Stack>
            </Grid>

            {/* Privacidade */}
            <Grid item xs={12} md={6}>
              <Paper className="glass-card-premium" sx={{ p: 0, height: '100%' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Visibility />
                  </Box>
                  <Typography variant="h6">Privacidade</Typography>
                </Box>
                <CardContent>
                  <List dense disablePadding>
                    <ListItem>
                      <ListItemIcon><Public sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Perfil Público" secondary="Permitir que outros vejam seu perfil" />
                      <Switch edge="end" name="showProfile" checked={settings.privacy.showProfile} onChange={handlePrivacyChange} sx={gradientSwitch} />
                    </ListItem>
                    <Divider component="li" sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                    <ListItem>
                      <ListItemIcon><Visibility sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Status Online" secondary="Mostrar quando você está ativo" />
                      <Switch edge="end" name="showOnlineStatus" checked={settings.privacy.showOnlineStatus} onChange={handlePrivacyChange} sx={gradientSwitch} />
                    </ListItem>
                    <Divider component="li" sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                    <ListItem>
                      <ListItemIcon><LocationOn sx={{ color: 'text.secondary' }} /></ListItemIcon>
                      <ListItemText primary="Localização" secondary="Usar localização para encontrar serviços" />
                      <Switch edge="end" name="allowLocationAccess" checked={settings.privacy.allowLocationAccess} onChange={handlePrivacyChange} sx={gradientSwitch} />
                    </ListItem>
                  </List>
                </CardContent>
              </Paper>
            </Grid>

            {/* Segurança */}
            <Grid item xs={12} md={6}>
              <Paper className="glass-card-premium" sx={{ p: 0, height: '100%' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    <Security />
                  </Box>
                  <Typography variant="h6">Segurança</Typography>
                </Box>
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="subtitle1" gutterBottom>Verificação em Duas Etapas</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Proteja sua conta com uma camada extra de segurança.
                      </Typography>
                      <Button variant="outlined" color="primary" size="small">Configurar 2FA</Button>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="subtitle1" gutterBottom>Sessões Ativas</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Gerencie dispositivos conectados à sua conta.
                      </Typography>
                      <Button variant="outlined" color="secondary" size="small">Gerenciar Sessões</Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Paper>
            </Grid>

            {/* Save Button */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Save />}
                onClick={handleSaveSettings}
                sx={{
                  background: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
                  px: 4, py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Salvar Alterações
              </Button>
            </Grid>

          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default Settings;