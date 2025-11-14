import axios from 'axios';

const runtimeBase = (typeof window !== 'undefined' && (window.__API_BASE_URL__ || localStorage.getItem('API_BASE_URL'))) || '';
const baseURL = process.env.REACT_APP_API_BASE_URL || runtimeBase || '';

const instance = axios.create({
  baseURL,
  timeout: 15000
});

export default instance;
