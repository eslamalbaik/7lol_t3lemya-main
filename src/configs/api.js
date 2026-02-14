import axios from 'axios';
import Cookies from 'js-cookie';

const DEFAULT_LOCAL_API = 'http://localhost:5000/api';
const DEFAULT_PROD_API = 'https://api.verifydespro.online/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? DEFAULT_LOCAL_API
    : DEFAULT_PROD_API
);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // أرسل الكوكي HttpOnly مع الطلب
});

// Check if there's a token in the cookies and add it to the headers if it exists
api.interceptors.request.use(
  (config) => {
    // اقرأ التوكن من localStorage أولاً ثم من الكوكي كاحتياطي
    const lsToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const cookieToken = Cookies.get('authToken');
    const token = lsToken || cookieToken;
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
