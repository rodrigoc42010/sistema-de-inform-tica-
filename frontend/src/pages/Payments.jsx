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
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  CreditCard as CreditCardIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';
import { selectUser } from '../selectors/authSelectors';
import { setUser } from '../features/auth/authSlice';
import adsService from '../features/ads/adsService';
import axios from '../api/axios';

function Payments() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [openAddMethodDialog, setOpenAddMethodDialog] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Charge Dialog State
  const [openChargeDialog, setOpenChargeDialog] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [pixKey, setPixKey] = useState('');

  // Estados para compra de remoção de anúncios
  const [monthsAdFree, setMonthsAdFree] = useState(1);
  const [purchasingAdFree, setPurchasingAdFree] = useState(false);
  const isAdFree = user ? (user.isAdFree !== undefined ? user.isAdFree : (user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false)) : false;
  const adFreeUntilStr = user?.adFreeUntil ? new Date(user.adFreeUntil).toLocaleDateString() : null;

  // States do formulário de "Adicionar Método de Pagamento"
  const [methodType, setMethodType] = useState('credit_card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Dados carregados da API
  const [apiPayments, setApiPayments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [filters, setFilters] = useState({ q: '', method: 'all', status: 'all', from: '', to: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportData, setReportData] = useState({ rows: [], groupBy: 'month' });
  const [reportGroupBy, setReportGroupBy] = useState('month');

  // Mock data para fallback local
  const clientPayments = [
    {
      id: 1,
      ticketId: 'TK-2023-001',
      description: 'Formatação de Computador',
      technician: 'João Silva',
      amount: 150.0,
      status: 'pending',
      date: '2023-10-15',
      dueDate: '2023-10-25',
    },
    {
      id: 2,
      ticketId: 'TK-2023-002',
      description: 'Instalação de Software',
      technician: 'Maria Oliveira',
      amount: 80.0,
      status: 'paid',
      date: '2023-09-28',
      paidDate: '2023-09-30',
      paymentMethod: 'credit_card',
    },
    {
      id: 3,
      ticketId: 'TK-2023-003',
      description: 'Limpeza de Hardware',
      technician: 'Carlos Santos',
      amount: 120.0,
      status: 'paid',
      date: '2023-09-10',
      paidDate: '2023-09-12',
      paymentMethod: 'pix',
    },
  ];

  const technicianPayments = [
    {
      id: 1,
      ticketId: 'TK-2023-001',
      description: 'Formatação de Computador',
      client: 'Ana Souza',
      amount: 150.0,
      fee: 15.0,
      netAmount: 135.0,
      status: 'pending',
      date: '2023-10-15',
    },
    {
      id: 2,
      ticketId: 'TK-2023-002',
      description: 'Instalação de Software',
      client: 'Pedro Almeida',
      amount: 80.0,
      fee: 8.0,
      netAmount: 72.0,
      status: 'completed',
      date: '2023-09-28',
      paidDate: '2023-10-05',
    },
    {
      id: 3,
      ticketId: 'TK-2023-003',
      description: 'Limpeza de Hardware',
      client: 'Mariana Costa',
      amount: 120.0,
      fee: 12.0,
      netAmount: 108.0,
      status: 'completed',
      date: '2023-09-10',
      paidDate: '2023-09-17',
    },
  ];

  const paymentsSource = apiPayments.length ? apiPayments : (user?.role === 'client' ? clientPayments : technicianPayments);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (!user?.token) return;
        setLoadingData(true);
        const params = {};
        if (filters.q) params.q = filters.q;
        if (filters.method && filters.method !== 'all') params.method = filters.method;
        if (filters.status && filters.status !== 'all') params.status = filters.status;
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        const resp = await axios.get('/api/payments', { params, headers: { Authorization: `Bearer ${user.token}` } });
        setApiPayments(Array.isArray(resp.data?.items) ? resp.data.items : []);
      } catch (e) {
        setApiPayments([]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchPayments();
  }, [user?.token, filters]);

  // Load PIX key from user profile
  useEffect(() => {
    if (user?.pixKey) {
      setPixKey(user.pixKey);
    }
  }, [user]);

  const filteredPayments = useMemo(() => {
    let rows = paymentsSource;

    if (activeTab === 1) {
      rows = rows.filter((p) => ['pending', 'pendente'].includes(p.status));
    } else if (activeTab === 2) {
      rows = rows.filter((p) => (user?.role === 'client' ? ['paid', 'pago'].includes(p.status) : ['completed', 'recebido'].includes(p.status)));
    }

    if (filterQuery || filters.q) {
      const q = (filters.q || filterQuery).toLowerCase();
      rows = rows.filter((p) => {
        const who = user?.role === 'client' ? p.technician : p.client;
        return [p.description, who, p.ticketId].some((val) => (val || '').toString().toLowerCase().includes(q));
      });
    }

    const m = filters.method || filterMethod;
    if (user?.role === 'client' && m !== 'all') {
      rows = rows.filter((p) => (p.paymentMethod || 'none') === m);
    }

    if (filters.status && filters.status !== 'all') {
      const st = filters.status;
      rows = rows.filter((p) => [st].includes(p.status));
    }

    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;
    if (from) rows = rows.filter((p) => new Date(p.date) >= from);
    if (to) rows = rows.filter((p) => new Date(p.date) <= to);

    return rows;
  }, [paymentsSource, activeTab, filterQuery, filterMethod, user?.role, filters]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenPaymentDialog = (payment) => {
    setSelectedPayment(payment);
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
  };

  const handleOpenReceiptDialog = (payment) => {
    setSelectedPayment(payment);
    setOpenReceiptDialog(true);
  };

  // Menu de ações (status)
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionPayment, setActionPayment] = useState(null);
  const actionsOpen = Boolean(anchorEl);
  const openActions = (evt, p) => { setAnchorEl(evt.currentTarget); setActionPayment(p); };
  const closeActions = () => { setAnchorEl(null); setActionPayment(null); };
  const applyStatus = async (newStatus) => {
    try {
      if (!user?.token || !actionPayment?.id) return;
      await axios.put(`/api/payments/${actionPayment.id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${user.token}` } });
      setApiPayments((prev) => prev.map((it) => it.id === actionPayment.id ? { ...it, status: newStatus } : it));
    } catch { }
    finally { closeActions(); }
  };

  const handleCloseReceiptDialog = () => {
    setOpenReceiptDialog(false);
  };

  const handleMakePayment = () => {
    handleClosePaymentDialog();
  };

  const handleOpenChargeDialog = (payment) => {
    setSelectedPayment(payment);
    setSelectedPaymentMethod('pix');
    setOpenChargeDialog(true);
  };

  const handleCloseChargeDialog = () => {
    setOpenChargeDialog(false);
    setChargeLoading(false);
  };

  const handleSendReminder = async () => {
    try {
      setChargeLoading(true);
      await axios.post(`/api/payments/${selectedPayment.id}/remind`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      setSnackbar({ open: true, message: 'Lembrete enviado com sucesso!', severity: 'success' });
      handleCloseChargeDialog();
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao enviar lembrete.', severity: 'error' });
    } finally {
      setChargeLoading(false);
    }
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setSnackbar({ open: true, message: 'Chave PIX copiada!', severity: 'success' });
  };

  const handleSendReceiptEmail = async () => {
    try {
      setChargeLoading(true);
      await axios.post(`/api/payments/${selectedPayment.id}/receipt`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      setSnackbar({ open: true, message: 'Recibo enviado por email!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao enviar recibo.', severity: 'error' });
    } finally {
      setChargeLoading(false);
    }
  };

  const handleOpenFilterDialog = () => setOpenFilterDialog(true);
  const handleCloseFilterDialog = () => setOpenFilterDialog(false);
  const handleApplyFilter = () => {
    setFilters({ q: filterQuery, method: filterMethod, status: filterStatus, from: filterFrom, to: filterTo });
    setOpenFilterDialog(false);
  };
  const handleClearFilter = () => {
    setFilterQuery('');
    setFilterMethod('all');
    setFilterStatus('all');
    setFilterFrom('');
    setFilterTo('');
    setFilters({ q: '', method: 'all', status: 'all', from: '', to: '' });
    setOpenFilterDialog(false);
  };

  const handleOpenAddMethodDialog = () => setOpenAddMethodDialog(true);
  const handleCloseAddMethodDialog = () => setOpenAddMethodDialog(false);
  const handleSavePaymentMethod = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setOpenAddMethodDialog(false);
    setSnackbar({ open: true, message: 'Método de pagamento salvo (demo).', severity: 'success' });
  };

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const getStatusChip = (status) => {
    let color = 'default';
    let label = status;

    switch (status) {
      case 'pending':
      case 'pendente':
        color = 'warning';
        label = 'Pendente';
        break;
      case 'paid':
      case 'pago':
      case 'completed':
      case 'recebido':
        color = 'success';
        label = 'Pago';
        break;
      case 'overdue':
        color = 'error';
        label = 'Atrasado';
        break;
      default:
        break;
    }

    return <Chip size="small" color={color} label={label} />;
  };

  const handlePurchaseAdFree = async () => {
    try {
      setPurchasingAdFree(true);
      const token = user?.token;
      if (!token) {
        setSnackbar({ open: true, message: 'Faça login novamente para concluir a compra.', severity: 'error' });
        return;
      }
      const res = await adsService.purchaseAdRemoval({ months: monthsAdFree, token });
      const adFreeUntil = res?.adFreeUntil;
      const updatedUser = { ...user, adFreeUntil, isAdFree: adFreeUntil ? new Date(adFreeUntil) > new Date() : false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch(setUser(updatedUser));
      const amountStr = typeof res?.amountCharged === 'number' ? res.amountCharged.toFixed(2) : res?.amountCharged;
      setSnackbar({ open: true, message: `Ad-free ativado até ${new Date(adFreeUntil).toLocaleDateString()} (${res?.currency || 'BRL'} ${amountStr})`, severity: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao processar a compra.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setPurchasingAdFree(false);
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'debit_card':
        return 'Cartão de Débito';
      case 'pix':
        return 'PIX';
      case 'bank_transfer':
        return 'Transferência Bancária';
      default:
        return method;
    }
  };

  // Generate PIX payload for QR Code
  const generatePixPayload = () => {
    if (!pixKey || !selectedPayment) return '';

    // Simplified PIX payload (in production, use proper EMV format)
    const payload = `PIX|${pixKey}|${selectedPayment.amount.toFixed(2)}|${selectedPayment.description}`;
    return payload;
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
                {user?.role === 'client' ? 'Meus Pagamentos' : 'Meus Recebimentos'}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  sx={{ mr: 1 }}
                  onClick={handleOpenFilterDialog}
                >
                  Filtrar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => setOpenReportDialog(true)}
                >
                  Relatório
                </Button>
                {user?.role === 'client' && (
                  <Button
                    variant="contained"
                    startIcon={<CreditCardIcon />}
                    onClick={handleOpenAddMethodDialog}
                  >
                    Adicionar Método de Pagamento
                  </Button>
                )}
              </Box>
            </Box>

            {user?.role === 'client' ? (
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="payment tabs"
                >
                  <Tab label="Todos" />
                  <Tab label="Pendentes" />
                  <Tab label="Pagos" />
                </Tabs>
              </Box>
            ) : (
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="payment tabs"
                >
                  <Tab label="Todos" />
                  <Tab label="Pendentes" />
                  <Tab label="Recebidos" />
                </Tabs>
              </Box>
            )}

            {/* Card de Ad-free (somente cliente) */}
            {user?.role === 'client' && (
              <Card sx={{ mb: 3, background: isAdFree ? 'linear-gradient(90deg, #e8f5e9, #ffffff)' : undefined }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="h6">Remoção de Anúncios</Typography>
                      {isAdFree ? (
                        <Typography variant="body2" color="success.main">Você está sem anúncios até {adFreeUntilStr}.</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Ative a experiência sem anúncios por um valor mensal.</Typography>
                      )}
                    </Box>
                    {!isAdFree && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          select
                          size="small"
                          label="Meses"
                          value={monthsAdFree}
                          onChange={(e) => setMonthsAdFree(Number(e.target.value))}
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value={1}>1 mês</MenuItem>
                          <MenuItem value={3}>3 meses</MenuItem>
                          <MenuItem value={6}>6 meses</MenuItem>
                          <MenuItem value={12}>12 meses</MenuItem>
                        </TextField>
                        <Button variant="contained" startIcon={<CreditCardIcon />} onClick={handlePurchaseAdFree} disabled={purchasingAdFree}>
                          {purchasingAdFree ? 'Processando...' : 'Remover anúncios'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Resumo financeiro */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {user?.role === 'client' ? 'Total Pago' : 'Total Recebido'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoneyIcon color="success" sx={{ mr: 1, fontSize: 40 }} />
                      <Typography variant="h4">
                        R$ {user?.role === 'client'
                          ? paymentsSource.filter((p) => ['paid', 'pago'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)
                          : paymentsSource.filter((p) => ['completed', 'recebido'].includes(p.status)).reduce((sum, p) => sum + (p.netAmount || p.amount || 0), 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {user?.role === 'client' ? 'Pendente' : 'A Receber'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountBalanceIcon color="warning" sx={{ mr: 1, fontSize: 40 }} />
                      <Typography variant="h4">
                        R$ {user?.role === 'client'
                          ? paymentsSource.filter((p) => ['pending', 'pendente'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)
                          : paymentsSource.filter((p) => ['pending', 'pendente'].includes(p.status)).reduce((sum, p) => sum + (p.netAmount || p.amount || 0), 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {user?.role === 'client' ? 'Total de Pagamentos' : 'Total de Serviços'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ReceiptIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                      <Typography variant="h4">{paymentsSource.length}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabela de pagamentos */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Descrição</TableCell>
                    {user?.role === 'client' ? (
                      <TableCell>Técnico</TableCell>
                    ) : (
                      <TableCell>Cliente</TableCell>
                    )}
                    <TableCell>Data</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    {user?.role === 'technician' && (
                      <TableCell align="right">Taxa</TableCell>
                    )}
                    {user?.role === 'technician' && (
                      <TableCell align="right">Valor Líquido</TableCell>
                    )}
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.ticketId}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      {user?.role === 'client' ? (
                        <TableCell>{payment.technician}</TableCell>
                      ) : (
                        <TableCell>{payment.client}</TableCell>
                      )}
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">R$ {payment.amount.toFixed(2)}</TableCell>
                      {user?.role === 'technician' && (
                        <TableCell align="right">R$ {payment.fee.toFixed(2)}</TableCell>
                      )}
                      {user?.role === 'technician' && (
                        <TableCell align="right">R$ {payment.netAmount.toFixed(2)}</TableCell>
                      )}
                      <TableCell>{getStatusChip(payment.status)}</TableCell>
                      <TableCell align="center">
                        {user?.role === 'client' && payment.status === 'pending' && (
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenPaymentDialog(payment)}
                            size="small"
                          >
                            <CreditCardIcon />
                          </IconButton>
                        )}
                        {user?.role === 'technician' && payment.status === 'pending' && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<AttachMoneyIcon />}
                            onClick={() => handleOpenChargeDialog(payment)}
                            sx={{ mr: 1 }}
                          >
                            Cobrar
                          </Button>
                        )}
                        {((user?.role === 'client' && payment.status === 'paid') ||
                          (user?.role === 'technician' && payment.status === 'completed')) && (
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenReceiptDialog(payment)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          )}
                        {((user?.role === 'client' && payment.status === 'paid') ||
                          (user?.role === 'technician' && payment.status === 'completed')) && (
                            <IconButton color="primary" size="small">
                              <DownloadIcon />
                            </IconButton>
                          )}
                        <IconButton color="primary" size="small" onClick={(e) => openActions(e, payment)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>
      </Box>

      {/* Menu de ações */}
      <Menu anchorEl={anchorEl} open={actionsOpen} onClose={closeActions}>
        <MenuItem onClick={() => applyStatus(user?.role === 'technician' ? 'recebido' : 'pago')}>{user?.role === 'technician' ? 'Marcar como Recebido' : 'Marcar como Pago'}</MenuItem>
        <MenuItem onClick={() => applyStatus('pendente')}>Marcar como Pendente</MenuItem>
        <MenuItem onClick={() => applyStatus('cancelado')}>Marcar como Cancelado</MenuItem>
      </Menu>

      {/* Dialog para realizar pagamento */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog}>
        <DialogTitle>Realizar Pagamento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Escolha o método de pagamento para o serviço: {selectedPayment?.description}
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Método de Pagamento"
              defaultValue="credit_card"
              margin="normal"
            >
              <MenuItem value="credit_card">Cartão de Crédito</MenuItem>
              <MenuItem value="debit_card">Cartão de Débito</MenuItem>
              <MenuItem value="pix">PIX</MenuItem>
              <MenuItem value="bank_transfer">Transferência Bancária</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Valor"
              type="number"
              value={selectedPayment?.amount}
              InputProps={{
                readOnly: true,
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
              }}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancelar</Button>
          <Button onClick={handleMakePayment} variant="contained" color="primary">
            Pagar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Cobrança com PIX */}
      <Dialog open={openChargeDialog} onClose={handleCloseChargeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cobrar Cliente</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>{selectedPayment?.description}</strong>
            <br />
            Valor: R$ {selectedPayment?.amount?.toFixed(2)}
          </DialogContentText>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Escolha o método de pagamento:</Typography>
          <RadioGroup value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)}>
            <FormControlLabel value="pix" control={<Radio />} label="PIX (Recomendado)" />
            <FormControlLabel value="card" control={<Radio />} label="Cartão de Crédito/Débito" />
            <FormControlLabel value="transfer" control={<Radio />} label="Transferência Bancária" />
          </RadioGroup>

          {selectedPaymentMethod === 'pix' && (
            <Box sx={{ mt: 3, p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
              {pixKey ? (
                <>
                  <Typography variant="h6" gutterBottom>QR Code PIX</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <QRCodeSVG value={generatePixPayload()} size={200} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chave PIX: {pixKey}
                  </Typography>
                  <Button
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyPixKey}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Copiar Chave PIX
                  </Button>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    O cliente pode escanear o QR Code ou copiar a chave PIX para realizar o pagamento
                  </Typography>
                </>
              ) : (
                <Alert severity="warning">
                  Você precisa cadastrar uma chave PIX no seu perfil para usar esta opção.
                </Alert>
              )}
            </Box>
          )}

          {selectedPaymentMethod === 'card' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Envie o link de pagamento por cartão para o cliente.
            </Alert>
          )}

          {selectedPaymentMethod === 'transfer' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Envie seus dados bancários para o cliente realizar a transferência.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChargeDialog}>Fechar</Button>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={handleSendReminder}
            disabled={chargeLoading}
          >
            {chargeLoading ? 'Enviando...' : 'Enviar Lembrete por Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para visualizar recibo (Melhorado) */}
      <Dialog
        open={openReceiptDialog}
        onClose={handleCloseReceiptDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
          Recibo #{selectedPayment?.ticketId}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Paper elevation={0} sx={{ p: 4, border: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Box>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>TechAssist</Typography>
                <Typography variant="caption" color="text.secondary">Soluções em Informática</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="overline" display="block" gutterBottom>RECIBO DE PAGAMENTO</Typography>
                <Typography variant="h6" color="success.main">PAGO</Typography>
              </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">DE</Typography>
                <Typography variant="subtitle2">{selectedPayment?.technician}</Typography>
                <Typography variant="body2" color="text.secondary">Técnico Especializado</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">PARA</Typography>
                <Typography variant="subtitle2">{selectedPayment?.client}</Typography>
                <Typography variant="body2" color="text.secondary">Cliente</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Grid container>
                <Grid item xs={8}>
                  <Typography variant="subtitle2">Descrição</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2">Valor</Typography>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Grid container>
                <Grid item xs={8}>
                  <Typography variant="body2">{selectedPayment?.description}</Typography>
                  <Typography variant="caption" color="text.secondary">Ticket: {selectedPayment?.ticketId}</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">R$ {selectedPayment?.amount?.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Grid container sx={{ mb: 4 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Data do Pagamento</Typography>
                <Typography variant="body2">
                  {selectedPayment?.paidDate ? new Date(selectedPayment.paidDate).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total</Typography>
                <Typography variant="h5" color="primary">R$ {selectedPayment?.amount?.toFixed(2)}</Typography>
              </Grid>
            </Grid>

            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="caption">Obrigado pela preferência!</Typography>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #ddd' }}>
          <Button onClick={handleCloseReceiptDialog}>Fechar</Button>
          <Button startIcon={<EmailIcon />} onClick={handleSendReceiptEmail} disabled={chargeLoading}>
            {chargeLoading ? 'Enviando...' : 'Enviar por Email'}
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Baixar PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de filtros */}
      <Dialog
        open={openFilterDialog}
        onClose={handleCloseFilterDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filtros</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Buscar (descrição, pessoa, ID)"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            margin="normal"
          />
          {user?.role === 'client' && (
            <TextField
              select
              fullWidth
              label="Método de Pagamento"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              margin="normal"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="credit_card">Cartão de Crédito</MenuItem>
              <MenuItem value="debit_card">Cartão de Débito</MenuItem>
              <MenuItem value="pix">PIX</MenuItem>
              <MenuItem value="bank_transfer">Transferência Bancária</MenuItem>
              <MenuItem value="none">Sem método</MenuItem>
            </TextField>
          )}
          <TextField
            select
            fullWidth
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            margin="normal"
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pendente">Pendente</MenuItem>
            <MenuItem value="pago">Pago</MenuItem>
            <MenuItem value="recebido">Recebido</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
          </TextField>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="De"
                InputLabelProps={{ shrink: true }}
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Até"
                InputLabelProps={{ shrink: true }}
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFilterDialog}>Fechar</Button>
          <Button onClick={handleClearFilter}>Limpar</Button>
          <Button onClick={handleApplyFilter} variant="contained">Aplicar</Button>
        </DialogActions>
      </Dialog>

      {/* Relatório de pagamentos */}
      <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Relatório de Pagamentos</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Agrupar por" value={reportGroupBy} onChange={(e) => setReportGroupBy(e.target.value)}>
                <MenuItem value="day">Dia</MenuItem>
                <MenuItem value="month">Mês</MenuItem>
                <MenuItem value="year">Ano</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="De" InputLabelProps={{ shrink: true }} value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="Até" InputLabelProps={{ shrink: true }} value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
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
                {(reportData.rows || []).map((r) => (
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
          <Button onClick={() => setOpenReportDialog(false)}>Fechar</Button>
          <Button onClick={async () => {
            try {
              if (!user?.token) return;
              const params = { groupBy: reportGroupBy };
              if (filterFrom) params.from = filterFrom;
              if (filterTo) params.to = filterTo;
              const resp = await axios.get('/api/payments/report', { params, headers: { Authorization: `Bearer ${user.token}` } });
              setReportData(resp.data || { rows: [] });
            } catch { }
          }} variant="contained">Gerar</Button>
          <Button onClick={() => {
            const rows = reportData.rows || [];
            const csv = ['period,count,total'].concat(rows.map(r => `${r.period},${r.count},${r.total}`)).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'relatorio-pagamentos.csv'; a.click(); URL.revokeObjectURL(url);
          }} startIcon={<DownloadIcon />}>Exportar CSV</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para adicionar método de pagamento */}
      <Dialog
        open={openAddMethodDialog}
        onClose={handleCloseAddMethodDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Tipo"
            value={methodType}
            onChange={(e) => setMethodType(e.target.value)}
            margin="normal"
          >
            <MenuItem value="credit_card">Cartão de Crédito</MenuItem>
            <MenuItem value="debit_card">Cartão de Débito</MenuItem>
            <MenuItem value="pix">PIX</MenuItem>
            <MenuItem value="bank_transfer">Transferência Bancária</MenuItem>
          </TextField>

          {(methodType === 'credit_card' || methodType === 'debit_card') && (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Nome no Cartão"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Número do Cartão"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                margin="normal"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Validade (MM/AA)"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddMethodDialog}>Cancelar</Button>
          <Button onClick={handleSavePaymentMethod} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Payments;