// API configuration with environment variable support for Docker
const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '3001';
const API_URL =
  import.meta.env.VITE_API_URL || `http://${API_HOST}:${API_PORT}/api`;

export { API_URL };
