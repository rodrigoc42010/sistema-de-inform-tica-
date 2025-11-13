import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Você pode registrar o erro em um serviço de relatório de erro
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // UI de erro personalizada
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          p={3}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
            <ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" gutterBottom color="error">
              Oops! Algo deu errado
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box mt={2} mb={2}>
                <Typography variant="h6" color="error" gutterBottom>
                  Detalhes do erro (desenvolvimento):
                </Typography>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5', 
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 200
                  }}
                >
                  <Typography variant="body2" component="pre" style={{ fontSize: '12px' }}>
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleReload}
              sx={{ mt: 2 }}
            >
              Recarregar Página
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;