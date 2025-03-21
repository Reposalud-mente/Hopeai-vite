import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Default API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create a custom Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Custom error processing function type
export type ErrorProcessor = (error: unknown, contextInfo?: Record<string, unknown>) => void;

// Request interceptor for adding tokens or other authentication
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage or other source
    const token = localStorage.getItem('authToken');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor for handling common error scenarios globally
 * For specific error handling, use the errorProcessor parameter in API calls
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear auth token
      localStorage.removeItem('authToken');
      
      // Redirect to login if not a login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // Redirect to login page (can be implemented when routing is added)
        console.error('Authentication error - redirect to login');
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Make a GET request with error handling
 */
export const apiGet = async <T>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
  errorProcessor?: ErrorProcessor
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.get(url, {
      ...config,
      params,
    });
    return response.data;
  } catch (error) {
    // Process error if error processor provided
    if (errorProcessor) {
      errorProcessor(error, { url, method: 'GET', params });
    }
    throw error;
  }
};

/**
 * Make a POST request with error handling
 */
export const apiPost = async <T>(
  url: string,
  data?: Record<string, unknown>,
  config?: AxiosRequestConfig,
  errorProcessor?: ErrorProcessor
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.post(url, data, config);
    return response.data;
  } catch (error) {
    // Process error if error processor provided
    if (errorProcessor) {
      errorProcessor(error, { url, method: 'POST', data });
    }
    throw error;
  }
};

/**
 * Make a PUT request with error handling
 */
export const apiPut = async <T>(
  url: string,
  data?: Record<string, unknown>,
  config?: AxiosRequestConfig,
  errorProcessor?: ErrorProcessor
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.put(url, data, config);
    return response.data;
  } catch (error) {
    // Process error if error processor provided
    if (errorProcessor) {
      errorProcessor(error, { url, method: 'PUT', data });
    }
    throw error;
  }
};

/**
 * Make a DELETE request with error handling
 */
export const apiDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig,
  errorProcessor?: ErrorProcessor
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.delete(url, config);
    return response.data;
  } catch (error) {
    // Process error if error processor provided
    if (errorProcessor) {
      errorProcessor(error, { url, method: 'DELETE' });
    }
    throw error;
  }
};

/**
 * Make a PATCH request with error handling
 */
export const apiPatch = async <T>(
  url: string,
  data?: Record<string, unknown>,
  config?: AxiosRequestConfig,
  errorProcessor?: ErrorProcessor
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.patch(url, data, config);
    return response.data;
  } catch (error) {
    // Process error if error processor provided
    if (errorProcessor) {
      errorProcessor(error, { url, method: 'PATCH', data });
    }
    throw error;
  }
};

// Export the axios instance for direct use when needed
export default axiosInstance; 