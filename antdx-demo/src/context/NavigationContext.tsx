import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Definición de tipos para las rutas de navegación
export type NavigationRoute = {
  key: string;
  path: string;
  label: string;
  icon?: React.ReactNode;
};

// Define el estado del contexto de navegación
interface NavigationContextType {
  // Estado actual
  currentPath: string;
  selectedKeys: string[];
  openKeys: string[];
  breadcrumbs: Array<{ title: string; path: string }>;
  
  // Funciones para manipular la navegación
  navigateTo: (path: string) => void;
  setOpenKeys: (keys: string[]) => void;
}

// Valores predeterminados para el contexto
const defaultContext: NavigationContextType = {
  currentPath: '/',
  selectedKeys: [],
  openKeys: [],
  breadcrumbs: [],
  navigateTo: () => {},
  setOpenKeys: () => {}
};

// Creamos el contexto
const NavigationContext = createContext<NavigationContextType>(defaultContext);

// Rutas principales de la aplicación
const mainRoutes: NavigationRoute[] = [
  { key: 'dashboard', path: '/', label: 'Dashboard' },
  { key: 'patients', path: '/pacientes', label: 'Pacientes' },
  { key: 'analysis', path: '/analisis', label: 'Análisis' },
];

// Hook para definir las migas de pan (breadcrumbs) basadas en la ruta actual
const useBreadcrumbs = (path: string) => {
  // Convertimos la ruta actual en un array de migas de pan
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [{ title: 'Inicio', path: '/' }];

  let currentPath = '';
  parts.forEach(part => {
    currentPath += `/${part}`;
    const route = mainRoutes.find(r => r.path === currentPath || r.key === part);
    if (route) {
      breadcrumbs.push({ title: route.label, path: currentPath });
    } else {
      // Si no es una ruta principal, usamos la parte como título
      // Esto puede mejorarse para obtener títulos dinámicos de la página actual
      breadcrumbs.push({ 
        title: part.charAt(0).toUpperCase() + part.slice(1), 
        path: currentPath 
      });
    }
  });

  return breadcrumbs;
};

// Componente proveedor del contexto
export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado interno
  const [openKeys, setOpenKeysState] = useState<string[]>([]);
  
  // La ruta actual desde react-router
  const currentPath = location.pathname;
  
  // Determinar las keys seleccionadas basadas en la ruta actual
  const selectedKeys = mainRoutes
    .filter(route => {
      // Para '/', solo seleccionar si es exactamente '/'
      if (route.path === '/' && currentPath === '/') {
        return true;
      }
      // Para otras rutas, comprobar si la ruta actual comienza con esta ruta
      return route.path !== '/' && currentPath.startsWith(route.path);
    })
    .map(route => route.key);
  
  console.log('Ruta actual:', currentPath, 'Keys seleccionadas:', selectedKeys);
  
  // Generar las migas de pan
  const breadcrumbs = useBreadcrumbs(currentPath);
  
  // Función para navegar a una ruta
  const navigateTo = useCallback((path: string) => {
    console.log('Navegando a:', path);
    // Asegurarnos de que la ruta comience con /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Usar navigate de react-router-dom
    navigate(normalizedPath);
    
    // Si después de un breve tiempo la URL no ha cambiado, forzamos la navegación
    setTimeout(() => {
      if (window.location.pathname !== normalizedPath) {
        console.log('Forzando navegación con window.location');
        window.location.href = normalizedPath;
      }
    }, 100);
  }, [navigate]);
  
  // Función para actualizar las keys abiertas en el menú
  const setOpenKeys = useCallback((keys: string[]) => {
    setOpenKeysState(keys);
  }, []);
  
  // Valor del contexto que se proveerá
  const contextValue: NavigationContextType = {
    currentPath,
    selectedKeys,
    openKeys,
    breadcrumbs,
    navigateTo,
    setOpenKeys
  };
  
  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useNavigation = () => useContext(NavigationContext);

export default NavigationContext; 