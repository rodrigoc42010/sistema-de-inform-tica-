import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Rating,
  Slider,
  TextField,
  Typography,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Build as BuildIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import Sidebar from '../../components/Sidebar';

function NearbyTechnicians() {
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  
  // Mock data para técnicos próximos
  const [technicians, setTechnicians] = useState([
    {
      id: 1,
      name: 'João Silva',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      rating: 4.8,
      reviewCount: 124,
      distance: 2.3,
      services: ['Formatação', 'Instalação de Software', 'Remoção de Vírus'],
      specialties: ['Windows', 'MacOS'],
      available: true,
      phone: '(11) 98765-4321',
      email: 'joao.silva@exemplo.com',
      address: 'São Paulo, SP',
    },
    {
      id: 2,
      name: 'Maria Oliveira',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      rating: 4.5,
      reviewCount: 98,
      distance: 3.7,
      services: ['Reparo de Hardware', 'Backup de Dados', 'Configuração de Rede'],
      specialties: ['Hardware', 'Redes'],
      available: true,
      phone: '(11) 91234-5678',
      email: 'maria.oliveira@exemplo.com',
      address: 'São Paulo, SP',
    },
    {
      id: 3,
      name: 'Carlos Santos',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      rating: 4.9,
      reviewCount: 156,
      distance: 5.1,
      services: ['Montagem de Computador', 'Instalação de Periféricos', 'Consultoria'],
      specialties: ['Hardware', 'Gaming'],
      available: false,
      phone: '(11) 99876-5432',
      email: 'carlos.santos@exemplo.com',
      address: 'São Paulo, SP',
    },
    {
      id: 4,
      name: 'Ana Souza',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      rating: 4.7,
      reviewCount: 112,
      distance: 6.8,
      services: ['Suporte Remoto', 'Instalação de Software', 'Treinamento'],
      specialties: ['Windows', 'Office'],
      available: true,
      phone: '(11) 98765-8765',
      email: 'ana.souza@exemplo.com',
      address: 'São Paulo, SP',
    },
    {
      id: 5,
      name: 'Pedro Almeida',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      rating: 4.6,
      reviewCount: 87,
      distance: 8.2,
      services: ['Recuperação de Dados', 'Formatação', 'Instalação de Sistemas'],
      specialties: ['Recuperação de Dados', 'Linux'],
      available: true,
      phone: '(11) 99999-8888',
      email: 'pedro.almeida@exemplo.com',
      address: 'São Paulo, SP',
    },
  ]);

  // Lista de serviços disponíveis
  const availableServices = [
    'Formatação',
    'Instalação de Software',
    'Remoção de Vírus',
    'Reparo de Hardware',
    'Backup de Dados',
    'Configuração de Rede',
    'Montagem de Computador',
    'Instalação de Periféricos',
    'Consultoria',
    'Suporte Remoto',
    'Treinamento',
    'Recuperação de Dados',
  ];

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Verificar permissão de localização
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission(true);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocationPermission(false);
          setLoading(false);
        }
      );
    } else {
      setLocationPermission(false);
      setLoading(false);
    }

    return () => clearTimeout(timer);
  }, []);

  const handleRadiusChange = (event, newValue) => {
    setSearchRadius(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleRequestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission(true);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocationPermission(false);
        }
      );
    }
  };

  // Filtrar e ordenar técnicos
  const filteredTechnicians = technicians
    .filter((tech) => {
      // Filtrar por distância
      const withinRadius = tech.distance <= searchRadius;
      
      // Filtrar por pesquisa de texto
      const matchesSearch = searchQuery === '' || 
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tech.specialties.some(specialty => specialty.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filtrar por serviço selecionado
      const matchesService = selectedService === '' || 
        tech.services.includes(selectedService);
      
      return withinRadius && matchesSearch && matchesService;
    })
    .sort((a, b) => {
      // Ordenar por critério selecionado
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
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
          p: { xs: 2, md: 4, lg: 5 },
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          mt: '64px',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth={false} sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          maxWidth: '100%',
          width: '100%',
          px: { xs: 1, md: 2, lg: 3 }
        }}>
          <Paper elevation={3} sx={{ 
            p: { xs: 3, md: 5, lg: 6 }, 
            mb: 5, 
            width: '100%', 
            maxWidth: '100%'
          }}>
            <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4, fontWeight: 'bold' }}>
              Técnicos Próximos
            </Typography>

            {!locationPermission && !loading && (
              <Alert 
                severity="warning" 
                action={
                  <Button color="inherit" size="small" onClick={handleRequestLocation}>
                    Permitir
                  </Button>
                }
                sx={{ mb: 3 }}
              >
                Para encontrar técnicos próximos, é necessário permitir o acesso à sua localização.
              </Alert>
            )}

            {/* Filtros e pesquisa */}
            <Paper elevation={1} sx={{ 
              p: { xs: 3, md: 4, lg: 5 }, 
              mb: 5, 
              width: '100%', 
              maxWidth: '100%' 
            }}>
              <Grid container spacing={{ xs: 2, md: 3, lg: 4 }} alignItems="center">
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    fullWidth
                    size="large"
                    placeholder="Buscar por nome, serviço ou especialidade"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{ 
                      '& .MuiInputBase-root': { 
                        fontSize: '1.1rem',
                        height: '56px'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="large" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="large"
                    label="Serviço"
                    value={selectedService}
                    onChange={handleServiceChange}
                    sx={{ 
                      '& .MuiInputBase-root': { 
                        fontSize: '1.1rem',
                        height: '56px'
                      }
                    }}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="">Todos os serviços</option>
                    {availableServices.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="large"
                    label="Ordenar por"
                    value={sortBy}
                    onChange={handleSortChange}
                    sx={{ 
                      '& .MuiInputBase-root': { 
                        fontSize: '1.1rem',
                        height: '56px'
                      }
                    }}
                    SelectProps={{
                      native: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SortIcon fontSize="large" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <option value="distance">Distância</option>
                    <option value="rating">Avaliação</option>
                    <option value="name">Nome</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Button
                    fullWidth
                    size="large"
                    variant="outlined"
                    startIcon={<FilterListIcon fontSize="large" />}
                    sx={{ 
                      height: '56px',
                      fontSize: '1.1rem',
                      fontWeight: 'medium'
                    }}
                  >
                    Mais Filtros
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: { xs: 4, md: 5, lg: 6 } }}>
                <Typography gutterBottom variant="h6" sx={{ fontWeight: 'medium', fontSize: '1.2rem' }}>
                  Raio de busca: {searchRadius} km
                </Typography>
                <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
                  <Grid item>
                    <LocationOnIcon fontSize="large" color="primary" />
                  </Grid>
                  <Grid item xs>
                    <Slider
                      value={searchRadius}
                      onChange={handleRadiusChange}
                      aria-labelledby="distance-slider"
                      min={1}
                      max={50}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  <Grid item>
                    <Typography>{searchRadius} km</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
              </Box>
            ) : filteredTechnicians.length > 0 ? (
              <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto' }}>
                <Grid 
                  container 
                  spacing={{ xs: 2, md: 3, lg: 4, xl: 4 }} 
                  justifyContent="flex-start" 
                  alignItems="stretch"
                >
                  {filteredTechnicians.map((technician) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={technician.id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      boxShadow: 4,
                      borderRadius: 3,
                      transition: 'all 0.3s ease-in-out',
                      minWidth: '280px',
                      maxWidth: '350px',
                      mx: 'auto',
                      '&:hover': {
                        boxShadow: 12,
                        transform: 'translateY(-8px)'
                      }
                    }}>
                      <CardMedia
                        component="img"
                        height="240"
                        image={technician.avatar}
                        alt={technician.name}
                        sx={{ 
                          objectFit: 'cover',
                          objectPosition: 'center',
                          width: '100%',
                          backgroundColor: '#f5f5f5'
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1, p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2, fontSize: '1.3rem' }}>
                            {technician.name}
                          </Typography>
                          <Chip 
                            label={technician.available ? 'Disponível' : 'Indisponível'} 
                            color={technician.available ? 'success' : 'default'}
                            size="large"
                            sx={{ fontWeight: 'medium', fontSize: '0.9rem', px: 2, py: 1 }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Rating 
                            value={technician.rating} 
                            precision={0.1} 
                            readOnly 
                            size="large"
                            sx={{ fontSize: '1.5rem' }}
                          />
                          <Typography variant="body1" color="text.secondary" sx={{ ml: 1.5, fontSize: '1rem', fontWeight: 'medium' }}>
                            ({technician.rating}) · {technician.reviewCount} avaliações
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <LocationOnIcon fontSize="large" color="primary" />
                          <Typography variant="body1" color="text.secondary" sx={{ ml: 1.5, fontSize: '1rem' }}>
                            {technician.distance} km · {technician.address}
                          </Typography>
                        </Box>
                        
                        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'medium', fontSize: '1.1rem' }}>
                          Serviços:
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                          {technician.services.slice(0, 3).map((service) => (
                            <Chip
                              key={service}
                              label={service}
                              size="large"
                              sx={{ mr: 1, mb: 1, fontSize: '0.9rem', px: 2, py: 1 }}
                            />
                          ))}
                          {technician.services.length > 3 && (
                            <Chip
                              label={`+${technician.services.length - 3}`}
                              size="large"
                              variant="outlined"
                              sx={{ mb: 1, fontSize: '0.9rem', px: 2, py: 1 }}
                            />
                          )}
                        </Box>
                        
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', fontSize: '1.1rem' }}>
                          Especialidades:
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                          {technician.specialties.map((specialty) => (
                            <Chip
                              key={specialty}
                              label={specialty}
                              size="large"
                              variant="outlined"
                              color="primary"
                              sx={{ mr: 1, mb: 1, fontSize: '0.9rem', px: 2, py: 1 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions sx={{ p: 3.5, flexDirection: 'column', gap: 2 }}>
                        <Button 
                          size="large" 
                          startIcon={<BuildIcon fontSize="large" />}
                          variant="contained"
                          fullWidth
                          disabled={!technician.available}
                          sx={{ 
                            py: 1.5, 
                            borderRadius: 3, 
                            fontWeight: 'bold', 
                            fontSize: '1rem',
                            height: '48px'
                          }}
                        >
                          Solicitar Serviço
                        </Button>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', gap: 1 }}>
                        <IconButton 
                          size="large" 
                          color="primary" 
                          aria-label="phone" 
                          sx={{ 
                            border: 2, 
                            borderColor: 'primary.light', 
                            p: 1.5,
                            borderRadius: 2,
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'primary.light'
                            }
                          }}
                        >
                          <PhoneIcon fontSize="large" />
                        </IconButton>
                        <IconButton 
                          size="large" 
                          color="success" 
                          aria-label="whatsapp" 
                          sx={{ 
                            border: 2, 
                            borderColor: 'success.light', 
                            p: 1.5,
                            borderRadius: 2,
                            '&:hover': {
                              borderColor: 'success.main',
                              backgroundColor: 'success.light'
                            }
                          }}
                        >
                          <WhatsAppIcon fontSize="large" />
                        </IconButton>
                        <IconButton 
                          size="large" 
                          color="primary" 
                          aria-label="email" 
                          sx={{ 
                            border: 2, 
                            borderColor: 'primary.light', 
                            p: 1.5,
                            borderRadius: 2,
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'primary.light'
                            }
                          }}
                        >
                          <EmailIcon fontSize="large" />
                        </IconButton>
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
                </Grid>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: { xs: 4, md: 6, lg: 8 } }}>
                <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                  Nenhum técnico encontrado
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                  Tente ajustar seus filtros ou aumentar o raio de busca.
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default NearbyTechnicians;