import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        const response = await fetch(`/api/users/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setVerified(true);
          toast.success('E-mail verificado com sucesso!');
        } else {
          setError(data.message || 'Erro ao verificar e-mail');
          toast.error(data.message || 'Erro ao verificar e-mail');
        }
      } catch (error) {
        console.error('Erro ao verificar e-mail:', error);
        setError('Erro de conexão. Tente novamente mais tarde.');
        toast.error('Erro de conexão. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmailToken();
    } else {
      setError('Token de verificação não encontrado');
      setLoading(false);
    }
  }, [token]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Verificando seu e-mail...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aguarde enquanto confirmamos sua conta.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        {verified ? (
          <>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom color="success.main">
              E-mail Verificado!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
              Sua conta foi verificada com sucesso. Agora você pode fazer login e aproveitar todos os recursos do sistema.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGoToLogin}
                size="large"
              >
                Fazer Login
              </Button>
              <Button
                variant="outlined"
                onClick={handleGoHome}
                size="large"
              >
                Ir para Início
              </Button>
            </Box>
          </>
        ) : (
          <>
            <ErrorIcon 
              sx={{ 
                fontSize: 80, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom color="error.main">
              Erro na Verificação
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
              Não foi possível verificar seu e-mail. O link pode ter expirado ou ser inválido.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGoToLogin}
                size="large"
              >
                Ir para Login
              </Button>
              <Button
                variant="outlined"
                onClick={handleGoHome}
                size="large"
              >
                Ir para Início
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyEmail;