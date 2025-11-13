import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login, reset } from '../features/auth/authSlice';
import { getTopTechniciansByRegion } from '../features/technicians/technicianSlice';
import { selectAuthState } from '../selectors/authSelectors';
import { selectTopTechnicians } from '../selectors/technicianSelectors';

// Material UI
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
  Avatar,
  Rating,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

// Logo
import logo from '../assets/logo.svg';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    cpfCnpj: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('client');
  const [region, setRegion] = useState({ city: '', state: '' });
  const [animateRank, setAnimateRank] = useState(false);

  const { email, cpfCnpj, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(selectAuthState);
  const topTechnicians = useSelector(selectTopTechnicians);
  const didDispatchTopRef = useRef(false);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess || user) {
      if (user.role === 'client') {
        navigate('/client/dashboard');
      } else if (user.role === 'technician') {
        navigate('/technician/dashboard');
      }
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  useEffect(() => {
    if (didDispatchTopRef.current) return;
    didDispatchTopRef.current = true;
    // Tentar usar localStorage para cidade/estado caso já tenha sido salvo em cadastro
    const city = localStorage.getItem('city') || '';
    const state = localStorage.getItem('state') || '';
    setRegion({ city, state });

    // Buscar ranking ao carregar apenas se não estiver logado (para evitar erro de token)
    if (!user) {
      dispatch(getTopTechniciansByRegion({ city, state, limit: 5 }));
    }
  }, [dispatch, user]);

  // Dispara animação do painel de ranking ao montar
  useEffect(() => {
    setAnimateRank(true);
  }, []);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const userData =
      userType === 'technician'
        ? { cpfCnpj: cpfCnpj || email, password, role: 'technician' }
        : { email, password, role: 'client' };

    dispatch(login(userData));
  };

  // Removidos: handlers de login social (Google/Microsoft)

  const handleUserTypeChange = (event, newValue) => {
    setUserType(newValue);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <Box className="loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="auth-page">
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={12} md={7} lg={7}>
            <Card className="auth-container">
              <CardContent>
                <Box className="auth-logo">
                  <img src={logo} alt="Logo" height="60" />
                  <Typography variant="h4" component="h1" gutterBottom>
                    Sistema de Informática
                  </Typography>
                </Box>

                <Tabs
                  value={userType}
                  onChange={handleUserTypeChange}
                  variant="fullWidth"
                  className="auth-tabs"
                >
                  <Tab value="client" label="Cliente" />
                  <Tab value="technician" label="Técnico" />
                </Tabs>

                <form onSubmit={onSubmit} className="auth-form">
                  {userType === 'technician' ? (
                    <TextField
                      type="text"
                      id="cpfCnpj"
                      name="cpfCnpj"
                      value={cpfCnpj}
                      onChange={onChange}
                      label="CPF ou CNPJ"
                      placeholder="Ex: 000.000.000-00 ou 00.000.000/0000-00"
                      variant="outlined"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  ) : (
                    <TextField
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      label="Email"
                      variant="outlined"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}

                  <TextField
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    label="Senha"
                    variant="outlined"
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={toggleShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                  >
                    Entrar
                  </Button>
                </form>

                <Box mt={2} textAlign="center">
                  <Link to="/forgot-password">
                    <Typography variant="body2" color="primary">
                      Esqueceu a senha?
                    </Typography>
                  </Link>
                </Box>

                {/* Removido: divisão e botões de login social */}

                <Box mt={3} textAlign="center">
                  <Typography variant="body2">
                    Não tem uma conta?{' '}
                    <Link to="/register">
                      <Typography component="span" variant="body2" color="primary">
                        Registre-se
                      </Typography>
                    </Link>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5} lg={5}>
            <Paper elevation={0} sx={{ p: 2, height: '100%' }} className="rank-panel">
              <Typography variant="h6" gutterBottom>
                Melhores técnicos{region.city || region.state ? ` em ${region.city || ''}${region.state ? (region.city ? ', ' : '') + region.state : ''}` : ''}
              </Typography>
              <List>
                {Array.isArray(topTechnicians) && topTechnicians.map((t, idx) => (
                  <ListItem key={t.userId || t.technicianId} alignItems="flex-start" className={animateRank ? 'rank-item' : ''} style={{ animationDelay: `${idx * 120}ms` }}>
                    <ListItemAvatar>
                      <Avatar>{(t.name || '?').charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={t.name || 'Técnico'}
                      secondary={
                        <React.Fragment>
                          <Rating value={Number(t.rating || 0)} precision={0.5} readOnly size="small" />
                          <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                            ({t.totalReviews || 0})
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
                {(!Array.isArray(topTechnicians) || topTechnicians.length === 0) && (
                  <Typography variant="body2" color="text.secondary" className="rank-empty">Sem dados de ranking nesta região ainda.</Typography>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Login;