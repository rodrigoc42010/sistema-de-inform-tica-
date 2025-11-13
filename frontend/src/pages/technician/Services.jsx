import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

// Material UI
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

// Componentes
import Sidebar from '../../components/Sidebar';

// Dados simulados (serão substituídos pela API)
const serviceCategories = [
  'Manutenção de Computadores',
  'Manutenção de Notebooks',
  'Manutenção de Impressoras',
  'Redes e Conectividade',
  'Instalação de Software',
  'Remoção de Vírus e Malware',
  'Recuperação de Dados',
  'Consultoria em TI',
  'Suporte Remoto',
  'Manutenção de Celulares',
  'Manutenção de Videogames',
  'Outros',
];

const initialServices = [
  {
    id: '1',
    name: 'Formatação de Computador',
    description: 'Formatação completa com backup de dados e instalação do sistema operacional.',
    category: 'Manutenção de Computadores',
    price: 120,
    estimatedTime: '2 horas',
    isActive: true,
  },
  {
    id: '2',
    name: 'Limpeza de Notebook',
    description: 'Limpeza interna e externa com troca de pasta térmica.',
    category: 'Manutenção de Notebooks',
    price: 100,
    estimatedTime: '1 hora',
    isActive: true,
  },
  {
    id: '3',
    name: 'Instalação de Programas',
    description: 'Instalação e configuração de programas básicos e específicos.',
    category: 'Instalação de Software',
    price: 80,
    estimatedTime: '1 hora',
    isActive: true,
  },
  {
    id: '4',
    name: 'Configuração de Rede Wi-Fi',
    description: 'Configuração de roteadores e dispositivos para conexão em rede.',
    category: 'Redes e Conectividade',
    price: 90,
    estimatedTime: '1 hora',
    isActive: true,
  },
  {
    id: '5',
    name: 'Recuperação de Arquivos Deletados',
    description: 'Recuperação de arquivos deletados acidentalmente ou por falha no sistema.',
    category: 'Recuperação de Dados',
    price: 150,
    estimatedTime: '3 horas',
    isActive: false,
  },
];

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentService, setCurrentService] = useState({
    id: '',
    name: '',
    description: '',
    category: '',
    price: '',
    estimatedTime: '',
    isActive: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Aqui seria implementada a chamada à API para buscar os serviços do técnico
    // dispatch(getTechnicianServices());
    
    // Simulando carregamento
    setLoading(true);
    setTimeout(() => {
      setServices(initialServices);
      setLoading(false);
    }, 1000);
  }, [dispatch]);

  const handleOpenDialog = (service = null) => {
    if (service) {
      setCurrentService(service);
      setEditMode(true);
    } else {
      setCurrentService({
        id: '',
        name: '',
        description: '',
        category: '',
        price: '',
        estimatedTime: '',
        isActive: true,
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (service) => {
    setServiceToDelete(service);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setServiceToDelete(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentService({
      ...currentService,
      [name]: value,
    });
  };

  const handleSwitchChange = (e) => {
    setCurrentService({
      ...currentService,
      isActive: e.target.checked,
    });
  };

  const handleSubmit = () => {
    // Validação básica
    if (!currentService.name.trim()) {
      toast.error('O nome do serviço é obrigatório');
      return;
    }
    if (!currentService.category) {
      toast.error('A categoria é obrigatória');
      return;
    }
    if (!currentService.price || isNaN(currentService.price) || currentService.price <= 0) {
      toast.error('O preço deve ser um valor positivo');
      return;
    }

    if (editMode) {
      // Aqui seria implementada a chamada à API para atualizar o serviço
      // dispatch(updateService(currentService));
      
      // Simulando atualização
      const updatedServices = services.map((service) =>
        service.id === currentService.id ? currentService : service
      );
      setServices(updatedServices);
      toast.success('Serviço atualizado com sucesso!');
    } else {
      // Aqui seria implementada a chamada à API para criar o serviço
      // dispatch(createService(currentService));
      
      // Simulando criação
      const newService = {
        ...currentService,
        id: Date.now().toString(),
      };
      setServices([...services, newService]);
      toast.success('Serviço criado com sucesso!');
    }

    handleCloseDialog();
  };

  const handleDelete = () => {
    if (!serviceToDelete) return;

    // Aqui seria implementada a chamada à API para excluir o serviço
    // dispatch(deleteService(serviceToDelete.id));
    
    // Simulando exclusão
    const updatedServices = services.filter((service) => service.id !== serviceToDelete.id);
    setServices(updatedServices);
    toast.success('Serviço excluído com sucesso!');
    handleCloseDeleteDialog();
  };

  const handleToggleActive = (service) => {
    const updatedService = { ...service, isActive: !service.isActive };
    
    // Aqui seria implementada a chamada à API para atualizar o status do serviço
    // dispatch(updateServiceStatus(service.id, !service.isActive));
    
    // Simulando atualização
    const updatedServices = services.map((s) =>
      s.id === service.id ? updatedService : s
    );
    setServices(updatedServices);
    toast.success(`Serviço ${updatedService.isActive ? 'ativado' : 'desativado'} com sucesso!`);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Meus Serviços
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Gerencie os serviços que você oferece aos clientes. Defina preços, descrições e disponibilidade.
            </Typography>
          </Box>

          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Lista de Serviços
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Novo Serviço
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Preço</TableCell>
                    <TableCell>Tempo Estimado</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell>R$ {service.price.toFixed(2)}</TableCell>
                      <TableCell>{service.estimatedTime}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={service.isActive}
                              onChange={() => handleToggleActive(service)}
                              color="primary"
                            />
                          }
                          label={service.isActive ? 'Ativo' : 'Inativo'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(service)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenDeleteDialog(service)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {services.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {loading ? 'Carregando...' : 'Nenhum serviço cadastrado'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Dicas para Definir Preços
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" paragraph>
                    1. Pesquise os preços praticados por outros técnicos na sua região.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    2. Considere o tempo médio gasto em cada serviço e sua complexidade.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    3. Inclua no preço os custos de deslocamento, quando aplicável.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    4. Ofereça pacotes de serviços com desconto para atrair mais clientes.
                  </Typography>
                  <Typography variant="body2">
                    5. Revise seus preços periodicamente com base na demanda e feedback dos clientes.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estatísticas de Serviços
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total de Serviços:</Typography>
                    <Typography variant="body2" fontWeight="bold">{services.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Serviços Ativos:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {services.filter((s) => s.isActive).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Serviços Inativos:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {services.filter((s) => !s.isActive).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Preço Médio:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {services.length > 0
                        ? `R$ ${(services.reduce((sum, s) => sum + Number(s.price), 0) / services.length).toFixed(2)}`
                        : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Dialog para Adicionar/Editar Serviço */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editMode ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome do Serviço"
                    name="name"
                    value={currentService.name}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição"
                    name="description"
                    value={currentService.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      name="category"
                      value={currentService.category}
                      onChange={handleChange}
                      label="Categoria"
                      required
                    >
                      {serviceCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Preço"
                    name="price"
                    type="number"
                    value={currentService.price}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tempo Estimado"
                    name="estimatedTime"
                    value={currentService.estimatedTime}
                    onChange={handleChange}
                    placeholder="Ex: 1 hora, 30 minutos"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentService.isActive}
                        onChange={handleSwitchChange}
                        color="primary"
                      />
                    }
                    label="Serviço Ativo"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="inherit">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                color="primary"
                variant="contained"
                startIcon={<SaveIcon />}
              >
                Salvar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog para Confirmar Exclusão */}
          <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja excluir o serviço "{serviceToDelete?.name}"? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog} color="inherit">
                Cancelar
              </Button>
              <Button onClick={handleDelete} color="error" variant="contained">
                Excluir
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}

export default Services;