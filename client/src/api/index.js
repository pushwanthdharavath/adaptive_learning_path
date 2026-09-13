import axios from 'axios';

// Determine the API URL based on environment
const getBaseUrl = () => {
  // Using relative URLs to work with proxy config in package.json
  return '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 8000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to log outgoing requests
api.interceptors.request.use(
  config => {
    console.log('📡 Outgoing Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => {
    console.log('📥 Response Received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    // Log detailed error information
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default api;
