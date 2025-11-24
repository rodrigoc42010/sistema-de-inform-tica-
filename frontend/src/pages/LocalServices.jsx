import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Rating,
  TextField,
  Typography,
  Alert,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Call as CallIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  MyLocation as MyLocationIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Store as StoreIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';

// Categorias disponíveis
const categories = [
  { id: 'todos', label: 'Todos' },
  { id: 'informatica', label: 'Informática' },
  { id: 'celular', label: 'Celulares' },
  { id: 'eletronicos', label: 'Eletrônicos' },
  { id: 'redes', label: 'Redes' },
  { id: 'software', label: 'Software' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'impressoras', label: 'Impressoras' },
];

function LocalServices() {
  const navigate = useNavigate();

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [radius, setRadius] = useState(10); // km

  const defaultCenter = {
    lat: -23.55052,
    lng: -46.633308,
  };

  // Solicitar geolocalização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          fetchServices(location);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocationError('Não foi possível obter sua localização. Usando localização padrão (São Paulo).');
          setUserLocation(defaultCenter);
          fetchServices(defaultCenter);
        }
      );
    } else {
      setLocationError('Geolocalização não é suportada neste navegador.');
      setUserLocation(defaultCenter);
      fetchServices(defaultCenter);
    }
  }, []);

  // Buscar serviços da API
  const fetchServices = useCallback(async (location, customRadius = radius) => {
    if (!location) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/services/local?latitude=${location.lat}&longitude=${location.lng}&radius=${customRadius}`
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar serviços: ${response.status}`);
      }

      const data = await response.json();
      setServices(data.services || []);
      console.log(`Encontrados ${data.total} serviços (${data.registered} cadastrados, ${data.external} externos)`);

      if (data.services && data.services.length > 0) {
        toast.success(`${data.total} serviços encontrados!`);
      } else {
        toast.info('Nenhum serviço encontrado nesta região');
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast.error('Erro ao carregar serviços locais. Verifique se o backend está rodando.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [radius]);

  // Atualizar serviços quando o raio mudar
  useEffect(() => {
    if (userLocation) {
      fetchServices(userLocation, radius);
    }
  }, [radius]);

  // Refresh manual
  const handleRefresh = () => {
    if (userLocation) {
      toast.info('Atualizando serviços...');
      fetchServices(userLocation);
    }
  };

  // Solicitar localização novamente
  const handleRequestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setLocationError(null);
          fetchServices(location);
          toast.success('Localização atualizada!');
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          toast.error('Não foi possível obter sua localização');
        }
      );
    }
  };

  // Filtrar serviços
  const filteredServices = services.filter((service) => {
    const matchesSearch = searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'todos' ||
      (service.specialties && service.specialties.some(s =>
        s.toLowerCase().includes(selectedCategory)
      ));

    return matchesSearch && matchesCategory;
  });

  // Funções de contato
  const handleCall = (phone) => {
    if (!phone) return;
    const digits = phone.replace(/\D/g, '');
    window.location.href = `tel:+55${digits}`;
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const digits = phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Olá ${name}! Encontrei seu serviço no app e gostaria de mais informações.`);
    window.open(`https://wa.me/55${digits}?text=${text}`, '_blank');
  };

  const handleEmail = (email, name) => {
    if (!email) return;
    window.location.href = `mailto:${email}?subject=Contato - ${name}`;
  };

  const handleWebsite = (website) => {
    if (!website) return;
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
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
        <Container maxWidth="xl">
          {/* Header */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                Serviços Locais
              </Typography>
              <Box>
                <IconButton onClick={handleRequestLocation} color="primary" title="Atualizar localização">
                  <MyLocationIcon />
                </IconButton>
                <IconButton onClick={handleRefresh} color="primary" title="Atualizar serviços">
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              Encontre assistências técnicas e técnicos próximos a você.
              {userLocation && ` Mostrando serviços em um raio de ${radius}km.`}
            </Typography>

            {locationError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {locationError}
              </Alert>
            )}

            {/* Barra de pesquisa e filtros */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar serviços, empresas ou especialidades"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Raio de busca</InputLabel>
                  <Select
                    value={radius}
                    label="Raio de busca"
                    onChange={(e) => setRadius(Number(e.target.value))}
                  >
                    <MenuItem value={5}>5 km</MenuItem>
                    <MenuItem value={10}>10 km</MenuItem>
                    <MenuItem value={20}>20 km</MenuItem>
                    <MenuItem value={50}>50 km</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Categorias */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.label}
                  onClick={() => setSelectedCategory(category.id)}
                  color={selectedCategory === category.id ? 'primary' : 'default'}
                  variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Paper>

          {/* Lista de serviços */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Serviços Encontrados ({filteredServices.length})
            </Typography>

            {loading ? (
              <Grid container spacing={3}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid item xs={12} md={6} lg={4} key={i}>
                    <Card>
                      <Skeleton variant="rectangular" height={140} />
                      <CardContent>
                        <Skeleton variant="text" height={30} />
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : filteredServices.length > 0 ? (
              <Grid container spacing={3}>
                {filteredServices.map((service) => (
                  <Grid item xs={12} md={6} lg={4} key={service.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="h6" component="div">
                            {service.name}
                          </Typography>
                          {service.isRegistered && (
                            <Chip label="Cadastrado" size="small" color="primary" />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={service.rating || 5} size="small" readOnly />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({service.rating || 5.0})
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            {service.distance} km
                          </Typography>
                        </Box>

                        {service.address && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {service.address}
                          </Typography>
                        )}

                        {service.description && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {service.description.substring(0, 100)}
                            {service.description.length > 100 && '...'}
                          </Typography>
                        )}

                        {service.specialties && service.specialties.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {service.specialties.slice(0, 3).map((specialty, idx) => (
                              <Chip
                                key={idx}
                                label={specialty}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Box>
                          {service.phone && (
                            <IconButton size="small" color="primary" onClick={() => handleCall(service.phone)} title="Ligar">
                              <CallIcon fontSize="small" />
                            </IconButton>
                          )}
                          {service.phone && (
                            <IconButton size="small" color="success" onClick={() => handleWhatsApp(service.phone, service.name)} title="WhatsApp">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                              </svg>
                            </IconButton>
                          )}
                          {service.email && (
                            <IconButton size="small" color="primary" onClick={() => handleEmail(service.email, service.name)} title="Email">
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          )}
                          {service.website && (
                            <IconButton size="small" color="primary" onClick={() => handleWebsite(service.website)} title="Website">
                              <LanguageIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        {service.canRequestService && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate('/client/new-ticket', { state: { technicianId: service.id } })}
                          >
                            Solicitar
                          </Button>
                        )}
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
                  Tente ajustar o raio de busca ou os filtros.
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default LocalServices;