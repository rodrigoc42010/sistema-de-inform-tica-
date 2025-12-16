import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Menu,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  AttachMoney,
  CreditCard,
  Download,
  FilterList,
  Visibility,
  Receipt,
  AccountBalance,
  MoreVert,
  Email,
  QrCode,
  ContentCopy,
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  Search,
  CheckCircle,
  Cancel,
  AccessTime,
  Paid,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';
import { selectUser } from '../selectors/authSelectors';
import { setUser } from '../features/auth/authSlice';
import adsService from '../features/ads/adsService';
import axios from '../api/axios';

// --- Components ---

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <Paper
    className="glass-card-premium"
    sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden' }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -10,
        right: -10,
        opacity: 0.1,
        transform: 'rotate(15deg)',
      }}
    >
      <Icon sx={{ fontSize: 100, color: color }} />
    </Box>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20`, color: color }}
      >
        <Icon />
      </Box>
      {trend && (
        <Chip
          label={trend}
          size="small"
          color={trend.includes('+') ? 'success' : 'error'}
          variant="outlined"
          sx={{ fontWeight: 'bold', bgcolor: 'rgba(0,0,0,0.2)' }}
        />
      )}
    </Box>
    <Typography
      variant="h4"
      fontWeight="800"
      sx={{ mb: 0.5, textShadow: `0 0 20px ${color}50` }}
    >
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" fontWeight="500">
      {title}
    </Typography>
  </Paper>
);

const SimpleBarChart = ({ data, color }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        height: 150,
        gap: 1,
        pt: 2,
      }}
    >
      {data.map((d, i) => (
        <Tooltip key={i} title={`${d.label}: R$ ${d.value}`}>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: '100%',
                bgcolor: `${color}40`,
                borderRadius: '4px 4px 0 0',
                height: `${(d.value / max) * 100}%`,
                transition: 'all 0.5s ease',
                '&:hover': { bgcolor: color, boxShadow: `0 0 15px ${color}` },
                minHeight: 4,
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.7rem' }}
            >
              {d.label}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};

function Payments() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);

  // Charge State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [pixKey, setPixKey] = useState('');

  // Ad-Free State
  const [monthsAdFree, setMonthsAdFree] = useState(1);
  const [purchasingAdFree, setPurchasingAdFree] = useState(false);
  const isAdFree = user
    ? user.isAdFree !== undefined
      ? user.isAdFree
      : user.adFreeUntil
        ? new Date(user.adFreeUntil) > new Date()
        : false
    : false;
  const adFreeUntilStr = user?.adFreeUntil
    ? new Date(user.adFreeUntil).toLocaleDateString()
    : null;

  // Mock Data for Fallback
  const mockPayments = useMemo(() => {
    const base = [
      {
        id: 1,
        ticketId: 'TK-001',
        description: 'Formatação PC',
        amount: 150,
        status: 'pending',
        date: '2023-10-15',
        technician: 'João Silva',
        client: 'Ana Souza',
      },
      {
        id: 2,
        ticketId: 'TK-002',
        description: 'Instalação Office',
        amount: 80,
        status: 'paid',
        date: '2023-09-28',
        technician: 'Maria Oliveira',
        client: 'Pedro Almeida',
      },
      {
        id: 3,
        ticketId: 'TK-003',
        description: 'Troca de Tela',
        amount: 350,
        status: 'paid',
        date: '2023-09-10',
        technician: 'Carlos Santos',
        client: 'Mariana Lima',
      },
    ];
    return base;
  }, []);

  const [apiPayments, setApiPayments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: '',
  });

  useEffect(() => {
    // Carregar pagamentos reais da API
    const fetchPayments = async () => {
      if (!user?.token) return;
      setLoadingData(true);
      try {
        const response = await axios.get('/api/payments', {
          headers: { Authorization: `Bearer ${user.token}` },
          params: filters,
        });
        setApiPayments(response.data || []);
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        // Fallback para mock se falhar
        setApiPayments([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchPayments();
  }, [user, filters]);

  const payments = useMemo(() => {
    // Combinar mock com API se necessário, ou usar apenas API
    // Por enquanto, vamos usar o mock se a API estiver vazia para demonstração
    let data = apiPayments.length > 0 ? apiPayments : mockPayments;

    if (filters.status !== 'all') {
      data = data.filter((p) => p.status === filters.status);
    }
    if (filters.search) {
      const lower = filters.search.toLowerCase();
      data = data.filter(
        (p) =>
          p.description.toLowerCase().includes(lower) ||
          p.technician.toLowerCase().includes(lower) ||
          p.client.toLowerCase().includes(lower) ||
          p.ticketId.toLowerCase().includes(lower)
      );
    }
    return data;
  }, [apiPayments, mockPayments, filters]);

  const stats = useMemo(() => {
    const total = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const paid = payments
      .filter((p) => p.status === 'paid')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const pending = payments
      .filter((p) => p.status === 'pending')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { total, paid, pending };
  }, [payments]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBuyAdFree = async () => {
    if (!user?.token) return;
    setPurchasingAdFree(true);
    try {
      await adsService.purchaseAdFree(user.token, monthsAdFree);
      // Atualizar usuário no Redux
      const updatedUser = { ...user, isAdFree: true }; // Simplificação
      dispatch(setUser(updatedUser));
      setSnackbar({
        open: true,
        message: 'Plano Sem Anúncios ativado com sucesso!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao processar pagamento.',
        severity: 'error',
      });
    } finally {
      setPurchasingAdFree(false);
    }
  };

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [openChargeDialog, setOpenChargeDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [openAddMethodDialog, setOpenAddMethodDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleOpenPayment = (payment) => {
    setSelectedPayment(payment);
    setOpenPaymentDialog(true);
  };

  const handleOpenReceipt = (payment) => {
    setSelectedPayment(payment);
    setOpenReceiptDialog(true);
  };

  const handleOpenCharge = () => {
    setOpenChargeDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenPaymentDialog(false);
    setOpenReceiptDialog(false);
    setOpenChargeDialog(false);
    setOpenFilterDialog(false);
    setOpenAddMethodDialog(false);
    setSelectedPayment(null);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  // Componente de Filtros (Dialog)
  const FilterDialog = () => {
    const [tempFilters, setTempFilters] = useState(filters);

    const handleChange = (prop) => (event) => {
      setTempFilters({ ...tempFilters, [prop]: event.target.value });
    };

    const applyFilters = () => {
      setFilters(tempFilters);
      handleCloseDialogs();
    };

    return (
      <Dialog open={openFilterDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Filtrar Pagamentos</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Status"
              value={tempFilters.status}
              onChange={handleChange('status')}
              fullWidth
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendentes</MenuItem>
              <MenuItem value="paid">Pagos</MenuItem>
              <MenuItem value="overdue">Vencidos</MenuItem>
            </TextField>
            <TextField
              select
              label="Período"
              value={tempFilters.dateRange}
              onChange={handleChange('dateRange')}
              fullWidth
            >
              <MenuItem value="all">Todo o período</MenuItem>
              <MenuItem value="thisMonth">Este mês</MenuItem>
              <MenuItem value="lastMonth">Mês passado</MenuItem>
              <MenuItem value="thisYear">Este ano</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancelar</Button>
          <Button onClick={applyFilters} variant="contained">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const paymentsSource = apiPayments.length ? apiPayments : mockPayments;

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.token) return;
      setLoadingData(true);
      try {
        const resp = await axios.get('/api/payments', {
          params: filters,
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setApiPayments(Array.isArray(resp.data?.items) ? resp.data.items : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchPayments();
  }, [user?.token, filters]);

  useEffect(() => {
    if (user?.pixKey) setPixKey(user.pixKey);
  }, [user]);

  const filteredPayments = useMemo(() => {
    let rows = paymentsSource;
    if (activeTab === 1)
      rows = rows.filter((p) => ['pending', 'pendente'].includes(p.status));
    if (activeTab === 2)
      rows = rows.filter((p) =>
        ['paid', 'pago', 'completed', 'recebido'].includes(p.status)
      );

    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.description.toLowerCase().includes(q) ||
          p.ticketId.toLowerCase().includes(q) ||
          (p.client || '').toLowerCase().includes(q) ||
          (p.technician || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [paymentsSource, activeTab, filters]);

  // Chart Data (Last 6 months simulated)
  const chartData = [
    { label: 'Mai', value: stats.received * 0.4 },
    { label: 'Jun', value: stats.received * 0.6 },
    { label: 'Jul', value: stats.received * 0.5 },
    { label: 'Ago', value: stats.received * 0.8 },
    { label: 'Set', value: stats.received * 0.7 },
    { label: 'Out', value: stats.received },
  ];

  // Handlers
  const handlePurchaseAdFree = async () => {
    setPurchasingAdFree(true);
    try {
      const res = await adsService.purchaseAdRemoval({
        months: monthsAdFree,
        token: user.token,
      });
      const updatedUser = {
        ...user,
        adFreeUntil: res.adFreeUntil,
        isAdFree: true,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch(setUser(updatedUser));
      setSnackbar({
        open: true,
        message: 'Plano Ad-Free ativado com sucesso!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro ao processar compra.',
        severity: 'error',
      });
    } finally {
      setPurchasingAdFree(false);
    }
  };

  const generatePixPayload = () =>
    `PIX|${pixKey}|${selectedPayment?.amount?.toFixed(2)}|${selectedPayment?.description}`;

  const getStatusChip = (status) => {
    const config = {
      pending: { label: 'Pendente', color: 'warning', icon: AccessTime },
      pendente: { label: 'Pendente', color: 'warning', icon: AccessTime },
      paid: { label: 'Pago', color: 'success', icon: CheckCircle },
      pago: { label: 'Pago', color: 'success', icon: CheckCircle },
      completed: { label: 'Recebido', color: 'success', icon: CheckCircle },
      recebido: { label: 'Recebido', color: 'success', icon: CheckCircle },
      overdue: { label: 'Atrasado', color: 'error', icon: Cancel },
    };
    const conf = config[status] || {
      label: status,
      color: 'default',
      icon: AccessTime,
    };
    const Icon = conf.icon;
    return (
      <Chip
        icon={<Icon fontSize="small" />}
        label={conf.label}
        color={conf.color}
        variant="outlined"
        size="small"
        sx={{ fontWeight: 'bold', borderRadius: 2 }}
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 4, ml: { sm: '240px' }, mt: '64px' }}
      >
        <Container maxWidth="xl">
          {/* Hero Section */}
          <Box sx={{ mb: 6, position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                left: -50,
                width: 300,
                height: 300,
                background:
                  'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                zIndex: 0,
              }}
            />
            <Typography
              variant="overline"
              color="secondary"
              sx={{ letterSpacing: 3, fontWeight: 'bold' }}
            >
              FINANCEIRO
            </Typography>
            <Typography
              variant="h3"
              fontWeight="800"
              sx={{
                background: 'linear-gradient(to right, #fff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {user?.role === 'client'
                ? 'Meus Pagamentos'
                : 'Gestão de Recebimentos'}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 600 }}
            >
              Acompanhe suas transações, gerencie pagamentos pendentes e
              visualize seu fluxo de caixa.
            </Typography>
          </Box>

          {/* Stats Grid */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <StatCard
                title={user?.role === 'client' ? 'Total Pago' : 'Receita Total'}
                value={`R$ ${stats.received.toFixed(2)}`}
                icon={Paid}
                color="#10b981"
                trend="+12% este mês"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title={user?.role === 'client' ? 'Pendente' : 'A Receber'}
                value={`R$ ${stats.pending.toFixed(2)}`}
                icon={AccountBalanceWallet}
                color="#f59e0b"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                className="glass-card-premium"
                sx={{ p: 3, height: '100%' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Fluxo Mensal
                  </Typography>
                  <TrendingUp color="primary" />
                </Box>
                <SimpleBarChart data={chartData} color="#06b6d4" />
              </Paper>
            </Grid>
          </Grid>

          {/* Ad-Free Banner (Client Only) */}
          {user?.role === 'client' && (
            <Paper
              className="glass-card-premium"
              sx={{
                p: 3,
                mb: 6,
                background: isAdFree
                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
                  : 'linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))',
                border: isAdFree
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <Grid container alignItems="center" spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '50%',
                        bgcolor: isAdFree ? 'success.main' : 'primary.main',
                      }}
                    >
                      <Visibility sx={{ color: '#fff' }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold">
                      {isAdFree ? 'Modo Premium Ativo' : 'Remova os Anúncios'}
                    </Typography>
                  </Box>
                  <Typography color="text.secondary">
                    {isAdFree
                      ? `Você está navegando sem interrupções até ${adFreeUntilStr}. Aproveite!`
                      : 'Tenha uma experiência mais limpa e focada apoiando a plataforma.'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                  {!isAdFree && (
                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="flex-end"
                    >
                      <TextField
                        select
                        size="small"
                        value={monthsAdFree}
                        onChange={(e) => setMonthsAdFree(e.target.value)}
                        className="premium-input"
                        sx={{ width: 120 }}
                      >
                        <MenuItem value={1}>1 Mês</MenuItem>
                        <MenuItem value={6}>6 Meses</MenuItem>
                        <MenuItem value={12}>1 Ano</MenuItem>
                      </TextField>
                      <Button
                        variant="contained"
                        onClick={handlePurchaseAdFree}
                        disabled={purchasingAdFree}
                        sx={{
                          borderRadius: 2,
                          background:
                            'linear-gradient(45deg, #06b6d4, #3b82f6)',
                        }}
                      >
                        {purchasingAdFree ? 'Processando...' : 'Assinar Agora'}
                      </Button>
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Main Content */}
          <Paper
            className="glass-card-premium"
            sx={{ borderRadius: 4, overflow: 'hidden' }}
          >
            {/* Toolbar */}
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  '& .MuiTab-root': { color: 'text.secondary', minHeight: 48 },
                  '& .Mui-selected': { color: '#06b6d4 !important' },
                  '& .MuiTabs-indicator': { bgcolor: '#06b6d4' },
                }}
              >
                <Tab label="Todos" />
                <Tab label="Pendentes" />
                <Tab label="Concluídos" />
              </Tabs>

              <Stack direction="row" spacing={2}>
                <TextField
                  placeholder="Buscar..."
                  size="small"
                  value={filters.q}
                  onChange={(e) => {
                    setFilters({ ...filters, q: e.target.value });
                  }}
                  className="premium-input"
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ color: 'text.secondary', mr: 1 }} />
                    ),
                  }}
                  sx={{ width: 250 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setOpenFilterDialog(true)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: 'text.secondary',
                  }}
                >
                  Filtros
                </Button>
                {user?.role === 'client' && (
                  <Button
                    variant="contained"
                    startIcon={<CreditCard />}
                    onClick={() => setOpenAddMethodDialog(true)}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
                    }}
                  >
                    Novo Cartão
                  </Button>
                )}
              </Stack>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <TableCell sx={{ color: 'text.secondary' }}>ID</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      Descrição
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {user?.role === 'client' ? 'Técnico' : 'Cliente'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>Data</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      Valor
                    </TableCell>
                    <TableCell align="center" sx={{ color: 'text.secondary' }}>
                      Status
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      Ações
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                    >
                      <TableCell
                        sx={{ fontFamily: 'monospace', color: 'primary.light' }}
                      >
                        {row.ticketId}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {row.description}
                      </TableCell>
                      <TableCell>
                        {user?.role === 'client' ? row.technician : row.client}
                      </TableCell>
                      <TableCell>
                        {new Date(row.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        R$ {row.amount.toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        {getStatusChip(row.status)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          {user?.role === 'technician' &&
                            ['pending', 'pendente'].includes(row.status) && (
                              <Tooltip title="Cobrar">
                                <IconButton
                                  color="primary"
                                  onClick={() => {
                                    setSelectedPayment(row);
                                    setOpenChargeDialog(true);
                                  }}
                                >
                                  <AttachMoney />
                                </IconButton>
                              </Tooltip>
                            )}
                          {user?.role === 'client' &&
                            ['pending', 'pendente'].includes(row.status) && (
                              <Tooltip title="Pagar">
                                <IconButton
                                  color="success"
                                  onClick={() => {
                                    setSelectedPayment(row);
                                    setOpenPaymentDialog(true);
                                  }}
                                >
                                  <CreditCard />
                                </IconButton>
                              </Tooltip>
                            )}
                          {['paid', 'pago', 'completed', 'recebido'].includes(
                            row.status
                          ) && (
                            <Tooltip title="Recibo">
                              <IconButton
                                color="info"
                                onClick={() => {
                                  setSelectedPayment(row);
                                  setOpenReceiptDialog(true);
                                }}
                              >
                                <Receipt />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">
                          Nenhum registro encontrado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>
      </Box>

      {/* Dialogs */}
      <Dialog
        open={openChargeDialog}
        onClose={() => setOpenChargeDialog(false)}
        PaperProps={{ className: 'glass-card-premium' }}
      >
        <DialogTitle>Cobrar Cliente</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {selectedPayment?.description} - R${' '}
            {selectedPayment?.amount?.toFixed(2)}
          </DialogContentText>
          <RadioGroup
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          >
            <FormControlLabel
              value="pix"
              control={<Radio />}
              label="PIX (Instantâneo)"
            />
            <FormControlLabel
              value="card"
              control={<Radio />}
              label="Link de Pagamento"
            />
          </RadioGroup>
          {selectedPaymentMethod === 'pix' && (
            <Box
              sx={{
                mt: 2,
                textAlign: 'center',
                p: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
              }}
            >
              {pixKey ? (
                <>
                  <QRCodeSVG value={generatePixPayload()} size={180} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Chave: {pixKey}
                  </Typography>
                </>
              ) : (
                <Alert severity="warning">
                  Cadastre sua chave PIX no perfil.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChargeDialog(false)}>Fechar</Button>
          <Button variant="contained" startIcon={<Email />}>
            Enviar Cobrança
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Payments;
