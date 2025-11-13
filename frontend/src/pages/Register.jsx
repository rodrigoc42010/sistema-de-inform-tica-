import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register, reset } from '../features/auth/authSlice';

// Material UI
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Build as BuildIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

// Logo
import logo from '../assets/logo.svg';

// Lista de serviços disponíveis para técnicos
const availableServices = [
  // Serviços de Informática
  { id: 1, name: 'Formatação de Computadores', defaultPrice: 100 },
  { id: 2, name: 'Instalação de Software', defaultPrice: 50 },
  { id: 3, name: 'Limpeza de Hardware', defaultPrice: 80 },
  { id: 4, name: 'Remoção de Vírus', defaultPrice: 70 },
  { id: 5, name: 'Recuperação de Dados', defaultPrice: 150 },
  { id: 6, name: 'Montagem de Computadores', defaultPrice: 120 },
  { id: 7, name: 'Configuração de Rede', defaultPrice: 90 },
  { id: 8, name: 'Instalação de Periféricos', defaultPrice: 40 },
  { id: 9, name: 'Atualização de Hardware', defaultPrice: 100 },
  { id: 10, name: 'Suporte Remoto', defaultPrice: 60 },
  
  // Serviços de Celulares
  { id: 11, name: 'Troca de Tela de Celular', defaultPrice: 120 },
  { id: 12, name: 'Troca de Bateria', defaultPrice: 80 },
  { id: 13, name: 'Reparo de Placa Mãe', defaultPrice: 200 },
  { id: 14, name: 'Desbloqueio de Aparelho', defaultPrice: 50 },
  { id: 15, name: 'Instalação de ROM/Firmware', defaultPrice: 70 },
  { id: 16, name: 'Reparo de Botões e Conectores', defaultPrice: 60 },
  { id: 17, name: 'Limpeza e Manutenção', defaultPrice: 40 },
  { id: 18, name: 'Recuperação de Dados Móveis', defaultPrice: 100 },
  
  // Serviços de Videogames
  { id: 19, name: 'Limpeza de Console', defaultPrice: 60 },
  { id: 20, name: 'Troca de Pasta Térmica', defaultPrice: 80 },
  { id: 21, name: 'Reparo de Controles', defaultPrice: 70 },
  { id: 22, name: 'Instalação de HD/SSD', defaultPrice: 90 },
  { id: 23, name: 'Desbloqueio de Console', defaultPrice: 120 },
  { id: 24, name: 'Reparo de Leitor de Disco', defaultPrice: 150 },
  { id: 25, name: 'Configuração de Rede/Online', defaultPrice: 50 },
  { id: 26, name: 'Downgrade/Upgrade de Firmware', defaultPrice: 100 },
];

function Register() {
  const [activeStep, setActiveStep] = useState(0);
  const [userType, setUserType] = useState('client');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Dados básicos (etapa 1)
  const [basicData, setBasicData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpfCnpj: '',
  });
  
  // Dados de endereço (etapa 2)
  const [addressData, setAddressData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  });
  
  // Dados específicos para técnicos (etapa 3)
  const [technicianData, setTechnicianData] = useState({
    services: [],
    pickupService: false,
    pickupFee: 0,
    certifications: '',
    paymentMethods: [],
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess || user) {
      // Mostrar mensagem de verificação de e-mail se presente
      if (message && message.includes('Verifique seu e-mail')) {
        toast.success(message, { autoClose: 8000 });
      }
      
      if (user.role === 'client') {
        navigate('/client/dashboard');
      } else if (user.role === 'technician') {
        navigate('/technician/dashboard');
      }
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const handleNext = () => {
    // Validação da etapa atual
    if (activeStep === 0) {
      if (!validateBasicData()) {
        return;
      }
    } else if (activeStep === 1) {
      if (!validateAddressData()) {
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateBasicData = () => {
    if (!basicData.name || !basicData.email || !basicData.password || !basicData.confirmPassword || !basicData.phone || !basicData.cpfCnpj) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return false;
    }
    
    if (basicData.password !== basicData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return false;
    }
    
    if (basicData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    return true;
  };

  const validateAddressData = () => {
    if (!addressData.street || !addressData.city || !addressData.state || !addressData.country || !addressData.zipCode) {
      toast.error('Por favor, preencha todos os campos obrigatórios de endereço');
      return false;
    }
    
    return true;
  };

  const handleUserTypeChange = (event, newValue) => {
    setUserType(newValue);
  };

  const handleBasicDataChange = (e) => {
    setBasicData({
      ...basicData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddressDataChange = (e) => {
    setAddressData({
      ...addressData,
      [e.target.name]: e.target.value,
    });
  };

  // Auto-preencher endereço pelo CEP (BR): quando o CEP tiver 8 dígitos, buscar no ViaCEP
  useEffect(() => {
    const rawCep = (addressData.zipCode || '').replace(/\D/g, '');
    if (rawCep.length === 8) {
      (async () => {
        try {
          const resp = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
          const data = await resp.json();
          if (!data || data.erro) return;
          setAddressData((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            country: prev.country || 'Brasil',
          }));
        } catch (e) {
          // Silencia erros de rede para não interromper o fluxo de registro
        }
      })();
    }
  }, [addressData.zipCode]);

  const handleTechnicianDataChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name === 'services') {
      // Tratamento especial para serviços selecionados
      const serviceId = parseInt(value);
      const service = availableServices.find(s => s.id === serviceId);
      
      if (checked) {
        // Adicionar serviço
        setTechnicianData({
          ...technicianData,
          services: [...technicianData.services, {
            id: service.id,
            name: service.name,
            initialPrice: service.defaultPrice
          }]
        });
      } else {
        // Remover serviço
        setTechnicianData({
          ...technicianData,
          services: technicianData.services.filter(s => s.id !== serviceId)
        });
      }
    } else if (name === 'paymentMethods') {
      // Tratamento para métodos de pagamento
      if (checked) {
        setTechnicianData({
          ...technicianData,
          paymentMethods: [...technicianData.paymentMethods, value]
        });
      } else {
        setTechnicianData({
          ...technicianData,
          paymentMethods: technicianData.paymentMethods.filter(method => method !== value)
        });
      }
    } else if (type === 'checkbox') {
      setTechnicianData({
        ...technicianData,
        [name]: checked
      });
    } else {
      setTechnicianData({
        ...technicianData,
        [name]: value
      });
    }
  };

  const handleServicePriceChange = (serviceId, price) => {
    setTechnicianData({
      ...technicianData,
      services: technicianData.services.map(service => 
        service.id === serviceId ? { ...service, initialPrice: price } : service
      )
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    // Preparar dados para envio
    const userData = {
      name: basicData.name,
      email: basicData.email,
      password: basicData.password,
      role: userType,
      phone: basicData.phone,
      cpfCnpj: basicData.cpfCnpj,
      address: addressData,
    };
    
    // Adicionar dados específicos para técnicos
    if (userType === 'technician') {
      userData.technician = technicianData;
    }
    
    dispatch(register(userData));
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isLoading) {
    return (
      <Box className="loading">
        <CircularProgress />
      </Box>
    );
  }

  // Etapas do registro
  const steps = ['Informações Básicas', 'Endereço', userType === 'technician' ? 'Serviços Oferecidos' : 'Confirmação'];

  return (
    <Box className="auth-page">
      <Container maxWidth="md">
        <Card className="auth-container">
          <CardContent>
            <Box className="auth-logo">
              <img src={logo} alt="Logo" height="60" />
              <Typography variant="h4" component="h1" gutterBottom>
                Registro de {userType === 'client' ? 'Cliente' : 'Técnico'}
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

            <Box sx={{ width: '100%', mt: 4 }}>
              <Stepper activeStep={activeStep}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mt: 4 }}>
                {activeStep === 0 && (
                  // Etapa 1: Informações Básicas
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        name="name"
                        label="Nome Completo"
                        value={basicData.name}
                        onChange={handleBasicDataChange}
                        fullWidth
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="email"
                        type="email"
                        label="Email"
                        value={basicData.email}
                        onChange={handleBasicDataChange}
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
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        label="Senha"
                        value={basicData.password}
                        onChange={handleBasicDataChange}
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
                                onClick={toggleShowPassword}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        label="Confirmar Senha"
                        value={basicData.confirmPassword}
                        onChange={handleBasicDataChange}
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
                                onClick={toggleShowConfirmPassword}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="phone"
                        label="Telefone"
                        value={basicData.phone}
                        onChange={handleBasicDataChange}
                        fullWidth
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="cpfCnpj"
                        label={userType === 'client' ? 'CPF' : 'CNPJ ou CPF'}
                        value={basicData.cpfCnpj}
                        onChange={handleBasicDataChange}
                        fullWidth
                        required
                        placeholder={userType === 'client' ? '000.000.000-00' : '00.000.000/0000-00 ou 000.000.000-00'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                        helperText={userType === 'technician' ? 'Se não tiver CNPJ, informe seu CPF' : ''}
                      />
                    </Grid>
                  </Grid>
                )}

                {activeStep === 1 && (
                  // Etapa 2: Endereço
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        name="street"
                        label="Endereço"
                        value={addressData.street}
                        onChange={handleAddressDataChange}
                        fullWidth
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOnIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        name="number"
                        label="Número"
                        value={addressData.number}
                        onChange={handleAddressDataChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="complement"
                        label="Complemento"
                        value={addressData.complement}
                        onChange={handleAddressDataChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="neighborhood"
                        label="Bairro"
                        value={addressData.neighborhood}
                        onChange={handleAddressDataChange}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="city"
                        label="Cidade"
                        value={addressData.city}
                        onChange={handleAddressDataChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="state"
                        label="Estado"
                        value={addressData.state}
                        onChange={handleAddressDataChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="country"
                        label="País"
                        value={addressData.country}
                        onChange={handleAddressDataChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="zipCode"
                        label="CEP"
                        value={addressData.zipCode}
                        onChange={handleAddressDataChange}
                        fullWidth
                        required
                        helperText="Digite o CEP (apenas números). Ao completar, vamos preencher automaticamente."
                      />
                    </Grid>
                  </Grid>
                )}

                {activeStep === 2 && userType === 'technician' && (
                  // Etapa 3: Serviços Oferecidos (apenas para técnicos)
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Selecione os serviços que você oferece:
                      </Typography>
                      <FormGroup>
                        {availableServices.map((service) => (
                          <Grid container spacing={2} key={service.id} alignItems="center">
                            <Grid item xs={8}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="services"
                                    value={service.id}
                                    onChange={handleTechnicianDataChange}
                                    checked={technicianData.services.some(s => s.id === service.id)}
                                  />
                                }
                                label={service.name}
                              />
                            </Grid>
                            {technicianData.services.some(s => s.id === service.id) && (
                              <Grid item xs={4}>
                                <TextField
                                  type="number"
                                  label="Preço Inicial (R$)"
                                  value={technicianData.services.find(s => s.id === service.id).initialPrice}
                                  onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                  fullWidth
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <AttachMoneyIcon />
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              </Grid>
                            )}
                          </Grid>
                        ))}
                      </FormGroup>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="pickupService"
                            checked={technicianData.pickupService}
                            onChange={handleTechnicianDataChange}
                          />
                        }
                        label="Ofereço serviço de busca de equipamentos"
                      />
                    </Grid>

                    {technicianData.pickupService && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="pickupFee"
                          type="number"
                          label="Taxa de Deslocamento (R$)"
                          value={technicianData.pickupFee}
                          onChange={handleTechnicianDataChange}
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoneyIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <TextField
                        name="certifications"
                        label="Certificações (separadas por vírgula)"
                        value={technicianData.certifications}
                        onChange={handleTechnicianDataChange}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">Métodos de Pagamento Aceitos</FormLabel>
                        <FormGroup row>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="paymentMethods"
                                value="Dinheiro"
                                checked={technicianData.paymentMethods.includes('Dinheiro')}
                                onChange={handleTechnicianDataChange}
                              />
                            }
                            label="Dinheiro"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="paymentMethods"
                                value="Cartão de Crédito"
                                checked={technicianData.paymentMethods.includes('Cartão de Crédito')}
                                onChange={handleTechnicianDataChange}
                              />
                            }
                            label="Cartão de Crédito"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="paymentMethods"
                                value="Cartão de Débito"
                                checked={technicianData.paymentMethods.includes('Cartão de Débito')}
                                onChange={handleTechnicianDataChange}
                              />
                            }
                            label="Cartão de Débito"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="paymentMethods"
                                value="Pix"
                                checked={technicianData.paymentMethods.includes('Pix')}
                                onChange={handleTechnicianDataChange}
                              />
                            }
                            label="Pix"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="paymentMethods"
                                value="Transferência Bancária"
                                checked={technicianData.paymentMethods.includes('Transferência Bancária')}
                                onChange={handleTechnicianDataChange}
                              />
                            }
                            label="Transferência Bancária"
                          />
                        </FormGroup>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}

                {activeStep === 2 && userType === 'client' && (
                  // Etapa 3: Confirmação (para clientes)
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      Confirme seus dados para finalizar o registro
                    </Typography>
                    <Typography variant="body1">
                      Ao clicar em "Registrar", você concorda com nossos termos de serviço e política de privacidade.
                    </Typography>
                  </Box>
                )}

                {activeStep === 3 && userType === 'technician' && (
                  // Etapa 4: Confirmação (para técnicos)
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      Confirme seus dados para finalizar o registro
                    </Typography>
                    <Typography variant="body1">
                      Ao clicar em "Registrar", você concorda com nossos termos de serviço e política de privacidade.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Nota: Técnicos pagam uma taxa fixa para ter acesso ao sistema.
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Voltar
                  </Button>
                  <Box>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={onSubmit}
                      >
                        Registrar
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                      >
                        Próximo
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box mt={3} textAlign="center">
              <Typography variant="body2">
                Já tem uma conta?{' '}
                <Link to="/login">
                  <Typography component="span" variant="body2" color="primary">
                    Faça login
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Register;