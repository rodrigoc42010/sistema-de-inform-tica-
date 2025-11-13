import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgotPassword, reset } from '../features/auth/authSlice';

// Material UI
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';

// Logo
import logo from '../assets/logo.svg';

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const dispatch = useDispatch();

  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success('Instruções de recuperação enviadas para seu email');
    }

    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  const onChange = (e) => {
    setEmail(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
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
      <Container maxWidth="sm">
        <Card className="auth-container">
          <CardContent>
            <Box className="auth-logo">
              <img src={logo} alt="Logo" height="60" />
              <Typography variant="h4" component="h1" gutterBottom>
                Recuperação de Senha
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              Informe seu email para receber instruções de recuperação de senha.
            </Typography>

            <form onSubmit={onSubmit} className="auth-form">
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

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Enviar Instruções
              </Button>
            </form>

            <Box mt={3} textAlign="center">
              <Typography variant="body2">
                <Link to="/login">
                  <Typography component="span" variant="body2" color="primary">
                    Voltar para o Login
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

export default ForgotPassword;