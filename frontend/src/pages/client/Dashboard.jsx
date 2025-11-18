import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
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
import { getTickets, reset as resetTickets } from '../../features/tickets/ticketSlice';
import { getNearbyTechnicians, reset as resetTechnicians } from '../../features/technicians/technicianSlice';

function ClientDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [showEmailVerificationAlert, setShowEmailVerificationAlert] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const {
    tickets,
    isLoading: isLoadingTickets,
    isError: isErrorTickets,
    message: messageTickets
  } = useSelector((state) => state.tickets);

  const {
    technicians: nearbyTechnicians,
    isLoading: isLoadingTechnicians,
    isError: isErrorTechnicians,
    message: messageTechnicians
  } = useSelector((state) => state.technicians);

  useEffect(() => {
    if (isErrorTickets) {
      toast.error(messageTickets);
    }
  }, [isErrorTickets, messageTickets]);

  useEffect(() => {
    if (!user?.token) return;

    const userLocation = { lat: -23.55052, lng: -46.633308 };

    dispatch(getTickets());
    dispatch(getNearbyTechnicians(userLocation));

    if (user && user.isNewUser && !user.isVerified) {
      setShowEmailVerificationAlert(true);
    }

    return () => {
      dispatch(resetTickets());
      dispatch(resetTechnicians());
    };
  }, [dispatch, user?.token]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    if (!user?.token) return;
    const userLocation = { lat: -23.55052, lng: -46.633308 };
    dispatch(getTickets());
    dispatch(getNearbyTechnicians(userLocation));
  };

  const [openReport, setOpenReport] = useState(false);
  const [groupBy, setGroupBy] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reportRows, setReportRows] = useState([]);
  const generateReport = async () => {
    try {
      const token = user?.token; if (!token) return;
      const params = { groupBy };
      if (from) params.from = from; if (to) params.to = to;
      const resp = await fetch('/api/tickets/report/summary?'+new URLSearchParams(params).toString(), { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      setReportRows(data?.rows || []);
    } catch { setReportRows([]); }
  };

  if (isLoadingTickets || isLoadingTechnicians) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  const handleCreateTicket = () => {
    // Navegação para a página de criação de chamado
    navigate('/client/new-ticket');
  };

  const handleViewTicket = (ticketId) => {
    // Navegação para a página de detalhes do chamado
    navigate(`/client/ticket/${ticketId}`);
  };

  const handleContactTechnician = (technicianId) => {
    // Navegação para a página de criação de chamado com técnico pré-selecionado
    navigate(`/client/new-ticket?technician=${technicianId}`);
  };

  const handleApproveFromList = (ticketId) => {
    // Simula aprovação rápida no dashboard
    toast.success('Serviços aprovados!');
    navigate(`/client/ticket/${ticketId}`);
  };

  const handleRejectFromList = (ticketId) => {
    // Simula reprovação rápida no dashboard
    toast.info('Serviços rejeitados.');
    navigate(`/client/ticket/${ticketId}`);
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
    if (isLoadingTickets) {
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
                    <Button size="small" color="primary" onClick={() => handleApproveFromList(ticket._id)}>
                      Aprovar
                    </Button>
                    <Button size="small" color="error" onClick={() => handleRejectFromList(ticket._id)}>
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
    if (isLoadingTechnicians) {
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
      {/* Aplicar offset do Drawer em telas >= sm e espaçamentos responsivos */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 4, lg: 5 },
          width: { sm: 'calc(100% - 240px)' }, 
          ml: { sm: '240px' },
          mt: '64px',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: '100%', px: { xs: 1, md: 2, lg: 3 } }}>
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
              Painel do Cliente
            </Typography>
          <Box>
            <IconButton onClick={handleRefresh} disabled={isLoadingTickets || isLoadingTechnicians}>
              <RefreshIcon />
            </IconButton>
            <Button variant="outlined" sx={{ ml: 1 }} onClick={()=>setOpenReport(true)}>Relatório</Button>
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
          
          <Paper sx={{ mb: 3, borderRadius: 3, p: { xs: 1, md: 2 } }} elevation={2}>
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
      <Dialog open={openReport} onClose={()=>setOpenReport(false)} maxWidth="md" fullWidth>
        <DialogTitle>Relatório de Chamados</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Agrupar por" value={groupBy} onChange={(e)=>setGroupBy(e.target.value)}>
                <MenuItem value="day">Dia</MenuItem>
                <MenuItem value="month">Mês</MenuItem>
                <MenuItem value="year">Ano</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="De" InputLabelProps={{ shrink: true }} value={from} onChange={(e)=>setFrom(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="Até" InputLabelProps={{ shrink: true }} value={to} onChange={(e)=>setTo(e.target.value)} />
            </Grid>
          </Grid>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Período</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Total (R$)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportRows.map((r)=> (
                  <TableRow key={r.period}>
                    <TableCell>{r.period}</TableCell>
                    <TableCell align="right">{r.count}</TableCell>
                    <TableCell align="right">{Number(r.total || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenReport(false)}>Fechar</Button>
          <Button onClick={generateReport} variant="contained">Gerar</Button>
          <Button onClick={()=>{
            const csv = ['period,count,total'].concat(reportRows.map(r=>`${r.period},${r.count},${r.total}`)).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='relatorio-chamados.csv'; a.click(); URL.revokeObjectURL(url);
          }} startIcon={<RefreshIcon />}>Exportar CSV</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClientDashboard;