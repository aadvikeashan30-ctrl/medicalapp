import axios from 'axios';
import { isDemoMode, getDemoResponse } from './demoData';

// Use environment variable or default to /api (Vite proxy handles this in dev)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors — serve demo data when backend is unreachable
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isServerDown = !error.response || error.response.status >= 500;

    if (isServerDown) {
      // Check if user is demo user OR if backend is just down
      const userStr = localStorage.getItem('user');
      const isDemo = isDemoMode() || (userStr && userStr.includes('demo-doctor-001'));
      
      if (isDemo) {
        // Serve demo data from client
        const url = error.config?.url || '';
        const demoData = getDemoResponse(url);
        return Promise.resolve({
          data: demoData,
          status: 200,
          statusText: 'OK (Demo Mode)',
          headers: {},
          config: error.config
        });
      }

      // Backend is down but user isn't in demo mode — still try to serve demo data
      // This prevents blank screens when backend just isn't running
      const url = error.config?.url || '';
      const demoData = getDemoResponse(url);
      if (demoData && !demoData.message?.includes('no data available')) {
        return Promise.resolve({
          data: demoData,
          status: 200,
          statusText: 'OK (Offline Fallback)',
          headers: {},
          config: error.config
        });
      }
    }

    // Handle 401 — redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
