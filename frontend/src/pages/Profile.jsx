import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../selectors/authSelectors';
import { updateProfile } from '../features/auth/authSlice';
import {
  Avatar, Box, Button, Card, CardContent, Container, Divider, Grid, IconButton, Paper, Tab, Tabs, TextField, Typography,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Tooltip, Badge, Chip, CircularProgress
} from '@mui/material';
import {
  Edit, Save, Cancel, PhotoCamera, Security, Person, Home, Work, Payment,
  Logout, Devices, VpnKey, VerifiedUser, AccountCircle
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';

function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isLoading } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Dialogs
  const [open2FADialog, setOpen2FADialog] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [openSessionsDialog, setOpenSessionsDialog] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess_1', device: 'Chrome no Windows', location: 'São Paulo, BR', ip: '192.168.1.10', lastActive: 'Agora', current: true },
    { id: 'sess_2', device: 'Safari no iPhone', location: 'Campinas, BR', ip: '192.168.1.22', lastActive: 'Ontem às 20:14', current: false },
  ]);

  // User Data
  const [userData, setUserData] = useState({
    name: user?.name || 'Nome do Usuário',
    email: user?.email || 'usuario@exemplo.com',
    phone: user?.phone || '',
    cpfCnpj: user?.cpfCnpj || '',
    profileImage: user?.profileImage || null,
    address: {
      street: user?.address?.street || '',
      number: user?.address?.number || '',
      complement: user?.address?.complement || '',
      neighborhood: user?.address?.neighborhood || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
    },
    ...(user?.role === 'technician' && {
      services: user?.services || [],
      bankInfo: {
        bank: user?.bankInfo?.bank || '',
        agency: user?.bankInfo?.agency || '',
        account: user?.bankInfo?.account || '',
        pixKey: user?.bankInfo?.pixKey || '',
      },
    }),
  });

  const [formData, setFormData] = useState({ ...userData });

  useEffect(() => {
    if (user) {
      const updated = {
        name: user.name || 'Nome do Usuário',
        email: user.email || 'usuario@exemplo.com',
        phone: user.phone || '',
        cpfCnpj: user.cpfCnpj || '',
        profileImage: user.profileImage || null,
        address: {
          street: user.address?.street || '',
          number: user.address?.number || '',
          complement: user.address?.complement || '',
          neighborhood: user.address?.neighborhood || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
        },
        ...(user.role === 'technician' && {
          services: user.services || [],
          bankInfo: {
            bank: user.bankInfo?.bank || '',
            agency: user.bankInfo?.agency || '',
            account: user.bankInfo?.account || '',
            pixKey: user.bankInfo?.pixKey || '',
          },
        }),
      };
      setUserData(updated);
      setFormData(updated);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setUserData(formData);
      setEditMode(false);
      setSuccessMessage('Perfil atualizado com sucesso!');
      toast.success('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      toast.error(error || 'Erro ao atualizar perfil');
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Apenas imagens são permitidas');
    if (file.size > 5 * 1024 * 1024) return toast.error('Máximo 5MB');

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData({ ...formData, profileImage: e.target.result });
      toast.success('Foto atualizada! Salve para confirmar.');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAddressChange = (e) => setFormData({ ...formData, address: { ...formData.address, [e.target.name]: e.target.value } });
  const handleBankInfoChange = (e) => setFormData({ ...formData, bankInfo: { ...formData.bankInfo, [e.target.name]: e.target.value } });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: { sm: '240px' }, mt: '64px' }}>
        <Container maxWidth="lg">

          {/* Hero Section */}
          <Box sx={{ mb: 6, position: 'relative', textAlign: 'center' }}>
            <Box sx={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />

            <Box sx={{ position: 'relative', zIndex: 1, mb: 4 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    component="label"
                    sx={{
                      bgcolor: '#06b6d4',
                      '&:hover': { bgcolor: '#0891b2' },
                      width: 40, height: 40,
                      boxShadow: '0 4px 12px rgba(6,182,212,0.4)'
                    }}
                  >
                    <input hidden accept="image/*" type="file" onChange={handlePhotoUpload} />
                    <PhotoCamera sx={{ color: '#fff', fontSize: 20 }} />
                  </IconButton>
                }
              >
                <Avatar
                  src={formData.profileImage || "/static/images/avatar/1.jpg"}
                  sx={{ width: 150, height: 150, border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                />
              </Badge>
              <Typography variant="h3" fontWeight="800" sx={{ mt: 2, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {userData.name}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 500, opacity: 0.9 }}>
                {user?.role === 'client' ? 'Cliente Premium' : 'Técnico Especialista'}
              </Typography>
            </Box>
          </Box>

          {/* Main Content Card */}
          <Paper className="glass-card-premium" sx={{ borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            {/* Toolbar */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': { color: 'text.secondary', minHeight: 60, minWidth: 120 },
                  '& .Mui-selected': { color: '#06b6d4 !important' },
                  '& .MuiTabs-indicator': { bgcolor: '#06b6d4', height: 3, borderRadius: '3px 3px 0 0' }
                }}
              >
                <Tab icon={<Person />} iconPosition="start" label="Pessoal" />
                <Tab icon={<Home />} iconPosition="start" label="Endereço" />
                {user?.role === 'technician' && <Tab icon={<Work />} iconPosition="start" label="Serviços" />}
                {user?.role === 'technician' && <Tab icon={<Payment />} iconPosition="start" label="Financeiro" />}
                <Tab icon={<Security />} iconPosition="start" label="Segurança" />
              </Tabs>

              <Box>
                {editMode ? (
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => { setEditMode(false); setFormData(userData); }}>
                      Cancelar
                    </Button>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ background: 'linear-gradient(45deg, #10b981, #059669)' }}>
                      Salvar
                    </Button>
                  </Stack>
                ) : (
                  <Button variant="contained" startIcon={<Edit />} onClick={() => setEditMode(true)} sx={{ background: 'linear-gradient(45deg, #06b6d4, #3b82f6)' }}>
                    Editar Perfil
                  </Button>
                )}
              </Box>
            </Box>

            {successMessage && <Alert severity="success" sx={{ m: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{successMessage}</Alert>}

            <Box sx={{ p: 4 }}>
              {/* Tab 1: Personal Info */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Nome Completo" name="name" value={formData.name} onChange={handleInputChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleInputChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Telefone" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="CPF/CNPJ" name="cpfCnpj" value={formData.cpfCnpj} onChange={handleInputChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                </Grid>
              )}

              {/* Tab 2: Address */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Rua" name="street" value={formData.address.street} onChange={handleAddressChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Número" name="number" value={formData.address.number} onChange={handleAddressChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Complemento" name="complement" value={formData.address.complement} onChange={handleAddressChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Bairro" name="neighborhood" value={formData.address.neighborhood} onChange={handleAddressChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Cidade" name="city" value={formData.address.city} onChange={handleAddressChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Estado" name="state" value={formData.address.state} onChange={handleAddressChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="CEP" name="zipCode" value={formData.address.zipCode} onChange={handleAddressChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                </Grid>
              )}

              {/* Tab 3: Services (Tech Only) */}
              {activeTab === 2 && user?.role === 'technician' && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Meus Serviços</Typography>
                    <Button variant="outlined" startIcon={<Work />} onClick={() => navigate('/technician/services')}>Gerenciar Serviços</Button>
                  </Box>
                  <Grid container spacing={2}>
                    {userData.services?.length > 0 ? userData.services.map((s, i) => (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Paper className="glass-card-premium" sx={{ p: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography variant="subtitle1" fontWeight="bold">{s.name}</Typography>
                          <Typography variant="h6" color="primary">R$ {(s.price || 0).toFixed(2)}</Typography>
                        </Paper>
                      </Grid>
                    )) : <Typography color="text.secondary">Nenhum serviço cadastrado.</Typography>}
                  </Grid>
                </Box>
              )}

              {/* Tab 4: Financial (Tech Only) */}
              {activeTab === 3 && user?.role === 'technician' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Banco" name="bank" value={formData.bankInfo.bank} onChange={handleBankInfoChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Agência" name="agency" value={formData.bankInfo.agency} onChange={handleBankInfoChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Conta" name="account" value={formData.bankInfo.account} onChange={handleBankInfoChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Chave PIX" name="pixKey" value={formData.bankInfo.pixKey} onChange={handleBankInfoChange} disabled={!editMode} className="premium-input" />
                  </Grid>
                </Grid>
              )}

              {/* Tab 5: Security */}
              {activeTab === (user?.role === 'technician' ? 4 : 2) && (
                <Box>
                  <Typography variant="h6" gutterBottom>Alterar Senha</Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="password" label="Senha Atual" disabled={!editMode} className="premium-input" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="password" label="Nova Senha" disabled={!editMode} className="premium-input" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="password" label="Confirmar Senha" disabled={!editMode} className="premium-input" />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper className="glass-card-premium" sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <VerifiedUser color="primary" fontSize="large" />
                          <Box>
                            <Typography variant="h6">Autenticação de Dois Fatores</Typography>
                            <Typography variant="body2" color="text.secondary">Proteja sua conta com 2FA.</Typography>
                          </Box>
                        </Box>
                        <Button variant="outlined" fullWidth onClick={() => setOpen2FADialog(true)}>Configurar 2FA</Button>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper className="glass-card-premium" sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Devices color="secondary" fontSize="large" />
                          <Box>
                            <Typography variant="h6">Sessões Ativas</Typography>
                            <Typography variant="body2" color="text.secondary">Gerencie dispositivos conectados.</Typography>
                          </Box>
                        </Box>
                        <Button variant="outlined" color="secondary" fullWidth onClick={() => setOpenSessionsDialog(true)}>Gerenciar Sessões</Button>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Dialogs */}
          <Dialog open={open2FADialog} onClose={() => setOpen2FADialog(false)} PaperProps={{ className: 'glass-card-premium' }}>
            <DialogTitle>Configurar 2FA</DialogTitle>
            <DialogContent>
              <Typography paragraph>Insira o código do seu app autenticador:</Typography>
              <TextField fullWidth placeholder="000000" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} className="premium-input" />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen2FADialog(false)}>Cancelar</Button>
              <Button variant="contained" onClick={() => { toast.success('2FA Ativado!'); setOpen2FADialog(false); }}>Ativar</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openSessionsDialog} onClose={() => setOpenSessionsDialog(false)} PaperProps={{ className: 'glass-card-premium' }}>
            <DialogTitle>Sessões Ativas</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {activeSessions.map(s => (
                  <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                    <Box>
                      <Typography variant="subtitle2">{s.device} {s.current && <Chip size="small" label="Atual" color="success" sx={{ height: 20 }} />}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.location} • {s.lastActive}</Typography>
                    </Box>
                    {!s.current && <Button size="small" color="error" onClick={() => setActiveSessions(prev => prev.filter(x => x.id !== s.id))}>Sair</Button>}
                  </Box>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenSessionsDialog(false)}>Fechar</Button>
              <Button color="error" variant="contained" onClick={() => { setActiveSessions(prev => prev.filter(s => s.current)); setOpenSessionsDialog(false); }}>Sair de Todas</Button>
            </DialogActions>
          </Dialog>

        </Container>
      </Box>
    </Box>
  );
}

export default Profile;