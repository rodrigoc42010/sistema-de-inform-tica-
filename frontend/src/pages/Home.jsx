import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  BuildCircle as BuildCircleIcon,
  Info as InfoIcon,
  LocationOn as LocationOnIcon,
  Payments as PaymentsIcon,
  Security as SecurityIcon,
  PhoneAndroid as PhoneAndroidIcon,
  SportsEsports as SportsEsportsIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import DOMPurify from 'dompurify';

// Evitar duplo fetch em desenvolvimento devido ao React.StrictMode
const isDev = process.env.NODE_ENV === 'development';
let hasFetchedAdsDev = false;

const Home = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    if (isDev && hasFetchedAdsDev) return;
    if (isDev) hasFetchedAdsDev = true;
    let isMounted = true;
    const fetchPublicAds = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/ads/public');
        if (!res.ok) throw new Error('Falha ao carregar anúncios');
        const data = await res.json();
        if (isMounted) {
          setAds(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setError(e.message || 'Erro ao buscar anúncios');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPublicAds();

    const handleAdsUpdated = () => {
      // Após criação/edição na área técnica, atualiza a lista pública
      fetchPublicAds();
    };
    window.addEventListener('ads-updated', handleAdsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('ads-updated', handleAdsUpdated);
    };
  }, []);

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('pt-BR');
    } catch (_) {
      return null;
    }
  };

  const getAudienceLabel = (aud) => {
    if (aud === 'client') return 'Clientes';
    if (aud === 'technician') return 'Técnicos';
    return 'Todos';
  };

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ py: { xs: 6, md: 10 }, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff' }} gutterBottom>
                Conecte clientes e técnicos especializados
              </Typography>
              <Typography variant="h6" paragraph sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 800, lineHeight: 1.5 }}>
                Encontre profissionais próximos para assistência técnica em informática, celulares e videogames. Gerencie seus chamados com transparência e divulgue serviços com anúncios. Pagamentos e recibos integrados, tudo em um só lugar.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <Button variant="contained" startIcon={<BuildCircleIcon />} component={Link} to="/register">
                  Sou Cliente
                </Button>
                <Button variant="contained" startIcon={<BuildCircleIcon />} component={Link} to="/register">
                  Sou Técnico
                </Button>
                <Button variant="contained" startIcon={<InfoIcon />} component={Link} to="/login">
                  Entrar
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CampaignIcon sx={{ mr: 1, color: '#93c5fd' }} />
                  <Typography variant="h6" sx={{ color: '#fff' }}>Anúncios e experiência</Typography>
                </Box>
                <Typography variant="body1" paragraph sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Técnicos podem promover seus serviços com anúncios visíveis para clientes. Cada postagem gera uma taxa administrativa transparente. Clientes podem optar por remover anúncios por período.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<CampaignIcon />} label="Promoção de serviços" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                  <Chip icon={<PaymentsIcon />} label="Taxa de postagem" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Recursos */}
      <Container sx={{ py: 6 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
          Serviços Especializados
        </Typography>

        {/* Categorias de Serviços */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, textAlign: 'center' }}>
              <ComputerIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Informática</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manutenção de computadores, notebooks, redes e sistemas operacionais.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip size="small" label="Hardware" />
                <Chip size="small" label="Software" />
                <Chip size="small" label="Redes" />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, textAlign: 'center' }}>
              <PhoneAndroidIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Celulares</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Reparo de smartphones, tablets, troca de telas, baterias e componentes.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip size="small" label="Telas" />
                <Chip size="small" label="Baterias" />
                <Chip size="small" label="Software" />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2, textAlign: 'center' }}>
              <SportsEsportsIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Videogames</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manutenção de consoles, controles, limpeza e reparo de componentes.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip size="small" label="Consoles" />
                <Chip size="small" label="Controles" />
                <Chip size="small" label="Limpeza" />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Funcionalidades da Plataforma */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Funcionalidades da Plataforma
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Técnicos próximos</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Use geolocalização para encontrar profissionais especializados na sua região.
              </Typography>
              <Button component={Link} to="/client/nearby-technicians" size="small">Explorar</Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BuildCircleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Gestão de chamados</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Acompanhe cada etapa do serviço, do orçamento à conclusão.
              </Typography>
              <Button component={Link} to="/client/new-ticket" size="small">Criar chamado</Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PaymentsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pagamentos e recibos</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Registre pagamentos com recibos e histórico detalhado.
              </Typography>
              <Button component={Link} to="/client/payments" size="small">Ver pagamentos</Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Segurança</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Autenticação segura e mitigação de abusos no acesso.
              </Typography>
              <Button component={Link} to="/login" size="small">Entrar</Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Como funciona */}
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>Como funciona</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }} variant="outlined">
                <Typography variant="subtitle2" color="primary">1. Cadastre-se</Typography>
                <Typography variant="body2" color="text.secondary">Crie sua conta como cliente ou técnico especializado.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }} variant="outlined">
                <Typography variant="subtitle2" color="primary">2. Crie/receba chamados</Typography>
                <Typography variant="body2" color="text.secondary">Clientes abrem chamados; técnicos enviam orçamentos especializados.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', borderRadius: 2 }} variant="outlined">
                <Typography variant="subtitle2" color="primary">3. Acompanhe e pague</Typography>
                <Typography variant="body2" color="text.secondary">Acompanhe o serviço, registre pagamentos e receba recibos.</Typography>
              </Paper>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" component={Link} to="/register">Começar agora</Button>
            <Button variant="outlined" component={Link} to="/client/local-services">Serviços locais</Button>
          </Box>
        </Paper>
      </Container>

      {/* Vitrine de anúncios */}
      <Container sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CampaignIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Anúncios de Técnicos</Typography>
        </Box>
        {loading ? (
          <Typography>Carregando anúncios...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : ads.length === 0 ? (
          <Typography>Nenhum anúncio disponível no momento.</Typography>
        ) : (
          <Grid container spacing={3}>
            {ads.map((ad) => {
              const start = formatDate(ad.startDate);
              const end = formatDate(ad.endDate);
              const audience = getAudienceLabel(ad.audience);
              const showMetrics = typeof ad.impressions === 'number' || typeof ad.clicks === 'number';
              return (
                <Grid item xs={12} sm={6} md={4} key={ad._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {ad.mediaUrl ? (
                      <CardMedia component="img" height="160" image={ad.mediaUrl} alt={ad.title} />
                    ) : (
                      <Box sx={{ height: 160, background: 'linear-gradient(135deg, #eef3ff, #ffffff)' }} />
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" label={audience} />
                        {start && end && <Chip size="small" label={`${start} - ${end}`} />}
                      </Box>
                      <Typography variant="h6" gutterBottom>{ad.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 56 }} component="div">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ad.text) }} />
                      </Typography>
                      {showMetrics && (
                        <Typography variant="caption" color="text.secondary">
                          {typeof ad.impressions === 'number' ? `Impressões: ${ad.impressions}` : ''}
                          {typeof ad.clicks === 'number' ? `  •  Cliques: ${ad.clicks}` : ''}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ mt: 'auto' }}>
                      {ad.linkUrl && (
                        <Button size="small" href={ad.linkUrl} target="_blank" rel="noopener noreferrer">
                          Ver detalhes
                        </Button>
                      )}
                      <Button size="small" component={Link} to="/register">Criar conta</Button>
                      <Button size="small" component={Link} to="/login">Entrar</Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Home;
