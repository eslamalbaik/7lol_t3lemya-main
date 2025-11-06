import axios from 'axios';
import Cookies from 'js-cookie';
// http://localhost:5000/api/certificates/analyze-template
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // أرسل الكوكي HttpOnly مع الطلب
  // baseURL: 'https://sevenlol-back-5.onrender.com/api',
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
