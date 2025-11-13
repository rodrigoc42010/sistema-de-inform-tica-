import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Material UI
import {
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
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
} from '@mui/icons-material';

// Componentes
import Sidebar from '../../components/Sidebar';
import TicketStatusBadge from '../../components/TicketStatusBadge';

// Dados simulados (serão substituídos pela API)
const mockTickets = [
  {
    _id: '1',
    title: 'Computador não liga',
    description: 'Meu computador não está ligando, a luz de energia acende mas não dá sinal no monitor.',
    status: 'novo',
    priority: 'alta',
    createdAt: '2023-05-10T10:30:00Z',
    device: {
      type: 'Desktop',
      brand: 'Dell',
      model: 'Inspiron',
    },
  },
  {
    _id: '2',
    title: 'Notebook com tela azul',
    description: 'Meu notebook está apresentando tela azul constantemente ao abrir programas.',
    status: 'em_andamento',
    priority: 'média',
    createdAt: '2023-05-08T14:20:00Z',
    technician: {
      _id: 't1',
      name: 'Carlos Silva',
      rating: 4.8,
    },
    device: {
      type: 'Notebook',
      brand: 'HP',
      model: 'Pavilion',
    },
  },
  {
    _id: '3',
    title: 'Instalação de software',
    description: 'Preciso instalar pacote Office e configurar email.',
    status: 'concluído',
    priority: 'baixa',
    createdAt: '2023-05-01T09:15:00Z',
    completedAt: '2023-05-02T16:30:00Z',
    technician: {
      _id: 't2',
      name: 'Ana Oliveira',
      rating: 4.9,
    },
    device: {
      type: 'Notebook',
      brand: 'Lenovo',
      model: 'Ideapad',
    },
  },
  {
    _id: '4',
    title: 'Problema com impressora',
    description: 'Impressora não está conectando na rede Wi-Fi.',
    status: 'aguardando_aprovação',
    priority: 'média',
    createdAt: '2023-05-05T11:45:00Z',
    technician: {
      _id: 't3',
      name: 'Roberto Almeida',
      rating: 4.7,
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
];

const mockNearbyTechnicians = [
  {
    _id: 't1',
    name: 'Carlos Silva',
    distance: 1.2, // km
    rating: 4.8,
    specialties: ['Formatação', 'Redes', 'Hardware'],
    services: [
      { name: 'Formatação de Computadores', initialPrice: 100 },
      { name: 'Instalação de Software', initialPrice: 50 },
      { name: 'Configuração de Rede', initialPrice: 90 },
    ],
  },
  {
    _id: 't2',
    name: 'Ana Oliveira',
    distance: 2.5, // km
    rating: 4.9,
    specialties: ['Software', 'Vírus', 'Backup'],
    services: [
      { name: 'Remoção de Vírus', initialPrice: 70 },
      { name: 'Recuperação de Dados', initialPrice: 150 },
      { name: 'Instalação de Software', initialPrice: 50 },
    ],
  },
  {
    _id: 't3',
    name: 'Roberto Almeida',
    distance: 3.8, // km
    rating: 4.7,
    specialties: ['Hardware', 'Impressoras', 'Montagem'],
    services: [
      { name: 'Montagem de Computadores', initialPrice: 120 },
      { name: 'Instalação de Periféricos', initialPrice: 40 },
      { name: 'Limpeza de Hardware', initialPrice: 80 },
    ],
  },
];

function ClientDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState(mockTickets);
  const [nearbyTechnicians, setNearbyTechnicians] = useState(mockNearbyTechnicians);
  
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Aqui será implementada a chamada à API para buscar os tickets do cliente
    // dispatch(getTickets());
    
    // Simulando carregamento
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Aqui será implementada a chamada à API para atualizar os tickets
    // dispatch(getTickets());
    setTimeout(() => {
      setLoading(false);
      toast.success('Dados atualizados com sucesso!');
    }, 1000);
  };

  const handleCreateTicket = () => {
    // Navegação para a página de criação de chamado
    // navigate('/client/tickets/new');
  };

  const handleViewTicket = (ticketId) => {
    // Navegação para a página de detalhes do chamado
    navigate(`/client/ticket/${ticketId}`);
  };

  const handleContactTechnician = (technicianId) => {
    // Navegação para a página de criação de chamado com técnico pré-selecionado
    // navigate(`/client/tickets/new?technician=${technicianId}`);
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
      case 0: // Todos os chamados
        return renderTicketList(filterTicketsByStatus('todos'));
      case 1: // Chamados ativos
        return renderTicketList(filterTicketsByStatus('ativos'));
      case 2: // Chamados concluídos
        return renderTicketList(filterTicketsByStatus('concluído'));
      case 3: // Técnicos próximos
        return renderNearbyTechnicians();
      default:
        return null;
    }
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
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateTicket}
            sx={{ mt: 2 }}
          >
            Criar Novo Chamado
          </Button>
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
                  <Chip 
                    label={`${ticket.device.type} ${ticket.device.brand} ${ticket.device.model}`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
                
                {ticket.technician && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Técnico: {ticket.technician.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                      <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                      <Typography variant="body2" color="textSecondary">
                        {ticket.technician.rating}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {ticket.status === 'aguardando_aprovação' && ticket.serviceItems && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Serviços propostos:
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
              </CardContent>
              
              <CardActions>
                <Button size="small" onClick={() => handleViewTicket(ticket._id)}>
                  Ver Detalhes
                </Button>
                
                {ticket.status === 'aguardando_aprovação' && (
                  <>
                    <Button size="small" color="primary">
                      Aprovar
                    </Button>
                    <Button size="small" color="error">
                      Recusar
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderNearbyTechnicians = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (nearbyTechnicians.length === 0) {
      return (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="textSecondary">
            Nenhum técnico encontrado próximo à sua localização
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {nearbyTechnicians.map((technician) => (
          <Grid item xs={12} md={6} key={technician._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {technician.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <LocationOnIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                      {technician.distance} km
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ fontSize: 18, color: 'gold' }} />
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                      {technician.rating}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Especialidades:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {technician.specialties.map((specialty, index) => (
                      <Chip key={index} label={specialty} size="small" />
                    ))}
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Serviços oferecidos:
                </Typography>
                {technician.services.map((service, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2">{service.name}</Typography>
                    <Typography variant="body2">A partir de R$ {service.initialPrice.toFixed(2)}</Typography>
                  </Box>
                ))}
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => handleContactTechnician(technician._id)}
                >
                  Solicitar Serviço
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '64px' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Painel do Cliente
            </Typography>
            <Box>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleCreateTicket}
                sx={{ ml: 1 }}
              >
                Novo Chamado
              </Button>
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
              <Tab label="Todos os Chamados" />
              <Tab label="Chamados Ativos" />
              <Tab label="Chamados Concluídos" />
              <Tab label="Técnicos Próximos" />
            </Tabs>
          </Paper>
          
          {getTabContent()}
        </Container>
      </Box>
    </Box>
  );
}

export default ClientDashboard;