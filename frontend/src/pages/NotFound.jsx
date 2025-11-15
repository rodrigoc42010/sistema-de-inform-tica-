import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Material UI
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { selectUser } from '../selectors/authSelectors';

function NotFound() {
  const user = useSelector(selectUser);

  // Determinar para onde redirecionar com base no tipo de usuário
  const getHomeLink = () => {
    if (!user) return '/login';
    const segment = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
    const role = user?.role || (segment === 'technician' ? 'technician' : 'client');
    return `/${role}/dashboard`;
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h1" color="primary" sx={{ fontSize: '6rem', fontWeight: 'bold', mb: 2 }}>
            404
          </Typography>
          <Typography variant="h4" gutterBottom>
            Página Não Encontrada
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            A página que você está procurando não existe ou foi movida.
          </Typography>
          <Button
            component={Link}
            to={getHomeLink()}
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            size="large"
            sx={{ mt: 2 }}
          >
            Voltar para a Página Inicial
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default NotFound;