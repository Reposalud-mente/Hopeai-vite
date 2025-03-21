/**
 * Servicio de autenticación para HopeAI
 * 
 * Este servicio maneja la autenticación de usuarios, almacenamiento
 * de tokens y gestión de sesiones.
 */

import axios from 'axios';
import { MemoryCache } from '../utils/cacheUtils';
import { useError } from '../hooks/useError';
import { ErrorSource } from '../context/ErrorContext';

// URL base para la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Cliente axios configurado
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Clave para almacenar el token en localStorage
const TOKEN_STORAGE_KEY = 'hopeai_auth_token';
const USER_STORAGE_KEY = 'hopeai_user';

// Interfaz para la respuesta de login
interface LoginResponse {
  token: string;
  user: User;
}

// Interfaz para datos del usuario
export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
}

// Caché para datos del usuario (30 minutos)
const userCache = new MemoryCache<User>(30 * 60 * 1000);

/**
 * Configura el token de autenticación en las peticiones
 * @param token Token JWT
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/**
 * Inicializa el token desde localStorage si existe
 */
export function initializeAuth(): void {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  
  if (token) {
    setAuthToken(token);
    
    // Restaurar usuario del localStorage si existe
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        userCache.set('currentUser', user);
      } catch (error) {
        console.error('Error al restaurar datos del usuario:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }
}

/**
 * Inicia sesión de usuario
 * @param username Nombre de usuario
 * @param password Contraseña
 * @returns Información del usuario autenticado
 */
export async function login(username: string, password: string): Promise<User> {
  const response = await apiClient.post<LoginResponse>('/auth/login', { 
    username, 
    password 
  });
  
  const { token, user } = response.data;
  
  // Configurar token para peticiones futuras
  setAuthToken(token);
  
  // Guardar usuario en caché y localStorage
  userCache.set('currentUser', user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  
  return user;
}

/**
 * Cierra la sesión del usuario
 */
export function logout(): void {
  // Limpiar token y datos de usuario
  setAuthToken(null);
  userCache.clear();
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Verifica si hay un usuario autenticado
 * @returns true si hay usuario autenticado
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Obtiene los datos del usuario actual
 * @returns Datos del usuario o null si no hay sesión
 */
export function getCurrentUser(): User | null {
  // Intentar obtener de caché primero
  const user = userCache.get('currentUser');
  if (user) {
    return user;
  }
  
  // Si no está en caché pero hay token, intentar obtener de localStorage
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (userJson) {
    try {
      const user = JSON.parse(userJson) as User;
      userCache.set('currentUser', user);
      return user;
    } catch (error) {
      console.error('Error al parsear datos del usuario:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Hook personalizado para usar el servicio de autenticación con manejo de errores
 */
export function useAuthService() {
  const { withErrorHandling } = useError();
  
  return {
    /**
     * Inicia sesión con manejo de errores
     */
    login: async (username: string, password: string) => {
      return withErrorHandling(
        async () => login(username, password),
        'Error al iniciar sesión',
        ErrorSource.API,
        { username }
      );
    },
    
    /**
     * Cierra sesión con manejo de errores
     */
    logout: () => {
      try {
        logout();
        return true;
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return false;
      }
    },
    
    isAuthenticated,
    getCurrentUser,
    initializeAuth
  };
} 