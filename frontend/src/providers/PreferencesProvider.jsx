import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const PreferencesContext = createContext(null);

const defaultSettings = {
  notifications: {
    email: true, push: true, sms: false,
    newTickets: true, ticketUpdates: true, marketing: false,
  },
  appearance: {
    theme: 'dark', fontSize: 'medium', highContrast: false,
  },
  privacy: {
    showProfile: true, showOnlineStatus: true, allowLocationAccess: true,
  },
  language: 'pt-BR',
};

function loadStoredSettings() {
  try {
    const raw = typeof window !== 'undefined' && localStorage.getItem('userSettings');
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

function systemMode() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function computeTheme(settings) {
  const mode = settings.appearance.theme === 'system' ? systemMode() : settings.appearance.theme;
  const baseFont = settings.appearance.fontSize === 'small' ? 13 : settings.appearance.fontSize === 'large' ? 16 : 14;
  const high = settings.appearance.highContrast;
  return createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? { background: { default: '#0f172a', paper: '#0f172a' } }
        : {}),
      primary: { main: high ? '#00e5ff' : '#06b6d4' },
    },
    typography: {
      fontSize: baseFont,
    },
    components: {
      MuiAppBar: { styleOverrides: { root: { background: mode === 'dark' ? 'rgba(30,41,59,0.8)' : undefined } } },
      MuiDrawer: { styleOverrides: { paper: { background: mode === 'dark' ? 'rgba(30,41,59,0.95)' : undefined } } },
    },
  });
}

export function PreferencesProvider({ children }) {
  const [settings, setSettings] = useState(loadStoredSettings());

  // Persist settings
  useEffect(() => {
    try { localStorage.setItem('userSettings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  // Apply language to document
  useEffect(() => {
    try { if (typeof document !== 'undefined') document.documentElement.lang = settings.language || 'pt-BR'; } catch {}
  }, [settings.language]);

  const theme = useMemo(() => computeTheme(settings), [settings]);

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <PreferencesContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

export default PreferencesProvider;
