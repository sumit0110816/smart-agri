import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agri_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agri_token');
      localStorage.removeItem('agri_user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth APIs ---
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password, role) => api.post('/auth/signup', { name, email, password, role }),
  googleLogin: (credential, role) => api.post('/auth/google', { credential, role }),
  getProfile: () => api.get('/auth/me')
};

// --- Trips APIs (Farmer ↔ Driver) ---
export const tripsAPI = {
  // Farmer: create a transport request
  create: (data) => api.post('/trips', data),
  // Farmer: get own posted trips
  mine: () => api.get('/trips/mine'),
  // Driver: get all pending trips from farmers
  available: () => api.get('/trips/available'),
  // Driver: accept a trip
  accept: (id) => api.put(`/trips/${id}/accept`),
  // Driver or Farmer: update trip status
  updateStatus: (id, status) => api.put(`/trips/${id}/status`, { status }),
  // Farmer: delete a pending trip
  delete: (id) => api.delete(`/trips/${id}`)
};

// --- Price APIs ---
export const priceAPI = {
  getCrops: () => api.get('/price/crops'),
  predict: (cropId, monthsAhead = 3) => api.post('/price/predict', { cropId, monthsAhead })
};

// --- Demand APIs ---
export const demandAPI = {
  forecast: (cropId) => api.post('/demand/forecast', { cropId })
};

// --- Market APIs ---
export const marketAPI = {
  find: (lat, lng, cropId) => api.post('/market/find', { lat, lng, cropId })
};

// --- Crop Recommendation APIs ---
export const cropAPI = {
  getOptions: () => api.get('/crop/options'),
  recommend: (soilType, season, waterAvailability) =>
    api.post('/crop/recommend', { soilType, season, waterAvailability })
};

// --- Storage APIs ---
export const storageAPI = {
  getAdvice: (cropId, currentPrice) =>
    api.post('/storage/advice', { cropId, currentPrice })
};

// --- Retailer APIs ---
export const retailerAPI = {
  negotiate: (crop, farmerPrice, message, retailerId, marketId) =>
    api.post('/retailer/negotiate', { crop, farmerPrice, message, retailerId, marketId })
};

// --- News APIs ---
export const newsAPI = {
  getAll: (category, limit) => api.get('/news', { params: { category, limit } }),
  getOne: (id) => api.get(`/news/${id}`)
};

// --- Yojana APIs ---
export const yojanaAPI = {
  getAll: (category, lang) => api.get('/yojana', { params: { category, lang } }),
  getOne: (id) => api.get(`/yojana/${id}`)
};

// --- Weather APIs ---
export const weatherAPI = {
  getCurrent: (lat, lng) => api.get('/weather', { params: { lat, lng } })
};

// --- Voice APIs ---
export const voiceAPI = {
  query: (text, language) => api.post('/voice/query', { text, language })
};

export default api;
