import axios from 'axios';

const runtimeBase = (typeof window !== 'undefined' && (window.__API_BASE_URL__ || localStorage.getItem('API_BASE_URL'))) || '';
const resolvedBase = process.env.REACT_APP_API_BASE_URL || runtimeBase || (typeof window !== 'undefined' ? window.location.origin : '');

const instance = axios.create({
  baseURL: resolvedBase,
  timeout: 15000
});

export default instance;
