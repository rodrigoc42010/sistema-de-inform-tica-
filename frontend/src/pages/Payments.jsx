import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  CreditCard as CreditCardIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { selectUser } from '../selectors/authSelectors';
import { setUser } from '../features/auth/authSlice';
import adsService from '../features/ads/adsService';

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
  
  // Mock data para pagamentos
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

  const payments = user?.role === 'client' ? clientPayments : technicianPayments;

  const filteredPayments = useMemo(() => {
    let rows = payments;

    if (activeTab === 1) {
      rows = rows.filter((p) => p.status === 'pending');
    } else if (activeTab === 2) {
      rows = rows.filter((p) => (user?.role === 'client' ? p.status === 'paid' : p.status === 'completed'));
    }

    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      rows = rows.filter((p) => {
        const who = user?.role === 'client' ? p.technician : p.client;
        return [p.description, who, p.ticketId].some((val) => (val || '').toString().toLowerCase().includes(q));
      });
    }

    if (user?.role === 'client' && filterMethod !== 'all') {
      rows = rows.filter((p) => (p.paymentMethod || 'none') === filterMethod);
    }

    return rows;
  }, [payments, activeTab, filterQuery, filterMethod, user?.role]);

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

  const handleCloseReceiptDialog = () => {
    setOpenReceiptDialog(false);
  };

  const handleMakePayment = () => {
    // Lógica para processar o pagamento
    handleClosePaymentDialog();
    // Atualizar o estado ou fazer uma chamada API
  };

  const handleOpenFilterDialog = () => setOpenFilterDialog(true);
  const handleCloseFilterDialog = () => setOpenFilterDialog(false);
  const handleApplyFilter = () => setOpenFilterDialog(false);
  const handleClearFilter = () => {
    setFilterQuery('');
    setFilterMethod('all');
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
        color = 'warning';
        label = 'Pendente';
        break;
      case 'paid':
      case 'completed':
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
                          ? payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)
                          : payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.netAmount, 0).toFixed(2)}
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
                          ? payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toFixed(2)
                          : payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.netAmount, 0).toFixed(2)}
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
                      <Typography variant="h4">{payments.length}</Typography>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>
      </Box>

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

      {/* Dialog para visualizar recibo */}
      <Dialog 
        open={openReceiptDialog} 
        onClose={handleCloseReceiptDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Recibo de Pagamento</DialogTitle>
        <DialogContent>
          <Paper elevation={0} sx={{ p: 2, border: '1px dashed #ccc' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h5">TechAssist</Typography>
              <Typography variant="body2">Sistema de Assistência Técnica</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">RECIBO DE PAGAMENTO</Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">Número: {selectedPayment?.ticketId}</Typography>
              <Typography variant="body1">
                Data de Pagamento: {selectedPayment?.paidDate ? new Date(selectedPayment.paidDate).toLocaleDateString() : '-'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">Serviço: {selectedPayment?.description}</Typography>
              {user?.role === 'client' ? (
                <Typography variant="body1">Técnico: {selectedPayment?.technician}</Typography>
              ) : (
                <Typography variant="body1">Cliente: {selectedPayment?.client}</Typography>
              )}
              <Typography variant="body1">
                Método de Pagamento: {selectedPayment?.paymentMethod ? getPaymentMethodLabel(selectedPayment.paymentMethod) : '-'}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right', mt: 3 }}>
              <Typography variant="h6">
                Valor Total: R$ {selectedPayment?.amount?.toFixed(2)}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', mt: 4, pt: 4, borderTop: '1px dashed #ccc' }}>
              <Typography variant="body2">Este recibo é a confirmação de pagamento pelo serviço prestado.</Typography>
              <Typography variant="body2">TechAssist - CNPJ: 12.345.678/0001-90</Typography>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReceiptDialog}>Fechar</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Download PDF
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFilterDialog}>Fechar</Button>
          <Button onClick={handleClearFilter}>Limpar</Button>
          <Button onClick={handleApplyFilter} variant="contained">Aplicar</Button>
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

          {(methodType === 'pix' || methodType === 'bank_transfer') && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Este é um mock: ao salvar, consideraremos que o método foi cadastrado com sucesso.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddMethodDialog}>Cancelar</Button>
          <Button onClick={handleSavePaymentMethod} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Payments;