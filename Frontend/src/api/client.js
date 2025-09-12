// client.js
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7008';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Remove Content-Type for FormData requests
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Önce backend'den gelen spesifik hata mesajını yakala.
    const backendMessage = error.response?.data?.message || error.response?.data?.Message;

    if (backendMessage) {
      // Backend'den mesaj varsa, onu göster.
      if (error.response.status === 403) { // 403: Yetki yok
        toast.warn(backendMessage);
      } else { // 400, 404, vb.
        toast.error(backendMessage);
      }
    } else {
      // 2. Backend'den mesaj yoksa, genel HTTP durumuna göre davran.
      switch (error.response?.status) {
        case 401: // Oturum yok
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
            toast.error('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
          }
          break;
        case 403: // Genel yetki hatası
          toast.warn('Bu işlemi yapmak için yetkiniz bulunmuyor.');
          break;
        case 500: // Sunucu hatası
          toast.error('Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
          break;
        default:
          toast.error('Bilinmeyen bir hata oluştu.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;


