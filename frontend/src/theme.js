import { createTheme } from '@mui/material/styles';

// Tema Escuro Moderno com Glassmorphism
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#06b6d4', // Cyan vibrante
      light: '#22d3ee',
      dark: '#0891b2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6', // Purple
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    background: {
      default: '#0f172a', // Navy profundo
      paper: 'rgba(30, 41, 59, 0.6)', // Glass effect
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#94a3b8',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '0',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0 2px 8px rgba(0, 0, 0, 0.1)',
    '0 4px 16px rgba(0, 0, 0, 0.2)',
    '0 8px 32px rgba(0, 0, 0, 0.3)',
    '0 12px 48px rgba(0, 0, 0, 0.4)',
    '0 16px 64px rgba(0, 0, 0, 0.5)',
    '0 8px 32px 0 rgba(0, 0, 0, 0.37)', // Glass shadow
    '0 4px 16px rgba(6, 182, 212, 0.3)', // Cyan glow
    '0 4px 16px rgba(139, 92, 246, 0.3)', // Purple glow
    '0 4px 16px rgba(16, 185, 129, 0.3)', // Green glow
    '0 4px 16px rgba(245, 158, 11, 0.3)', // Yellow glow
    '0 4px 16px rgba(239, 68, 68, 0.3)', // Red glow
    ...Array(13).fill('0 8px 32px rgba(0, 0, 0, 0.3)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0f172a',
          backgroundImage: 'none',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.1) #1e293b',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#1e293b',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        sizeLarge: {
          minHeight: 48,
          fontSize: '1rem',
          padding: '12px 32px',
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.875rem',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        },
        elevation3: {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
          fontSize: '0.8125rem',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          backdropFilter: 'blur(8px)',
        },
        colorSuccess: {
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        },
        colorError: {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
        colorWarning: {
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        },
        colorInfo: {
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#06b6d4',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          color: '#cbd5e1',
          '&.Mui-selected': {
            color: '#06b6d4',
          },
          '&:hover': {
            color: '#f8fafc',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: 'blur(8px)',
        },
        standardWarning: {
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
        },
        standardSuccess: {
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
        },
        standardError: {
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
        },
        standardInfo: {
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#60a5fa',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        head: {
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
          color: '#cbd5e1',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.05)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
});

export default theme;