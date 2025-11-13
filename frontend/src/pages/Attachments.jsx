import React, { useState, useEffect } from 'react';
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
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Movie as MovieIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../selectors/authSelectors';
import Sidebar from '../components/Sidebar';

// Componente para exibir o tipo de arquivo com ícone apropriado
const FileTypeIcon = ({ fileType }) => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon color="primary" />;
  } else if (fileType.startsWith('video/')) {
    return <MovieIcon color="secondary" />;
  } else if (fileType.startsWith('application/pdf')) {
    return <DescriptionIcon color="error" />;
  } else {
    return <InsertDriveFileIcon color="action" />;
  }
};

// Componente para exibir o tamanho do arquivo em formato legível
const FileSize = ({ bytes }) => {
  if (bytes < 1024) {
    return <Typography variant="body2">{bytes} B</Typography>;
  } else if (bytes < 1024 * 1024) {
    return <Typography variant="body2">{(bytes / 1024).toFixed(1)} KB</Typography>;
  } else if (bytes < 1024 * 1024 * 1024) {
    return <Typography variant="body2">{(bytes / (1024 * 1024)).toFixed(1)} MB</Typography>;
  } else {
    return <Typography variant="body2">{(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB</Typography>;
  }
};

function Attachments() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const userRole = useSelector(selectUserRole);
  
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Mock data para anexos
  const [attachments, setAttachments] = useState([
    {
      id: 1,
      fileName: 'erro_tela_azul.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024 * 1024 * 2.5, // 2.5 MB
      uploadDate: '2023-10-15T14:30:00',
      uploadedBy: 'Cliente',
      ticketId: '123',
      description: 'Captura de tela do erro',
      url: 'https://www.howtogeek.com/wp-content/uploads/2021/01/windows_10_bsod.jpg?height=200p&trim=2,2,2,2',
    },
    {
      id: 2,
      fileName: 'log_sistema.txt',
      fileType: 'text/plain',
      fileSize: 1024 * 45, // 45 KB
      uploadDate: '2023-10-15T14:35:00',
      uploadedBy: 'Cliente',
      ticketId: '123',
      description: 'Log do sistema no momento do erro',
      url: '#',
    },
    {
      id: 3,
      fileName: 'diagnostico_hardware.pdf',
      fileType: 'application/pdf',
      fileSize: 1024 * 1024 * 1.2, // 1.2 MB
      uploadDate: '2023-10-16T10:15:00',
      uploadedBy: 'Técnico',
      ticketId: '123',
      description: 'Relatório de diagnóstico de hardware',
      url: '#',
    },
    {
      id: 4,
      fileName: 'video_problema.mp4',
      fileType: 'video/mp4',
      fileSize: 1024 * 1024 * 15, // 15 MB
      uploadDate: '2023-10-16T11:20:00',
      uploadedBy: 'Cliente',
      ticketId: '123',
      description: 'Vídeo demonstrando o problema',
      url: '#',
    },
    {
      id: 5,
      fileName: 'solucao_aplicada.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024 * 1024 * 1.8, // 1.8 MB
      uploadDate: '2023-10-17T09:45:00',
      uploadedBy: 'Técnico',
      ticketId: '123',
      description: 'Imagem da solução aplicada',
      url: 'https://www.howtogeek.com/wp-content/uploads/2021/01/windows_10_desktop.jpg?height=200p&trim=2,2,2,2',
    },
  ]);

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setFilesToUpload([]);
    setUploadProgress(0);
  };

  const handleCloseUploadDialog = () => {
    if (!uploading) {
      setUploadDialogOpen(false);
    }
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    setFilesToUpload(files);
  };

  const handleUpload = () => {
    if (filesToUpload.length === 0) return;
    
    setUploading(true);
    
    // Simular upload com progresso
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Adicionar novos arquivos à lista
          const newAttachments = filesToUpload.map((file, index) => ({
            id: attachments.length + index + 1,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            uploadDate: new Date().toISOString(),
            uploadedBy: userRole === 'client' ? 'Cliente' : 'Técnico',
            ticketId: ticketId || '123',
            description: '',
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '#',
          }));
          
          setAttachments([...attachments, ...newAttachments]);
          setUploading(false);
          setUploadDialogOpen(false);
          setFilesToUpload([]);
          setUploadProgress(0);
        }, 500);
      }
    }, 300);
  };

  const handleMenuOpen = (event, attachment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAttachment(attachment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setAnchorEl(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // Remover o anexo da lista
    setAttachments(attachments.filter(a => a.id !== selectedAttachment.id));
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDownload = () => {
    setAnchorEl(null);
    // Lógica para download do arquivo
    console.log('Download:', selectedAttachment.fileName);
    // Em uma implementação real, aqui seria feita uma requisição para baixar o arquivo
  };

  // Filtrar anexos com base na pesquisa e na aba selecionada
  const filteredAttachments = attachments.filter((attachment) => {
    const matchesSearch = searchQuery === '' || 
      attachment.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attachment.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (tabValue === 0) { // Todos
      return matchesSearch;
    } else if (tabValue === 1) { // Imagens
      return matchesSearch && attachment.fileType.startsWith('image/');
    } else if (tabValue === 2) { // Vídeos
      return matchesSearch && attachment.fileType.startsWith('video/');
    } else if (tabValue === 3) { // Documentos
      return matchesSearch && (
        attachment.fileType.startsWith('application/') ||
        attachment.fileType.startsWith('text/')
      );
    }
    
    return false;
  });

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1">
                {ticketId ? `Anexos do Chamado #${ticketId}` : 'Anexos'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenUploadDialog}
              >
                Enviar Arquivos
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        placeholder="Buscar por nome ou descrição"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                      >
                        <Tab label="Todos" />
                        <Tab label="Imagens" />
                        <Tab label="Vídeos" />
                        <Tab label="Documentos" />
                      </Tabs>
                    </Grid>
                  </Grid>
                </Box>

                {filteredAttachments.length > 0 ? (
                  <Grid container spacing={3}>
                    {filteredAttachments.map((attachment) => (
                      <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          {attachment.fileType.startsWith('image/') ? (
                            <CardMedia
                              component="img"
                              height="140"
                              image={attachment.url}
                              alt={attachment.fileName}
                              sx={{ objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => handleFileSelect(attachment)}
                            />
                          ) : (
                            <Box
                              sx={{
                                height: 140,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'grey.100',
                              }}
                            >
                              <FileTypeIcon fileType={attachment.fileType} />
                            </Box>
                          )}
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="h6" component="div" noWrap sx={{ maxWidth: '80%' }} title={attachment.fileName}>
                                {attachment.fileName}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, attachment)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Enviado por: {attachment.uploadedBy}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {new Date(attachment.uploadDate).toLocaleString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <FileTypeIcon fileType={attachment.fileType} />
                              <Box sx={{ ml: 1 }}>
                                <FileSize bytes={attachment.fileSize} />
                              </Box>
                            </Box>
                            {attachment.description && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {attachment.description}
                              </Typography>
                            )}
                          </CardContent>
                          <Divider />
                          <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleFileSelect(attachment)}
                            >
                              Visualizar
                            </Button>
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={handleDownload}
                            >
                              Baixar
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <AttachFileIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Nenhum anexo encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery ? 'Tente ajustar sua pesquisa.' : 'Envie arquivos para este chamado usando o botão acima.'}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Menu de opções para anexos */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          handleFileSelect(selectedAttachment);
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Baixar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Excluir" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Dialog de visualização de arquivo */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.fileName}
          <IconButton
            aria-label="close"
            onClick={handleClosePreview}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFile && (
            <Box sx={{ textAlign: 'center' }}>
              {selectedFile.fileType.startsWith('image/') ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.fileName}
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              ) : selectedFile.fileType.startsWith('video/') ? (
                <video
                  controls
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                >
                  <source src={selectedFile.url} type={selectedFile.fileType} />
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
              ) : selectedFile.fileType === 'application/pdf' ? (
                <iframe
                  src={selectedFile.url}
                  width="100%"
                  height="500px"
                  title={selectedFile.fileName}
                  style={{ border: 'none' }}
                >
                  Este navegador não suporta a visualização de PDFs.
                </iframe>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <FileTypeIcon fileType={selectedFile.fileType} sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    Este tipo de arquivo não pode ser visualizado diretamente no navegador.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{ mt: 2 }}
                  >
                    Baixar Arquivo
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Fechar</Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            color="primary"
          >
            Baixar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de upload de arquivos */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enviar Arquivos</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Selecione os arquivos que deseja enviar. Você pode selecionar múltiplos arquivos.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tamanho máximo: 50 MB por arquivo. Formatos suportados: JPG, PNG, PDF, DOC, DOCX, TXT, MP4, AVI.
            </Typography>
          </Box>
          
          {!uploading && (
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Selecionar Arquivos
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileInputChange}
              />
            </Button>
          )}
          
          {filesToUpload.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {filesToUpload.length} {filesToUpload.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
              </Typography>
              <List dense>
                {filesToUpload.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <FileTypeIcon fileType={file.type || 'application/octet-stream'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={<FileSize bytes={file.size} />}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {uploadProgress}% Concluído
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            color="primary"
            disabled={filesToUpload.length === 0 || uploading}
            startIcon={<CloudUploadIcon />}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Tem certeza que deseja excluir o arquivo "{selectedAttachment?.fileName}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Attachments;