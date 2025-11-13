import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Material UI
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Rating,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  PhotoCamera as PhotoCameraIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  VideoCall as VideoCallIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';

// Componentes
import Sidebar from '../components/Sidebar';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { addTechnicianReview } from '../features/technicians/technicianSlice';

// Dados simulados (serão substituídos pela API)
const mockTicket = {
  _id: '2',
  title: 'Notebook com tela azul',
  description: 'Meu notebook está apresentando tela azul constantemente ao abrir programas. Já tentei reiniciar várias vezes, mas o problema persiste.',
  status: 'em_andamento',
  priority: 'média',
  createdAt: '2023-05-08T14:20:00Z',
  updatedAt: '2023-05-09T10:15:00Z',
  client: {
    _id: 'c1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 98765-4321',
  },
  technician: {
    _id: 't1',
    name: 'Carlos Pereira',
    email: 'carlos.pereira@email.com',
    phone: '(11) 91234-5678',
    rating: 4.8,
  },
  device: {
    type: 'Notebook',
    brand: 'HP',
    model: 'Pavilion',
    serialNumber: 'HP123456789',
  },
  attachments: [
    {
      _id: 'a1',
      filename: 'tela_azul.jpg',
      url: 'https://example.com/attachments/tela_azul.jpg',
      type: 'image',
      uploadedAt: '2023-05-08T14:20:00Z',
      uploadedBy: 'client',
    },
    {
      _id: 'a2',
      filename: 'log_erro.txt',
      url: 'https://example.com/attachments/log_erro.txt',
      type: 'document',
      uploadedAt: '2023-05-08T14:25:00Z',
      uploadedBy: 'client',
    },
    {
      _id: 'a3',
      filename: 'diagnostico.jpg',
      url: 'https://example.com/attachments/diagnostico.jpg',
      type: 'image',
      uploadedAt: '2023-05-09T10:15:00Z',
      uploadedBy: 'technician',
    },
  ],
  notes: [
    {
      _id: 'n1',
      content: 'Estou enfrentando telas azuis frequentes ao abrir qualquer programa pesado.',
      createdAt: '2023-05-08T14:30:00Z',
      author: {
        _id: 'c1',
        name: 'João Silva',
        role: 'client',
      },
    },
    {
      _id: 'n2',
      content: 'Analisei o problema e parece ser um problema de driver de vídeo. Vou realizar testes adicionais.',
      createdAt: '2023-05-09T10:15:00Z',
      author: {
        _id: 't1',
        name: 'Carlos Pereira',
        role: 'technician',
      },
    },
    {
      _id: 'n3',
      content: 'Atualizei os drivers de vídeo e realizei testes iniciais. O problema parece ter diminuído, mas ainda ocorre ocasionalmente.',
      createdAt: '2023-05-09T15:45:00Z',
      author: {
        _id: 't1',
        name: 'Carlos Pereira',
        role: 'technician',
      },
    },
  ],
  serviceItems: [
    { description: 'Diagnóstico', price: 50 },
    { description: 'Atualização de drivers', price: 30 },
    { description: 'Verificação de hardware', price: 40 },
  ],
  timeline: [
    {
      date: '2023-05-08T14:20:00Z',
      action: 'Chamado aberto',
      description: 'Cliente abriu o chamado',
    },
    {
      date: '2023-05-08T16:30:00Z',
      action: 'Técnico atribuído',
      description: 'Carlos Pereira foi atribuído ao chamado',
    },
    {
      date: '2023-05-09T10:15:00Z',
      action: 'Diagnóstico inicial',
      description: 'Técnico realizou diagnóstico inicial',
    },
    {
      date: '2023-05-09T15:45:00Z',
      action: 'Atualização',
      description: 'Drivers atualizados e testes realizados',
    },
  ],
};

function TicketDetails() {
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // Avaliação do técnico
  const [openRatingDialog, setOpenRatingDialog] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  // Estados para encerramento de chamado
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [finalReport, setFinalReport] = useState('');
  const [closingTicket, setClosingTicket] = useState(false);
  
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Aqui será implementada a chamada à API para buscar os detalhes do chamado
    // dispatch(getTicketDetails(ticketId));
    
    // Simulando carregamento
    setLoading(true);
    setTimeout(() => {
      setTicket(mockTicket);
      setLoading(false);
    }, 1000);
  }, [ticketId, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    const basePath = user?.role === 'client' ? '/client' : '/technician';
    navigate(`${basePath}/dashboard`);
  };

  const handleNoteChange = (e) => {
    setNewNote(e.target.value);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('A nota não pode estar vazia');
      return;
    }

    // Aqui será implementada a chamada à API para adicionar uma nota
    // dispatch(addTicketNote(ticketId, newNote));
    
    // Simulando adição de nota
    const newNoteObj = {
      _id: `n${ticket.notes.length + 1}`,
      content: newNote,
      createdAt: new Date().toISOString(),
      author: {
        _id: user._id,
        name: user.name,
        role: user.role,
      },
    };
    
    setTicket({
      ...ticket,
      notes: [...ticket.notes, newNoteObj],
    });
    
    setNewNote('');
    toast.success('Nota adicionada com sucesso!');
  };

  const handleOpenApprovalDialog = () => {
    setOpenApprovalDialog(true);
  };

  const handleCloseApprovalDialog = () => {
    setOpenApprovalDialog(false);
  };

  const handleApproveServices = () => {
    // Aqui será implementada a chamada à API para aprovar os serviços
    // dispatch(approveTicketServices(ticketId));
    
    // Simulando aprovação
    setTicket({
      ...ticket,
      status: 'aprovado',
      timeline: [
        ...ticket.timeline,
        {
          date: new Date().toISOString(),
          action: 'Serviços aprovados',
          description: 'Cliente aprovou os serviços propostos',
        },
      ],
    });
    
    setOpenApprovalDialog(false);
    toast.success('Serviços aprovados com sucesso!');
    const basePath = user?.role === 'client' ? '/client' : '/technician';
    navigate(`${basePath}/dashboard`);
  };

  const handleRejectServices = () => {
    // Aqui será implementada a chamada à API para rejeitar os serviços
    // dispatch(rejectTicketServices(ticketId));
    
    // Simulando rejeição
    setTicket({
      ...ticket,
      status: 'reprovado',
      timeline: [
        ...ticket.timeline,
        {
          date: new Date().toISOString(),
          action: 'Serviços rejeitados',
          description: 'Cliente rejeitou os serviços propostos',
        },
      ],
    });
    
    setOpenApprovalDialog(false);
    toast.info('Serviços rejeitados');
    const basePath = user?.role === 'client' ? '/client' : '/technician';
    navigate(`${basePath}/dashboard`);
  };

  const handleViewImage = (attachment) => {
    setSelectedImage(attachment);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedImage(null);
  };

  const handleOpenRatingDialog = () => {
    setOpenRatingDialog(true);
  };

  const handleCloseRatingDialog = () => {
    if (!submittingReview) setOpenRatingDialog(false);
  };

  const handleSubmitReview = async () => {
    if (!ticket?.technician?._id) {
      toast.error('Nenhum técnico associado ao chamado.');
      return;
    }
    if (!ratingValue) {
      toast.error('Selecione uma avaliação em estrelas.');
      return;
    }
    try {
      setSubmittingReview(true);
      const action = await dispatch(
        addTechnicianReview({
          technicianId: ticket.technician._id,
          rating: ratingValue,
          comment: ratingComment,
          ticketId,
        })
      );
      if (addTechnicianReview.fulfilled.match(action)) {
        toast.success('Avaliação enviada com sucesso!');
        const updatedTech = action.payload?.technician || action.payload;
        if (updatedTech?.rating) {
          setTicket((prev) => ({
            ...prev,
            technician: { ...prev.technician, rating: updatedTech.rating },
          }));
        }
        setOpenRatingDialog(false);
        setRatingValue(0);
        setRatingComment('');
      } else {
        const err = action.payload || 'Falha ao enviar avaliação';
        toast.error(typeof err === 'string' ? err : err?.message || 'Falha ao enviar avaliação');
      }
    } catch (e) {
      toast.error('Erro ao enviar avaliação');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Funções para encerramento de chamado
  const handleOpenCloseDialog = () => {
    setOpenCloseDialog(true);
  };

  const handleCloseCloseDialog = () => {
    if (!closingTicket) {
      setOpenCloseDialog(false);
      setFinalReport('');
    }
  };

  const handleCloseTicket = async () => {
    if (!finalReport.trim()) {
      toast.error('O relatório final é obrigatório para encerrar o chamado');
      return;
    }

    setClosingTicket(true);
    
    try {
      // Aqui será implementada a chamada à API para encerrar o chamado
      // await dispatch(closeTicket({ ticketId, finalReport }));
      
      // Simulando encerramento do chamado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTicket({
        ...ticket,
        status: 'concluido',
        finalReport,
        completionDate: new Date().toISOString(),
        timeline: [
          ...ticket.timeline,
          {
            date: new Date().toISOString(),
            action: 'Chamado encerrado',
            description: 'Técnico encerrou o chamado com relatório final',
          },
        ],
      });
      
      toast.success('Chamado encerrado com sucesso!');
      setOpenCloseDialog(false);
      setFinalReport('');
    } catch (error) {
      toast.error('Erro ao encerrar chamado. Tente novamente.');
    } finally {
      setClosingTicket(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Aqui será implementada a chamada à API para fazer upload do arquivo
    // dispatch(uploadTicketAttachment(ticketId, file));
    
    // Simulando upload
    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
    const newAttachment = {
      _id: `a${ticket.attachments.length + 1}`,
      filename: file.name,
      url: URL.createObjectURL(file),
      type: fileType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.role,
    };
    
    setTicket({
      ...ticket,
      attachments: [...ticket.attachments, newAttachment],
    });
    
    toast.success('Arquivo enviado com sucesso!');
  };

  // Funções para ações rápidas
  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usar câmera traseira
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const newAttachment = {
          _id: `a${ticket.attachments.length + 1}`,
          filename: `foto_${new Date().getTime()}.jpg`,
          url: URL.createObjectURL(file),
          type: 'image',
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.role,
        };
        
        setTicket({
          ...ticket,
          attachments: [...ticket.attachments, newAttachment],
        });
        
        toast.success('Foto capturada e anexada com sucesso!');
      }
    };
    input.click();
  };

  const handleRecordVideo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.capture = 'environment'; // Usar câmera traseira
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const newAttachment = {
          _id: `a${ticket.attachments.length + 1}`,
          filename: `video_${new Date().getTime()}.mp4`,
          url: URL.createObjectURL(file),
          type: 'video',
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.role,
        };
        
        setTicket({
          ...ticket,
          attachments: [...ticket.attachments, newAttachment],
        });
        
        toast.success('Vídeo gravado e anexado com sucesso!');
      }
    };
    input.click();
  };

  const handleOpenGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        const newAttachments = files.map((file, index) => ({
          _id: `a${ticket.attachments.length + index + 1}`,
          filename: file.name,
          url: URL.createObjectURL(file),
          type: file.type.startsWith('image/') ? 'image' : 'video',
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.role,
        }));
        
        setTicket({
          ...ticket,
          attachments: [...ticket.attachments, ...newAttachments],
        });
        
        toast.success(`${files.length} arquivo(s) selecionado(s) da galeria!`);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="lg">
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
              <CircularProgress />
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="lg">
            <Box textAlign="center" my={4}>
              <Typography variant="h5" color="error" gutterBottom>
                Chamado não encontrado
              </Typography>
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
              >
                Voltar
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              Detalhes do Chamado
            </Typography>
            <Button
              startIcon={<FolderIcon />}
              onClick={() => navigate(`/${user?.role}/ticket/${ticketId}/attachments`)}
              sx={{ mr: 1 }}
            >
              Anexos
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Informações do Chamado */}
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2">
                      {ticket.title}
                    </Typography>
                    <TicketStatusBadge status={ticket.status} />
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Aberto em: {new Date(ticket.createdAt).toLocaleString('pt-BR')} • 
                    Atualizado em: {new Date(ticket.updatedAt).toLocaleString('pt-BR')} • 
                    Prioridade: {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Descrição
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {ticket.description}
                  </Typography>

                  <Typography variant="h6" gutterBottom>
                    Equipamento
                  </Typography>
                  <Typography variant="body1">
                    {ticket.device.type} {ticket.device.brand} {ticket.device.model}
                    {ticket.device.serialNumber && ` (S/N: ${ticket.device.serialNumber})`}
                  </Typography>
                </CardContent>
              </Card>

              <Paper sx={{ mb: 3 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="ticket details tabs"
                >
                  <Tab label="Atualizações" />
                  <Tab label="Anexos" />
                  <Tab label="Serviços" />
                  <Tab label="Linha do Tempo" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                  {tabValue === 0 && (
                    <Box>
                      <List>
                        {ticket.notes.map((note) => (
                          <ListItem key={note._id} alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" color={note.author.role === 'technician' ? 'primary' : 'secondary'}>
                                {note.author.name} ({note.author.role === 'technician' ? 'Técnico' : 'Cliente'})
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(note.createdAt).toLocaleString('pt-BR')}
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ width: '100%' }}>
                              {note.content}
                            </Typography>
                            {ticket.notes.indexOf(note) < ticket.notes.length - 1 && (
                              <Divider sx={{ width: '100%', my: 2 }} />
                            )}
                          </ListItem>
                        ))}
                      </List>

                      <Box sx={{ mt: 3, display: 'flex' }}>
                        <TextField
                          fullWidth
                          label="Adicionar atualização"
                          multiline
                          rows={3}
                          value={newNote}
                          onChange={handleNoteChange}
                          variant="outlined"
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          endIcon={<SendIcon />}
                          onClick={handleAddNote}
                          sx={{ ml: 2, alignSelf: 'flex-end' }}
                        >
                          Enviar
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {tabValue === 1 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <input
                          accept="image/*,application/pdf,text/plain"
                          style={{ display: 'none' }}
                          id="upload-file"
                          type="file"
                          onChange={handleFileUpload}
                        />
                        <label htmlFor="upload-file">
                          <Button
                            variant="contained"
                            component="span"
                            startIcon={<AttachFileIcon />}
                          >
                            Anexar Arquivo
                          </Button>
                        </label>
                      </Box>

                      <Grid container spacing={2}>
                        {ticket.attachments.map((attachment) => (
                          <Grid item xs={12} sm={6} md={4} key={attachment._id}>
                            <Card>
                              {attachment.type === 'image' ? (
                                <CardMedia
                                  component="img"
                                  height="140"
                                  image={attachment.url}
                                  alt={attachment.filename}
                                  sx={{ objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => handleViewImage(attachment)}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    height: 140,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.200',
                                  }}
                                >
                                  <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                                </Box>
                              )}
                              <CardContent>
                                <Typography variant="body2" noWrap>
                                  {attachment.filename}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Enviado por: {attachment.uploadedBy === 'client' ? 'Cliente' : 'Técnico'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(attachment.uploadedAt).toLocaleString('pt-BR')}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}

                        {ticket.attachments.length === 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary" align="center">
                              Nenhum anexo disponível
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}

                  {tabValue === 2 && (
                    <Box>
                      {ticket.serviceItems && ticket.serviceItems.length > 0 ? (
                        <>
                          <List>
                            {ticket.serviceItems.map((item, index) => (
                              <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={item.description}
                                  secondary={`R$ ${item.price.toFixed(2)}`}
                                />
                              </ListItem>
                            ))}
                          </List>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">
                              Total
                            </Typography>
                            <Typography variant="h6" color="primary">
                              R$ {ticket.serviceItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                            </Typography>
                          </Box>

                          {user?.role === 'client' && ticket.status === 'aguardando_aprovação' && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<ThumbUpIcon />}
                                onClick={handleOpenApprovalDialog}
                                sx={{ mr: 1 }}
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={<ThumbDownIcon />}
                                onClick={handleRejectServices}
                              >
                                Recusar
                              </Button>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" color="textSecondary" align="center">
                          Nenhum serviço registrado
                        </Typography>
                      )}
                    </Box>
                  )}

                  {tabValue === 3 && (
                    <Box>
                      <Stepper orientation="vertical" activeStep={-1}>
                        {ticket.timeline.map((step, index) => (
                          <Step key={index} active={true}>
                            <StepLabel
                              StepIconComponent={() => (
                                <CheckCircleIcon color="primary" sx={{ fontSize: 24 }} />
                              )}
                            >
                              <Typography variant="subtitle1">
                                {step.action}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {new Date(step.date).toLocaleString('pt-BR')}
                              </Typography>
                              <Typography variant="body2">
                                {step.description}
                              </Typography>
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Sidebar com Informações Adicionais */}
            <Grid item xs={12} md={4}>
              {/* Informações do Cliente */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cliente
                  </Typography>
                  <Typography variant="body1">
                    {ticket.client.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {ticket.client.email}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {ticket.client.phone}
                  </Typography>
                </CardContent>
              </Card>

              {/* Informações do Técnico */}
              {ticket.technician && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Técnico
                    </Typography>
                    <Typography variant="body1">
                      {ticket.technician.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {ticket.technician.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {ticket.technician.phone}
                    </Typography>
                    {ticket.technician.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                          Avaliação:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {ticket.technician.rating}
                          </Typography>
                          <Box component="span" sx={{ color: 'gold', ml: 0.5, display: 'flex', alignItems: 'center' }}>
                            ★
                          </Box>
                        </Box>
                      </Box>
                    )}
                    {user?.role === 'client' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2 }}
                        onClick={handleOpenRatingDialog}
                      >
                        Avaliar Atendimento
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Ações Rápidas */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ações Rápidas
                  </Typography>
                  
                  {/* Botão de Encerrar Chamado - apenas para técnicos */}
                  {user?.role === 'technician' && ticket.status !== 'concluido' && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      sx={{ mb: 2 }}
                      onClick={handleOpenCloseDialog}
                    >
                      Encerrar Chamado
                    </Button>
                  )}
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    sx={{ mb: 1 }}
                    onClick={handleTakePhoto}
                  >
                    Tirar Foto
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VideoCallIcon />}
                    sx={{ mb: 1 }}
                    onClick={handleRecordVideo}
                  >
                    Gravar Vídeo
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ImageIcon />}
                    onClick={handleOpenGallery}
                  >
                    Galeria
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Dialog de Aprovação de Serviços */}
          <Dialog
            open={openApprovalDialog}
            onClose={handleCloseApprovalDialog}
            aria-labelledby="approval-dialog-title"
            aria-describedby="approval-dialog-description"
          >
            <DialogTitle id="approval-dialog-title">
              Confirmar Aprovação de Serviços
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="approval-dialog-description">
                Você está prestes a aprovar os seguintes serviços:
              </DialogContentText>
              <List>
                {ticket.serviceItems && ticket.serviceItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.description}
                      secondary={`R$ ${item.price.toFixed(2)}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Typography variant="h6" align="right">
                Total: R$ {ticket.serviceItems && ticket.serviceItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
              </Typography>
              <DialogContentText sx={{ mt: 2 }}>
                Ao confirmar, você autoriza o técnico a realizar os serviços listados acima e concorda com os valores apresentados.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseApprovalDialog} color="inherit">
                Cancelar
              </Button>
              <Button onClick={handleApproveServices} color="primary" variant="contained" autoFocus>
                Confirmar Aprovação
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de Visualização de Imagem */}
          <Dialog
            open={openImageDialog}
            onClose={handleCloseImageDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedImage?.filename}
              <IconButton onClick={handleCloseImageDialog}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {selectedImage && (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.filename}
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog de Encerramento de Chamado */}
          <Dialog
            open={openCloseDialog}
            onClose={handleCloseCloseDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Encerrar Chamado
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Para encerrar este chamado, é necessário fornecer um relatório final detalhando os serviços realizados e a solução implementada.
              </DialogContentText>
              <TextField
                fullWidth
                multiline
                minRows={6}
                label="Relatório Final *"
                value={finalReport}
                onChange={(e) => setFinalReport(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Descreva detalhadamente os serviços realizados, problemas encontrados, soluções implementadas e recomendações para o cliente..."
                helperText="Este relatório será enviado ao cliente e ficará registrado no histórico do chamado."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseCloseDialog} disabled={closingTicket}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCloseTicket} 
                variant="contained" 
                color="success"
                disabled={closingTicket || !finalReport.trim()}
              >
                {closingTicket ? 'Encerrando...' : 'Encerrar Chamado'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de Avaliação do Técnico */}
          <Dialog open={openRatingDialog} onClose={handleCloseRatingDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Avaliar Atendimento do Técnico</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Selecione a quantidade de estrelas e deixe um comentário sobre o atendimento.
              </DialogContentText>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Rating
                  name="technician-rating"
                  value={ratingValue}
                  precision={1}
                  onChange={(e, newValue) => setRatingValue(newValue)}
                />
                <Typography sx={{ ml: 2 }}>
                  {ratingValue ? `${ratingValue} estrela${ratingValue > 1 ? 's' : ''}` : 'Sem avaliação'}
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Comentário (opcional)"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseRatingDialog} disabled={submittingReview}>Cancelar</Button>
              <Button onClick={handleSubmitReview} variant="contained" disabled={submittingReview || !ratingValue}>
                {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}

export default TicketDetails;