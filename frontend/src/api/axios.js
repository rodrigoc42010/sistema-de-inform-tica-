import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || '';

const instance = axios.create({
  baseURL,
  timeout: 15000
});

export default instance;
