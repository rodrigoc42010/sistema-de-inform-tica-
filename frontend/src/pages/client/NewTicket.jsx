import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// Material UI
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  PhotoCamera as PhotoCameraIcon,
  Send as SendIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';

// Componentes
import Sidebar from '../../components/Sidebar';

// Dados simulados (serão substituídos pela API)
const deviceTypes = [
  'Notebook',
  'Desktop',
  'Impressora',
  'Smartphone',
  'Tablet',
  'Roteador/Modem',
  'Smart TV',
  'Outro',
];

const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'média', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const mockTechnicians = [
  {
    _id: 't1',
    name: 'Carlos Pereira',
    specialties: ['Notebooks', 'Desktops', 'Redes'],
    rating: 4.8,
    distance: 2.5,
  },
  {
    _id: 't2',
    name: 'Ana Oliveira',
    specialties: ['Smartphones', 'Tablets', 'Impressoras'],
    rating: 4.9,
    distance: 3.8,
  },
  {
    _id: 't3',
    name: 'Roberto Santos',
    specialties: ['Redes', 'Servidores', 'Segurança'],
    rating: 4.7,
    distance: 5.2,
  },
];

function NewTicket() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [technicianOption, setTechnicianOption] = useState('auto');
  
  const [ticketData, setTicketData] = useState({
    title: '',
    description: '',
    deviceType: '',
    deviceBrand: '',
    deviceModel: '',
    serialNumber: '',
    priority: 'média',
    pickupRequired: false,
  });
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Pré-seleção de técnico via query string
  const location = useLocation?.() || null;
  React.useEffect(() => {
    try {
      const search = location?.search || window.location.search;
      const params = new URLSearchParams(search);
      const techId = params.get('technician');
      if (techId) {
        setSelectedTechnician(techId);
        setTechnicianOption('manual');
      }
    } catch (e) {
      // silenciar erros de parsing
    }
  }, []);
  const handleBack = () => {
    navigate('/client/dashboard');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTicketData({
      ...ticketData,
      [name]: value,
    });
  };

  const handleRadioChange = (e) => {
    setTechnicianOption(e.target.value);
    if (e.target.value === 'auto') {
      setSelectedTechnician('');
    }
  };

  const handleTechnicianChange = (e) => {
    setSelectedTechnician(e.target.value);
  };

  const handlePickupChange = (e) => {
    setTicketData({
      ...ticketData,
      pickupRequired: e.target.value === 'sim',
    });
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Simulando upload de arquivos
    const newAttachments = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file,
    }));

    setAttachments([...attachments, ...newAttachments]);
    toast.success(`${files.length} arquivo(s) anexado(s) com sucesso!`);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validar dados básicos do chamado
      if (!ticketData.title.trim()) {
        toast.error('O título do chamado é obrigatório');
        return;
      }
      if (!ticketData.description.trim()) {
        toast.error('A descrição do problema é obrigatória');
        return;
      }
    }
    
    if (activeStep === 1) {
      // Validar dados do dispositivo
      if (!ticketData.deviceType) {
        toast.error('O tipo de dispositivo é obrigatório');
        return;
      }
    }

    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack2 = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = () => {
    setLoading(true);

    // Preparar dados para envio
    const ticketPayload = {
      ...ticketData,
      client: user._id,
      technician: technicianOption === 'manual' ? selectedTechnician : null,
      // Os anexos seriam enviados em uma requisição separada ou como FormData
    };

    // Aqui seria implementada a chamada à API para criar o chamado
    // dispatch(createTicket(ticketPayload));

    // Simulando criação de chamado
    setTimeout(() => {
      setLoading(false);
      toast.success('Chamado criado com sucesso!');
      navigate('/client/dashboard');
    }, 1500);
  };

  const steps = [
    'Informações do Problema',
    'Detalhes do Dispositivo',
    'Escolha do Técnico',
    'Anexos e Confirmação',
  ];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Título do Chamado"
                name="title"
                value={ticketData.title}
                onChange={handleChange}
                placeholder="Ex: Notebook não liga"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Descrição do Problema"
                name="description"
                value={ticketData.description}
                onChange={handleChange}
                placeholder="Descreva detalhadamente o problema que está enfrentando"
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">Prioridade</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={ticketData.priority}
                  onChange={handleChange}
                  label="Prioridade"
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={activeStep === 1 && !ticketData.deviceType}>
                <InputLabel id="device-type-label">Tipo de Dispositivo *</InputLabel>
                <Select
                  labelId="device-type-label"
                  name="deviceType"
                  value={ticketData.deviceType}
                  onChange={handleChange}
                  label="Tipo de Dispositivo *"
                  required
                >
                  {deviceTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {activeStep === 1 && !ticketData.deviceType && (
                  <Typography variant="caption" color="error">
                    O tipo de dispositivo é obrigatório
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marca"
                name="deviceBrand"
                value={ticketData.deviceBrand}
                onChange={handleChange}
                placeholder="Ex: HP, Dell, Samsung"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modelo"
                name="deviceModel"
                value={ticketData.deviceModel}
                onChange={handleChange}
                placeholder="Ex: Inspiron 15, Galaxy S21"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Série (opcional)"
                name="serialNumber"
                value={ticketData.serialNumber}
                onChange={handleChange}
                placeholder="Número de série do dispositivo"
                variant="outlined"
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Escolha do Técnico</FormLabel>
                <RadioGroup
                  aria-label="technician-option"
                  name="technician-option"
                  value={technicianOption}
                  onChange={handleRadioChange}
                >
                  <FormControlLabel
                    value="auto"
                    control={<Radio />}
                    label="Encontrar técnico automaticamente (recomendado)"
                  />
                  <FormControlLabel
                    value="manual"
                    control={<Radio />}
                    label="Escolher técnico manualmente"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {technicianOption === 'manual' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="technician-label">Selecione um Técnico</InputLabel>
                  <Select
                    labelId="technician-label"
                    value={selectedTechnician}
                    onChange={handleTechnicianChange}
                    label="Selecione um Técnico"
                    required={technicianOption === 'manual'}
                  >
                    {mockTechnicians.map((tech) => (
                      <MenuItem key={tech._id} value={tech._id}>
                        {tech.name} - {tech.specialties.join(', ')} - {tech.distance} km
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControl component="fieldset">
                <FormLabel component="legend">O técnico precisa buscar o equipamento?</FormLabel>
                <RadioGroup
                  aria-label="pickup-required"
                  name="pickupRequired"
                  value={ticketData.pickupRequired ? 'sim' : 'não'}
                  onChange={handlePickupChange}
                >
                  <FormControlLabel value="não" control={<Radio />} label="Não, levarei até o técnico" />
                  <FormControlLabel value="sim" control={<Radio />} label="Sim, preciso que o técnico busque" />
                </RadioGroup>
              </FormControl>
              {ticketData.pickupRequired && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Nota: Será aplicada uma taxa de deslocamento que varia de acordo com a distância.
                </Typography>
              )}
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Anexos
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Adicione fotos ou vídeos que possam ajudar o técnico a entender melhor o problema.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <input
                  accept="image/*,video/*,application/pdf"
                  style={{ display: 'none' }}
                  id="upload-file"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="upload-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AttachFileIcon />}
                  >
                    Anexar Arquivos
                  </Button>
                </label>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                >
                  Tirar Foto
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VideoCallIcon />}
                >
                  Gravar Vídeo
                </Button>
              </Box>

              {attachments.length > 0 ? (
                <Grid container spacing={2}>
                  {attachments.map((attachment) => (
                    <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                      <Paper
                        sx={{
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        {attachment.type.startsWith('image/') ? (
                          <Box
                            component="img"
                            src={attachment.url}
                            alt={attachment.name}
                            sx={{ width: '100%', height: 140, objectFit: 'cover', mb: 1 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: 140,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'grey.200',
                              mb: 1,
                            }}
                          >
                            <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                          </Box>
                        )}
                        <Typography variant="body2" noWrap sx={{ width: '100%' }}>
                          {attachment.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(attachment.size / 1024).toFixed(2)} KB
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeAttachment(attachment.id)}
                          sx={{ mt: 1 }}
                        >
                          Remover
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center">
                  Nenhum anexo adicionado
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Resumo do Chamado
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Título:</Typography>
                  <Typography variant="body2" paragraph>
                    {ticketData.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Prioridade:</Typography>
                  <Typography variant="body2" paragraph>
                    {priorityOptions.find((opt) => opt.value === ticketData.priority)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Descrição:</Typography>
                  <Typography variant="body2" paragraph>
                    {ticketData.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Dispositivo:</Typography>
                  <Typography variant="body2" paragraph>
                    {ticketData.deviceType} {ticketData.deviceBrand} {ticketData.deviceModel}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Técnico:</Typography>
                  <Typography variant="body2" paragraph>
                    {technicianOption === 'auto'
                      ? 'Encontrar automaticamente'
                      : mockTechnicians.find((tech) => tech._id === selectedTechnician)?.name || 'Não selecionado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Retirada do equipamento:</Typography>
                  <Typography variant="body2" paragraph>
                    {ticketData.pickupRequired ? 'Sim, técnico deve buscar' : 'Não, cliente levará até o técnico'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Anexos:</Typography>
                  <Typography variant="body2" paragraph>
                    {attachments.length} arquivo(s)
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
      default:
        return 'Passo desconhecido';
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Novo Chamado
            </Typography>
          </Box>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {getStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {activeStep !== 0 && (
                  <Button onClick={handleBack2} sx={{ mr: 1 }}>
                    Voltar
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={activeStep === steps.length - 1 ? <SendIcon /> : null}
                  disabled={loading}
                >
                  {activeStep === steps.length - 1 ? 'Enviar Chamado' : 'Próximo'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}

export default NewTicket;