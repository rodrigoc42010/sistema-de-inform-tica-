import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Material UI
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  CircularProgress,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocationOn as LocationOnIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Componentes
import Sidebar from '../../components/Sidebar';
import TicketStatusBadge from '../../components/TicketStatusBadge';

// Dados simulados (serão substituídos pela API)
const mockTickets = [
  {
    _id: '2',
    title: 'Notebook com tela azul',
    description: 'Notebook está apresentando tela azul constantemente ao abrir programas.',
    status: 'em_andamento',
    priority: 'média',
    createdAt: '2023-05-08T14:20:00Z',
    client: {
      _id: 'c1',
      name: 'João Silva',
      phone: '(11) 98765-4321',
    },
    device: {
      type: 'Notebook',
      brand: 'HP',
      model: 'Pavilion',
    },
    serviceItems: [
      { description: 'Diagnóstico', price: 50 },
      { description: 'Formatação', price: 100 },
    ],
  },
  {
    _id: '4',
    title: 'Problema com impressora',
    description: 'Impressora não está conectando na rede Wi-Fi.',
    status: 'aguardando_aprovação',
    priority: 'média',
    createdAt: '2023-05-05T11:45:00Z',
    client: {
      _id: 'c2',
      name: 'Maria Oliveira',
      phone: '(11) 91234-5678',
    },
    device: {
      type: 'Impressora',
      brand: 'Epson',
      model: 'L3150',
    },
    serviceItems: [
      { description: 'Diagnóstico', price: 50 },
      { description: 'Configuração de rede', price: 80 },
    ],
  },
  {
    _id: '5',
    title: 'Computador lento',
    description: 'Computador muito lento para iniciar e executar programas.',
    status: 'novo',
    priority: 'alta',
    createdAt: '2023-05-09T09:30:00Z',
    client: {
      _id: 'c3',
      name: 'Pedro Santos',
      phone: '(11) 97777-8888',
    },
    device: {
      type: 'Desktop',
      brand: 'Positivo',
      model: 'Master',
    },
  },
  {
    _id: '3',
    title: 'Instalação de software',
    description: 'Instalação de pacote Office e configuração de email.',
    status: 'concluído',
    priority: 'baixa',
    createdAt: '2023-05-01T09:15:00Z',
    completedAt: '2023-05-02T16:30:00Z',
    client: {
      _id: 'c4',
      name: 'Ana Souza',
      phone: '(11) 95555-6666',
    },
    device: {
      type: 'Notebook',
      brand: 'Lenovo',
      model: 'Ideapad',
    },
    serviceItems: [
      { description: 'Instalação de Office', price: 50 },
      { description: 'Configuração de Email', price: 30 },
    ],
    paymentStatus: 'pago',
  },
];

const mockServices = [
  { id: 1, name: 'Formatação de Computadores', initialPrice: 100, active: true },
  { id: 2, name: 'Instalação de Software', initialPrice: 50, active: true },
  { id: 3, name: 'Limpeza de Hardware', initialPrice: 80, active: true },
  { id: 4, name: 'Remoção de Vírus', initialPrice: 70, active: true },
  { id: 5, name: 'Recuperação de Dados', initialPrice: 150, active: true },
];

const mockEarnings = {
  today: 180,
  week: 750,
  month: 2800,
  pending: 350,
};

function TechnicianDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState(mockTickets);
  const [services, setServices] = useState(mockServices);
  const [earnings, setEarnings] = useState(mockEarnings);
  const [availability, setAvailability] = useState(true);
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [currentService, setCurrentService] = useState({ id: null, name: '', initialPrice: 0, active: true });
  const [showEmailVerificationAlert, setShowEmailVerificationAlert] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Aqui será implementada a chamada à API para buscar os tickets do técnico
    // dispatch(getTechnicianTickets());
    
    // Verificar se o e-mail está verificado
    if (user && !user.isEmailVerified) {
      setShowEmailVerificationAlert(true);
    }
    
    // Simulando carregamento
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [dispatch, user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Aqui será implementada a chamada à API para atualizar os dados
    // dispatch(getTechnicianTickets());
    setTimeout(() => {
      setLoading(false);
      toast.success('Dados atualizados com sucesso!');
    }, 1000);
  };

  const handleAvailabilityChange = (event) => {
    setAvailability(event.target.checked);
    // Aqui será implementada a chamada à API para atualizar a disponibilidade
    // dispatch(updateTechnicianAvailability(event.target.checked));
    toast.success(`Você está ${event.target.checked ? 'disponível' : 'indisponível'} para novos chamados`);
  };

  const handleViewTicket = (ticketId) => {
    // Navegação para a página de detalhes do chamado
    navigate(`/technician/ticket/${ticketId}`);
  };

  const handleAddService = () => {
    setCurrentService({ id: null, name: '', initialPrice: 0, active: true });
    setOpenServiceDialog(true);
  };

  const handleEditService = (service) => {
    setCurrentService(service);
    setOpenServiceDialog(true);
  };

  const handleCloseServiceDialog = () => {
    setOpenServiceDialog(false);
  };

  const handleSaveService = () => {
    if (!currentService.name || currentService.initialPrice <= 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    if (currentService.id) {
      // Atualizar serviço existente
      setServices(services.map(service => 
        service.id === currentService.id ? currentService : service
      ));
      toast.success('Serviço atualizado com sucesso!');
    } else {
      // Adicionar novo serviço
      const newService = {
        ...currentService,
        id: services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1
      };
      setServices([...services, newService]);
      toast.success('Serviço adicionado com sucesso!');
    }

    setOpenServiceDialog(false);
  };

  const handleToggleServiceStatus = (serviceId) => {
    setServices(services.map(service => 
      service.id === serviceId ? { ...service, active: !service.active } : service
    ));
  };

  const filterTicketsByStatus = (status) => {
    if (status === 'todos') {
      return tickets;
    }
    if (status === 'ativos') {
      return tickets.filter(ticket => 
        ['novo', 'em_andamento', 'aguardando_aprovação'].includes(ticket.status)
      );
    }
    return tickets.filter(ticket => ticket.status === status);
  };

  const getTabContent = () => {
    switch (tabValue) {
      case 0: // Visão Geral
        return renderOverview();
      case 1: // Chamados Ativos
        return renderTicketList(filterTicketsByStatus('ativos'));
      case 2: // Todos os Chamados
        return renderTicketList(filterTicketsByStatus('todos'));
      case 3: // Meus Serviços
        return renderServices();
      default:
        return null;
    }
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Estatísticas de Ganhos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ganhos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Hoje
                  </Typography>
                  <Typography variant="h6">
                    R$ {earnings.today.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Esta Semana
                  </Typography>
                  <Typography variant="h6">
                    R$ {earnings.week.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Este Mês
                  </Typography>
                  <Typography variant="h6">
                    R$ {earnings.month.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Pendente
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    R$ {earnings.pending.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Status de Disponibilidade */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status de Disponibilidade
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body1">
                  {availability ? 'Disponível para novos chamados' : 'Indisponível para novos chamados'}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={availability}
                      onChange={handleAvailabilityChange}
                      color="primary"
                    />
                  }
                  label={availability ? 'Online' : 'Offline'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chamados Recentes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chamados Recentes
              </Typography>
              {tickets.filter(ticket => ['novo', 'em_andamento', 'aguardando_aprovação'].includes(ticket.status)).length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                  Nenhum chamado ativo no momento
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {tickets
                    .filter(ticket => ['novo', 'em_andamento', 'aguardando_aprovação'].includes(ticket.status))
                    .slice(0, 3)
                    .map((ticket) => (
                      <Grid item xs={12} key={ticket._id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {ticket.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Cliente: {ticket.client.name} • {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TicketStatusBadge status={ticket.status} />
                            <Button 
                              size="small" 
                              sx={{ ml: 2 }}
                              onClick={() => handleViewTicket(ticket._id)}
                            >
                              Ver
                            </Button>
                          </Box>
                        </Box>
                        {tickets.indexOf(ticket) < tickets.filter(t => ['novo', 'em_andamento', 'aguardando_aprovação'].includes(t.status)).slice(0, 3).length - 1 && (
                          <Divider sx={{ my: 1.5 }} />
                        )}
                      </Grid>
                    ))
                  }
                </Grid>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => setTabValue(1)}>
                Ver Todos os Chamados Ativos
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderTicketList = (ticketList) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (ticketList.length === 0) {
      return (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="textSecondary">
            Nenhum chamado encontrado
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {ticketList.map((ticket) => (
          <Grid item xs={12} md={6} key={ticket._id}>
            <Card className="ticket-card">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" component="h2" noWrap>
                    {ticket.title}
                  </Typography>
                  <TicketStatusBadge status={ticket.status} />
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {new Date(ticket.createdAt).toLocaleDateString('pt-BR')} • 
                  Prioridade: {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1.5 }} noWrap>
                  {ticket.description}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Cliente: {ticket.client.name} • {ticket.client.phone}
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`${ticket.device.type} ${ticket.device.brand} ${ticket.device.model}`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
                
                {ticket.serviceItems && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Serviços:
                    </Typography>
                    {ticket.serviceItems.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2">{item.description}</Typography>
                        <Typography variant="body2">R$ {item.price.toFixed(2)}</Typography>
                      </Box>
                    ))}
                    <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, textAlign: 'right' }}>
                      Total: R$ {ticket.serviceItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                
                {ticket.paymentStatus && (
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={ticket.paymentStatus === 'pago' ? 'Pago' : 'Pendente'} 
                      color={ticket.paymentStatus === 'pago' ? 'success' : 'warning'}
                      size="small" 
                    />
                  </Box>
                )}
              </CardContent>
              
              <CardActions>
                <Button size="small" onClick={() => handleViewTicket(ticket._id)}>
                  Ver Detalhes
                </Button>
                
                {ticket.status === 'novo' && (
                  <Button size="small" color="primary">
                    Iniciar Atendimento
                  </Button>
                )}
                
                {ticket.status === 'em_andamento' && (
                  <Button size="small" color="primary">
                    Enviar Orçamento
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderServices = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddService}
          >
            Adicionar Serviço
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" component="h2" noWrap>
                      {service.name}
                    </Typography>
                    <Chip 
                      label={service.active ? 'Ativo' : 'Inativo'} 
                      color={service.active ? 'success' : 'default'}
                      size="small" 
                    />
                  </Box>
                  
                  <Typography variant="body1" color="primary" fontWeight="bold">
                    R$ {service.initialPrice.toFixed(2)}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleEditService(service)}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="small" 
                    color={service.active ? 'error' : 'success'}
                    onClick={() => handleToggleServiceStatus(service.id)}
                  >
                    {service.active ? 'Desativar' : 'Ativar'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Dialog para adicionar/editar serviço */}
        <Dialog open={openServiceDialog} onClose={handleCloseServiceDialog}>
          <DialogTitle>
            {currentService.id ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Preencha as informações do serviço que você oferece.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Nome do Serviço"
              type="text"
              fullWidth
              variant="outlined"
              value={currentService.name}
              onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Preço Inicial (R$)"
              type="number"
              fullWidth
              variant="outlined"
              value={currentService.initialPrice}
              onChange={(e) => setCurrentService({ ...currentService, initialPrice: parseFloat(e.target.value) || 0 })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={currentService.active}
                  onChange={(e) => setCurrentService({ ...currentService, active: e.target.checked })}
                  color="primary"
                />
              }
              label="Serviço Ativo"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseServiceDialog}>Cancelar</Button>
            <Button onClick={handleSaveService} variant="contained" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          {/* Alerta de verificação de e-mail */}
          {showEmailVerificationAlert && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              onClose={() => setShowEmailVerificationAlert(false)}
            >
              <AlertTitle>E-mail não verificado</AlertTitle>
              Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta completamente.
              <Button 
                size="small" 
                sx={{ ml: 2 }}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/users/resend-verification', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (response.ok) {
                      toast.success('E-mail de verificação reenviado!');
                    } else {
                      toast.error('Erro ao reenviar e-mail de verificação');
                    }
                  } catch (error) {
                    toast.error('Erro de conexão');
                  }
                }}
              >
                Reenviar E-mail
              </Button>
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Painel do Técnico
            </Typography>
            <Box>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="dashboard tabs"
            >
              <Tab label="Visão Geral" />
              <Tab label="Chamados Ativos" />
              <Tab label="Todos os Chamados" />
              <Tab label="Meus Serviços" />
            </Tabs>
          </Paper>
          
          {getTabContent()}
        </Container>
      </Box>
    </Box>
  );
}

export default TechnicianDashboard;