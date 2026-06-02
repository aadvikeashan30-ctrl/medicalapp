import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure your backend URL.
// - Android emulator: http://10.0.2.2:5000/api
// - iOS simulator: http://localhost:5000/api
// - Physical device on LAN: http://<your-machine-ip>:5000/api
// You can override at runtime by setting EXPO_PUBLIC_API_URL.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

export default api;
