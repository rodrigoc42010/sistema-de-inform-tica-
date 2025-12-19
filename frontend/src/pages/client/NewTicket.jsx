import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

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
  Send as SendIcon,
} from '@mui/icons-material';

// Componentes
import Sidebar from '../../components/Sidebar';

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

function NewTicket() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [technicianOption, setTechnicianOption] = useState('auto');
  const [technicians, setTechnicians] = useState([]);

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
  const location = useLocation();

  // Fetch technicians
  React.useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const { data } = await api.get('/api/users/technicians');
        setTechnicians(data);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };

    fetchTechnicians();
  }, []);

  // Pré-seleção de técnico via query string
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const techId = params.get('technician');
    if (techId) {
      setSelectedTechnician(techId);
      setTechnicianOption('manual');
    }
  }, [location]);

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

    const newAttachments = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Use object URL instead of Base64
      file,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    toast.success(`${files.length} arquivo(s) anexado(s) com sucesso!`);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id));
  };

  const handleNext = () => {
    if (activeStep === 0) {
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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append('title', ticketData.title);
      formData.append('description', ticketData.description);
      formData.append('priority', ticketData.priority);
      formData.append('deviceType', ticketData.deviceType);
      formData.append('deviceBrand', ticketData.deviceBrand);
      formData.append('deviceModel', ticketData.deviceModel);
      formData.append('serialNumber', ticketData.serialNumber);
      formData.append('pickupRequested', ticketData.pickupRequired);

      if (technicianOption === 'manual' && selectedTechnician) {
        formData.append('technicianId', selectedTechnician);
      }

      attachments.forEach((attachment) => {
        if (attachment.file) {
          formData.append('attachments', attachment.file);
        }
      });

      await api.post('/api/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLoading(false);
      toast.success('Chamado criado com sucesso!');
      navigate('/client/dashboard');
    } catch (error) {
      setLoading(false);
      console.error('Erro ao criar chamado:', error);
      toast.error(
        error.response?.data?.message ||
          'Erro ao criar chamado. Tente novamente.'
      );
    }
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
              <FormControl
                fullWidth
                required
                error={activeStep === 1 && !ticketData.deviceType}
              >
                <InputLabel id="device-type-label">
                  Tipo de Dispositivo *
                </InputLabel>
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
                  <InputLabel id="technician-label">
                    Selecione um Técnico
                  </InputLabel>
                  <Select
                    labelId="technician-label"
                    value={selectedTechnician}
                    onChange={handleTechnicianChange}
                    label="Selecione um Técnico"
                    required={technicianOption === 'manual'}
                  >
                    {technicians.map((tech) => (
                      <MenuItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  O técnico precisa buscar o equipamento?
                </FormLabel>
                <RadioGroup
                  aria-label="pickup-required"
                  name="pickupRequired"
                  value={ticketData.pickupRequired ? 'sim' : 'não'}
                  onChange={handlePickupChange}
                >
                  <FormControlLabel
                    value="não"
                    control={<Radio />}
                    label="Não, levarei até o técnico"
                  />
                  <FormControlLabel
                    value="sim"
                    control={<Radio />}
                    label="Sim, preciso que o técnico busque"
                  />
                </RadioGroup>
              </FormControl>
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
                            sx={{
                              width: '100%',
                              height: 140,
                              objectFit: 'cover',
                              mb: 1,
                            }}
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
                            <AttachFileIcon
                              sx={{ fontSize: 48, color: 'text.secondary' }}
                            />
                          </Box>
                        )}
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ width: '100%' }}
                        >
                          {attachment.name}
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
                <Typography
                  variant="body2"
                  color="textSecondary"
                  align="center"
                >
                  Nenhum anexo adicionado
                </Typography>
              )}
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
                  endIcon={
                    activeStep === steps.length - 1 ? <SendIcon /> : null
                  }
                  disabled={loading}
                >
                  {activeStep === steps.length - 1
                    ? 'Enviar Chamado'
                    : 'Próximo'}
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
