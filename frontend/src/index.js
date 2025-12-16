import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import PreferencesProvider from './providers/PreferencesProvider';
import App from './App';
import './index.css';

try {
  const __gaId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  if (typeof document !== 'undefined' && __gaId && !window.__gaLoaded) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(__gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', __gaId, { anonymize_ip: true });
    window.__gaLoaded = true;
  }
} catch (_) {}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </Provider>
  </React.StrictMode>
);
