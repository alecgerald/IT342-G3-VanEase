import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Log request details for debugging
      console.log('Request config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        token: token.substring(0, 20) + '...'
      });
    } else {
      console.warn('No token found in localStorage for request to:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    // Log error details
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers
    });

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, clearing token and redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/manager-login';
    }
    // Handle 403 Forbidden errors
    else if (error.response?.status === 403) {
      console.log('Access forbidden, user may not have required role');
      localStorage.removeItem('token');
      window.location.href = '/manager-login';
    }
    return Promise.reject(error);
  }
);

export default api; 