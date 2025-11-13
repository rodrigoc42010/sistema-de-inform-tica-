import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
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
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Rating,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Call as CallIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterListIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  Star as StarIcon,
  Store as StoreIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../selectors/authSelectors';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';

function LocalServices() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useSelector(selectUser);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favoriteServices, setFavoriteServices] = useState([]);
  
  // Estados para filtros avançados
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 10,
    minRating: 0,
    sortBy: 'distance',
    openNow: false,
    hasWhatsApp: false,
    hasWebsite: false,
  });
  
  // Mock data para categorias
  const categories = [
    'Todos',
    'Informática',
    'Eletrônicos',
    'Redes',
    'Software',
    'Hardware',
    'Celulares',
    'Videogames',
    'Impressoras',
    'Segurança',
    'Treinamento',
  ];
  
  // Mock data para serviços locais
  const [services, setServices] = useState([
    {
      id: 1,
      name: 'TechSolutions Informática',
      logo: 'https://via.placeholder.com/150',
      category: 'Informática',
      rating: 4.8,
      reviewCount: 124,
      description: 'Serviços completos de informática para empresas e residências. Especialistas em reparos, instalação de redes e suporte técnico.',
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      phone: '(11) 3456-7890',
      whatsapp: '(11) 98765-4321',
      email: 'contato@techsolutions.com.br',
      website: 'www.techsolutions.com.br',
      services: ['Manutenção de Computadores', 'Instalação de Redes', 'Suporte Técnico', 'Recuperação de Dados'],
      images: [
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
        'https://images.unsplash.com/photo-1588702547919-26089e690ecc',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
      ],
      hours: 'Segunda a Sexta: 08:00 - 18:00 | Sábado: 09:00 - 13:00',
      distance: '2.5 km',
    },
    {
      id: 2,
      name: 'SmartFix Celulares',
      logo: 'https://via.placeholder.com/150',
      category: 'Celulares',
      rating: 4.6,
      reviewCount: 98,
      description: 'Assistência técnica especializada em smartphones e tablets. Consertos rápidos e com garantia.',
      address: 'Rua Augusta, 500 - São Paulo, SP',
      phone: '(11) 3333-4444',
      whatsapp: '(11) 97777-8888',
      email: 'contato@smartfix.com.br',
      website: 'www.smartfix.com.br',
      services: ['Troca de Tela', 'Reparo de Placa', 'Troca de Bateria', 'Desbloqueio'],
      images: [
        'https://images.unsplash.com/photo-1556656793-08538906a9f8',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd',
        'https://images.unsplash.com/photo-1546054454-aa26e2b734c7',
      ],
      hours: 'Segunda a Sábado: 10:00 - 20:00',
      distance: '3.8 km',
    },
    {
      id: 3,
      name: 'PrintMaster Impressoras',
      logo: 'https://via.placeholder.com/150',
      category: 'Impressoras',
      rating: 4.5,
      reviewCount: 76,
      description: 'Venda, manutenção e recarga de cartuchos para todos os modelos de impressoras. Atendimento empresarial e residencial.',
      address: 'Av. Brigadeiro Faria Lima, 1500 - São Paulo, SP',
      phone: '(11) 2222-3333',
      whatsapp: '(11) 96666-7777',
      email: 'contato@printmaster.com.br',
      website: 'www.printmaster.com.br',
      services: ['Recarga de Toner', 'Manutenção de Impressoras', 'Venda de Suprimentos', 'Outsourcing de Impressão'],
      images: [
        'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6',
        'https://images.unsplash.com/photo-1563986768711-b3bde3dc821e',
        'https://images.unsplash.com/photo-1585298723682-7115561c51b7',
      ],
      hours: 'Segunda a Sexta: 09:00 - 19:00 | Sábado: 09:00 - 14:00',
      distance: '5.2 km',
    },
    {
      id: 4,
      name: 'NetSecure Redes',
      logo: 'https://via.placeholder.com/150',
      category: 'Redes',
      rating: 4.9,
      reviewCount: 112,
      description: 'Soluções completas em redes e segurança da informação. Instalação, configuração e monitoramento de redes corporativas.',
      address: 'Rua Vergueiro, 2000 - São Paulo, SP',
      phone: '(11) 5555-6666',
      whatsapp: '(11) 95555-6666',
      email: 'contato@netsecure.com.br',
      website: 'www.netsecure.com.br',
      services: ['Instalação de Redes', 'Configuração de Firewall', 'Segurança de Dados', 'Monitoramento 24h'],
      images: [
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
        'https://images.unsplash.com/photo-1551703599-2a5f5d2b66c9',
      ],
      hours: 'Segunda a Sexta: 08:00 - 18:00',
      distance: '4.7 km',
    },
    {
      id: 5,
      name: 'DataRecovery Especialistas',
      logo: 'https://via.placeholder.com/150',
      category: 'Hardware',
      rating: 4.7,
      reviewCount: 89,
      description: 'Especialistas em recuperação de dados de HDs, SSDs, cartões de memória e outros dispositivos. Alta taxa de sucesso.',
      address: 'Av. Rebouças, 1200 - São Paulo, SP',
      phone: '(11) 4444-5555',
      whatsapp: '(11) 94444-5555',
      email: 'contato@datarecovery.com.br',
      website: 'www.datarecovery.com.br',
      services: ['Recuperação de Dados', 'Reparo de HDs', 'Diagnóstico Gratuito', 'Backup de Dados'],
      images: [
        'https://images.unsplash.com/photo-1531492053556-25e8f8c8c5fc',
        'https://images.unsplash.com/photo-1563453392212-326f5e854473',
        'https://images.unsplash.com/photo-1606765962248-7ff407b51667',
      ],
      hours: 'Segunda a Sexta: 09:00 - 18:00 | Sábado: 09:00 - 12:00',
      distance: '6.1 km',
    },
    {
      id: 6,
      name: 'SoftwarePro Desenvolvimento',
      logo: 'https://via.placeholder.com/150',
      category: 'Software',
      rating: 4.8,
      reviewCount: 134,
      description: 'Desenvolvimento de software personalizado para empresas. Sistemas web, aplicativos móveis e soluções de automação.',
      address: 'Rua Haddock Lobo, 800 - São Paulo, SP',
      phone: '(11) 6666-7777',
      whatsapp: '(11) 96666-7777',
      email: 'contato@softwarepro.com.br',
      website: 'www.softwarepro.com.br',
      services: ['Desenvolvimento de Sistemas', 'Aplicativos Mobile', 'Websites', 'Consultoria em TI'],
      images: [
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789',
        'https://images.unsplash.com/photo-1573495627361-d9b87960b12d',
      ],
      hours: 'Segunda a Sexta: 09:00 - 18:00',
      distance: '3.5 km',
    },
  ]);

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Carregar favoritos do localStorage
    const savedFavorites = localStorage.getItem('favoriteServices');
    if (savedFavorites) {
      setFavoriteServices(JSON.parse(savedFavorites));
    }

    // Tentar obter localização do usuário do cadastro
    if (user?.address?.city && user?.address?.state) {
      // Se o usuário tem endereço cadastrado, usar como localização base
      setUserLocation({
        city: user.address.city,
        state: user.address.state,
        fromProfile: true
      });
      setLocationPermission(true);
    }

    return () => clearTimeout(timer);
  }, [user]);

  // Função para solicitar localização via GPS
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            fromGPS: true
          });
          setLocationPermission(true);
          toast.success('Localização obtida com sucesso!');
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          toast.error('Não foi possível obter sua localização. Usando dados do seu cadastro.');
          setLocationPermission(false);
        }
      );
    } else {
      toast.error('Geolocalização não é suportada neste navegador.');
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === 'Todos' ? '' : category);
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleToggleFavorite = (serviceId) => {
    const updatedFavorites = favoriteServices.includes(serviceId)
      ? favoriteServices.filter(id => id !== serviceId)
      : [...favoriteServices, serviceId];
    
    setFavoriteServices(updatedFavorites);
    localStorage.setItem('favoriteServices', JSON.stringify(updatedFavorites));
  };

  // Funções para filtros avançados
  const handleOpenFilters = () => {
    setFiltersOpen(true);
  };

  const handleCloseFilters = () => {
    setFiltersOpen(false);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setFiltersOpen(false);
    toast.success('Filtros aplicados com sucesso!');
  };

  const clearFilters = () => {
    setFilters({
      maxDistance: 10,
      minRating: 0,
      sortBy: 'distance',
      openNow: false,
      hasWhatsApp: false,
      hasWebsite: false,
    });
  };

  // Helpers para ações de contato
  const sanitizeDigits = (value = '') => (value || '').toString().replace(/\D/g, '');
  const ensureProtocol = (url = '') => {
    if (!url) return '';
    return /^(http|https):\/\//i.test(url) ? url : `https://${url}`;
  };

  const handleCall = (phone) => {
    const digits = sanitizeDigits(phone);
    if (!digits) {
      toast.error('Telefone inválido');
      return;
    }
    const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
    window.location.href = `tel:+${withCountry}`;
  };

  const handleWhatsApp = (phone, name) => {
    const digits = sanitizeDigits(phone);
    if (!digits) {
      toast.error('WhatsApp inválido');
      return;
    }
    const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
    const text = encodeURIComponent(`Olá ${name}! Encontrei seu serviço no app e gostaria de mais informações.`);
    const url = `https://wa.me/${withCountry}?text=${text}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleEmail = (email, name) => {
    if (!email) {
      toast.error('E-mail inválido');
      return;
    }
    const subject = `Contato - ${name}`;
    const body = `Olá ${name},%0D%0A%0D%0AEncontrei seu serviço no app e gostaria de mais informações.`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  const handleShare = async (service) => {
    const url = ensureProtocol(service.website) || window.location.href;
    const shareData = {
      title: service.name,
      text: `Dá uma olhada em ${service.name} (${service.category})`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência');
      } else {
        const temp = document.createElement('input');
        temp.value = url;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        toast.success('Link copiado para a área de transferência');
      }
    } catch (err) {
      toast.error('Não foi possível compartilhar agora');
    }
  };

  // Filtrar serviços com base na pesquisa, categoria e filtros avançados
  const filteredServices = services.filter((service) => {
    const matchesSearch = searchQuery === '' || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || service.category === selectedCategory;
    
    // Aplicar filtros avançados
    const matchesRating = service.rating >= filters.minRating;
    const matchesDistance = parseFloat(service.distance) <= filters.maxDistance;
    const matchesWhatsApp = !filters.hasWhatsApp || service.whatsapp;
    const matchesWebsite = !filters.hasWebsite || service.website;
    
    return matchesSearch && matchesCategory && matchesRating && matchesDistance && matchesWhatsApp && matchesWebsite;
  }).sort((a, b) => {
    // Aplicar ordenação
    switch (filters.sortBy) {
      case 'distance':
        return parseFloat(a.distance) - parseFloat(b.distance);
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'reviews':
        return b.reviewCount - a.reviewCount;
      default:
        return 0;
    }
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
            <Typography variant="h4" component="h1" gutterBottom>
              Serviços Locais
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Encontre serviços de informática e tecnologia próximos a você. Empresas parceiras com qualidade garantida.
            </Typography>

            {/* Barra de pesquisa */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    placeholder="Buscar serviços, empresas ou especialidades"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={handleOpenFilters}
                  >
                    Filtros Avançados
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Categorias */}
            <Box sx={{ mb: 4, overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', pb: 1 }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => handleCategoryChange(category)}
                    color={selectedCategory === category || (category === 'Todos' && selectedCategory === '') ? 'primary' : 'default'}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
              </Box>
            ) : filteredServices.length > 0 ? (
              <Grid container spacing={3}>
                {filteredServices.map((service) => (
                  <Grid item xs={12} md={6} lg={4} key={service.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={service.images[0]}
                        alt={service.name}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleServiceClick(service)}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div" gutterBottom>
                            {service.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(service.id);
                            }}
                            color="primary"
                          >
                            {favoriteServices.includes(service.id) ? (
                              <FavoriteIcon color="error" />
                            ) : (
                              <FavoriteBorderIcon />
                            )}
                          </IconButton>
                        </Box>
                        
                        <Chip
                          label={service.category}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating 
                            value={service.rating} 
                            precision={0.1} 
                            readOnly 
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({service.rating}) · {service.reviewCount} avaliações
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            {service.distance} · {service.address.split(' - ')[0]}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {service.description.length > 120
                            ? `${service.description.substring(0, 120)}...`
                            : service.description}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Serviços:
                        </Typography>
                        <Box>
                          {service.services.slice(0, 3).map((item) => (
                            <Chip
                              key={item}
                              label={item}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {service.services.length > 3 && (
                            <Chip
                              label={`+${service.services.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 0.5 }}
                            />
                          )}
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<StoreIcon />}
                          variant="contained"
                          fullWidth
                          onClick={() => handleServiceClick(service)}
                        >
                          Ver Detalhes
                        </Button>
                      </CardActions>
                      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                        <IconButton size="small" color="primary" aria-label="phone" onClick={(e) => { e.stopPropagation(); handleCall(service.phone); }}>
                          <CallIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="success" aria-label="whatsapp" onClick={(e) => { e.stopPropagation(); handleWhatsApp(service.whatsapp, service.name); }}>
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary" aria-label="email" onClick={(e) => { e.stopPropagation(); handleEmail(service.email, service.name); }}>
                          <EmailIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary" aria-label="share" onClick={(e) => { e.stopPropagation(); handleShare(service); }}>
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <StoreIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum serviço encontrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tente ajustar seus filtros ou termos de busca.
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Dialog de detalhes do serviço */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        {selectedService && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedService.name}</Typography>
              <IconButton edge="end" color="inherit" onClick={handleCloseDialog} aria-label="close">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <img 
                      src={selectedService.images[0]} 
                      alt={selectedService.name} 
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </Box>
                  <Grid container spacing={1} sx={{ mb: 3 }}>
                    {selectedService.images.slice(1).map((image, index) => (
                      <Grid item xs={6} key={index}>
                        <img 
                          src={image} 
                          alt={`${selectedService.name} ${index + 2}`} 
                          style={{ width: '100%', borderRadius: '8px' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" gutterBottom>{selectedService.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip label={selectedService.category} size="small" sx={{ mr: 1 }} />
                      <Rating value={selectedService.rating} precision={0.1} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({selectedService.rating}) · {selectedService.reviewCount} avaliações
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" paragraph>
                    {selectedService.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Endereço:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <LocationOnIcon color="action" sx={{ mt: 0.5, mr: 1 }} />
                      <Typography variant="body2">{selectedService.address}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Horário de Funcionamento:</Typography>
                    <Typography variant="body2">{selectedService.hours}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Contato:</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleCall(selectedService.phone)}>
                          <CallIcon color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2">{selectedService.phone}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleWhatsApp(selectedService.whatsapp, selectedService.name)}>
                          <WhatsAppIcon color="success" sx={{ mr: 1 }} />
                          <Typography variant="body2">{selectedService.whatsapp}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleEmail(selectedService.email, selectedService.name)}>
                          <EmailIcon color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2">{selectedService.email}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.open(ensureProtocol(selectedService.website), '_blank', 'noopener')}>
                          <LanguageIcon color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2">{selectedService.website}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Serviços Oferecidos:</Typography>
                    <Box>
                      {selectedService.services.map((service) => (
                        <Chip
                          key={service}
                          label={service}
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
              <Button
                onClick={() => handleToggleFavorite(selectedService.id)}
                startIcon={favoriteServices.includes(selectedService.id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              >
                {favoriteServices.includes(selectedService.id) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </Button>
              <Button
                variant="contained"
                onClick={handleCloseDialog}
              >
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de Filtros Avançados */}
      <Dialog
        open={filtersOpen}
        onClose={handleCloseFilters}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Filtros Avançados</Typography>
          <IconButton edge="end" color="inherit" onClick={handleCloseFilters} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Localização */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Localização
              </Typography>
              <Box sx={{ mb: 2 }}>
                {userLocation ? (
                  <Typography variant="body2" color="text.secondary">
                    {userLocation.fromProfile ? 
                      `Usando localização do cadastro: ${userLocation.city}, ${userLocation.state}` :
                      'Usando localização GPS atual'
                    }
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma localização definida
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                startIcon={<MyLocationIcon />}
                onClick={requestLocation}
                disabled={!navigator.geolocation}
              >
                Usar Localização Atual (GPS)
              </Button>
            </Grid>

            {/* Distância Máxima */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Distância Máxima: {filters.maxDistance} km
              </Typography>
              <Slider
                value={filters.maxDistance}
                onChange={(e, value) => handleFilterChange('maxDistance', value)}
                min={1}
                max={50}
                step={1}
                marks={[
                  { value: 1, label: '1km' },
                  { value: 10, label: '10km' },
                  { value: 25, label: '25km' },
                  { value: 50, label: '50km' }
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>

            {/* Avaliação Mínima */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Avaliação Mínima
              </Typography>
              <Rating
                value={filters.minRating}
                onChange={(e, value) => handleFilterChange('minRating', value || 0)}
                precision={0.5}
                size="large"
              />
            </Grid>

            {/* Ordenação */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Ordenar por"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="distance">Distância</MenuItem>
                  <MenuItem value="rating">Avaliação</MenuItem>
                  <MenuItem value="name">Nome</MenuItem>
                  <MenuItem value="reviews">Número de Avaliações</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filtros Adicionais */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Filtros Adicionais
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.hasWhatsApp}
                    onChange={(e) => handleFilterChange('hasWhatsApp', e.target.checked)}
                  />
                }
                label="Apenas com WhatsApp"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.hasWebsite}
                    onChange={(e) => handleFilterChange('hasWebsite', e.target.checked)}
                  />
                }
                label="Apenas com Website"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button onClick={clearFilters} color="secondary">
            Limpar Filtros
          </Button>
          <Box>
            <Button onClick={handleCloseFilters} sx={{ mr: 1 }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={applyFilters}>
              Aplicar Filtros
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LocalServices;