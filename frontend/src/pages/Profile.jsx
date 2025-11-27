import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../selectors/authSelectors';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';

function Profile() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [open2FADialog, setOpen2FADialog] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [openSessionsDialog, setOpenSessionsDialog] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess_1', device: 'Chrome no Windows', location: 'São Paulo, BR', ip: '192.168.1.10', lastActive: 'Agora', current: true },
    { id: 'sess_2', device: 'Safari no iPhone', location: 'Campinas, BR', ip: '192.168.1.22', lastActive: 'Ontem às 20:14', current: false },
  ]);

  // User data from Redux state
  const [userData, setUserData] = useState({
    name: user?.name || 'Nome do Usuário',
    email: user?.email || 'usuario@exemplo.com',
    phone: user?.phone || '',
    cpfCnpj: user?.cpfCnpj || (user?.role === 'client' ? '' : ''),
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
    // Campos específicos para técnicos
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

  const [formData, setFormData] = useState({
    ...userData,
    profileImage: userData.profileImage || null
  });

  // Sincronizar dados quando o usuário for atualizado no Redux
  useEffect(() => {
    if (user) {
      const updatedUserData = {
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
        // Campos específicos para técnicos
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

      setUserData(updatedUserData);
      setFormData({
        ...updatedUserData,
        profileImage: updatedUserData.profileImage || null
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancelar edição
      setFormData(userData);
      setEditMode(false);
    } else {
      // Iniciar edição
      setEditMode(true);
    }
  };

  const handleSave = () => {
    // Aqui você enviaria os dados para a API
    // Simulando uma atualização bem-sucedida
    setUserData(formData);
    setEditMode(false);
    setSuccessMessage('Perfil atualizado com sucesso!');

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Handlers de Segurança
  const handleOpen2FADialog = () => setOpen2FADialog(true);
  const handleClose2FADialog = () => setOpen2FADialog(false);
  const handleEnable2FA = () => {
    // Aqui você chamaria a API real para ativar o 2FA
    toast.success('2FA ativado com sucesso (mock)');
    setTwoFACode('');
    setOpen2FADialog(false);
  };

  const handleOpenSessionsDialog = () => setOpenSessionsDialog(true);
  const handleCloseSessionsDialog = () => setOpenSessionsDialog(false);
  const handleConfirmEndSessions = () => {
    // Simula encerrar todas as sessões exceto a atual
    setActiveSessions((prev) => prev.filter((s) => s.current));
    setOpenSessionsDialog(false);
    toast.success('Todas as outras sessões foram encerradas.');
  };
  const handleEndSingleSession = (sessionId) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast.info('Sessão encerrada.');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [name]: value,
      },
    });
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData({
        ...formData,
        profileImage: e.target.result,
      });
      toast.success('Foto selecionada! Clique em "Salvar" para confirmar.');
    };
    reader.readAsDataURL(file);
  };

  const handleBankInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      bankInfo: {
        ...formData.bankInfo,
        [name]: value,
      },
    });
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
                Meu Perfil
              </Typography>
              <Box>
                {/* DEBUG INFO */}

                {editMode ? (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      sx={{ mr: 1 }}
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<CancelIcon />}
                      onClick={handleEditToggle}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleEditToggle}
                  >
                    Editar Perfil
                  </Button>
                )}
              </Box>
            </Box>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box sx={{ position: 'relative', mr: 3 }}>
                <Avatar
                  src={formData.profileImage || "/static/images/avatar/1.jpg"}
                  sx={{ width: 100, height: 100 }}
                />
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                  <PhotoCameraIcon />
                </IconButton>
              </Box>
              <Box>
                <Typography variant="h5">{userData.name}</Typography>
                <Typography variant="body1" color="textSecondary">
                  {user?.role === 'client' ? 'Cliente' : 'Técnico'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Membro desde {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="profile tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<PersonIcon />} label="Informações Pessoais" />
                <Tab icon={<HomeIcon />} label="Endereço" />
                {user?.role === 'technician' && (
                  <Tab icon={<WorkIcon />} label="Serviços" />
                )}
                {user?.role === 'technician' && (
                  <Tab icon={<PaymentIcon />} label="Dados Bancários" />
                )}
                <Tab icon={<SecurityIcon />} label="Segurança" />
              </Tabs>
            </Box>

            {/* Tab 1: Informações Pessoais */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nome Completo"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Telefone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="CNPJ/CPF"
                      name="cpfCnpj"
                      value={formData.cpfCnpj}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      margin="normal"
                      placeholder={user?.role === 'client' ? 'Digite seu CPF' : 'Digite seu CNPJ ou CPF (se não tiver CNPJ)'}
                      helperText={user?.role === 'technician' ? 'Técnicos podem usar CPF caso não tenham CNPJ' : ''}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 2: Endereço */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Rua"
                      name="street"
                      value={formData.address.street}
                      onChange={handleAddressChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Número"
                      name="number"
                      value={formData.address.number}
                      onChange={handleAddressChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Complemento"
                      name="complement"
                      value={formData.address.complement}
                      onChange={handleAddressChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Bairro"
                      name="neighborhood"
                      value={formData.address.neighborhood}
                      onChange={handleAddressChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Cidade"
                      name="city"
                      value={formData.address.city}
                      onChange={handleAddressChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Estado"
                      name="state"
                      value={formData.address.state}
                      onChange={handleAddressChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="CEP"
                      name="zipCode"
                      value={formData.address.zipCode}
                      onChange={handleAddressChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 3: Serviços (apenas para técnicos) */}
            {activeTab === 2 && user?.role === 'technician' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Meus Serviços
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Gerencie seus serviços na página de Serviços para adicionar, editar ou remover serviços.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/technician/services')}
                >
                  Ir para Serviços
                </Button>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Serviços Atuais
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {userData.services && userData.services.length > 0 ? (
                    userData.services.map((service, index) => (
                      <Grid item xs={12} sm={6} md={4} key={service.id || index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" component="div">
                              {service.name}
                            </Typography>
                            <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
                              R$ {(service.initialPrice || service.price || 0).toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        Nenhum serviço cadastrado ainda.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Tab 4: Dados Bancários (apenas para técnicos) */}
            {activeTab === 3 && user?.role === 'technician' && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Informações Bancárias
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Banco"
                      name="bank"
                      value={formData.bankInfo.bank}
                      onChange={handleBankInfoChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Agência"
                      name="agency"
                      value={formData.bankInfo.agency}
                      onChange={handleBankInfoChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Conta"
                      name="account"
                      value={formData.bankInfo.account}
                      onChange={handleBankInfoChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Chave PIX"
                      name="pixKey"
                      value={formData.bankInfo.pixKey}
                      onChange={handleBankInfoChange}
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 5: Segurança */}
            {activeTab === (user?.role === 'technician' ? 4 : 2) && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Alterar Senha
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Senha Atual"
                      type="password"
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Nova Senha"
                      type="password"
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Confirmar Nova Senha"
                      type="password"
                      disabled={!editMode}
                      margin="normal"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Segurança da Conta
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Autenticação de Dois Fatores
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Adicione uma camada extra de segurança à sua conta ativando a autenticação de dois fatores.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleOpen2FADialog}
                      >
                        Configurar 2FA
                      </Button>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Sessões Ativas
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Gerencie os dispositivos que estão conectados à sua conta.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleOpenSessionsDialog}
                      >
                        Encerrar Todas as Sessões
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Diálogo: Configurar 2FA (mock) */}
          <Dialog open={open2FADialog} onClose={handleClose2FADialog} maxWidth="sm" fullWidth>
            <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" paragraph>
                Este é um fluxo simulado. Em produção, exibiríamos um QR Code e solicitaríamos o código gerado pelo app autenticador.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Insira o código de 6 dígitos do seu app autenticador:
              </Typography>
              <TextField
                fullWidth
                placeholder="000000"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose2FADialog}>Cancelar</Button>
              <Button variant="contained" onClick={handleEnable2FA} disabled={twoFACode.length !== 6}>Ativar</Button>
            </DialogActions>
          </Dialog>

          {/* Diálogo: Encerrar Sessões */}
          <Dialog open={openSessionsDialog} onClose={handleCloseSessionsDialog} maxWidth="xs" fullWidth>
            <DialogTitle>Encerrar Sessões</DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle2" gutterBottom>
                Dispositivos conectados à sua conta
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {activeSessions.length === 0 && (
                  <Typography variant="body2" color="textSecondary">Nenhuma sessão ativa</Typography>
                )}
                {activeSessions.map((s) => (
                  <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.device}{s.current ? ' (esta sessão)' : ''}</Typography>
                      <Typography variant="caption" color="textSecondary">{s.location} • IP {s.ip} • Último acesso: {s.lastActive}</Typography>
                    </Box>
                    {!s.current && (
                      <Button size="small" color="error" onClick={() => handleEndSingleSession(s.id)}>Encerrar</Button>
                    )}
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                Tem certeza de que deseja encerrar todas as sessões (exceto a atual)? Você precisará fazer login novamente nos outros dispositivos.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseSessionsDialog}>Cancelar</Button>
              <Button color="secondary" variant="contained" onClick={handleConfirmEndSessions} disabled={activeSessions.filter(s => !s.current).length === 0}>Encerrar Todas</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}

export default Profile;