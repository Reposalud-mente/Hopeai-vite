import { useContext } from 'react';
import NavigationContext from '../context/NavigationContext';
import { useLocation } from 'react-router-dom';

/**
 * Hook personalizado para manejar la navegación en la aplicación
 * Proporciona acceso al estado de navegación actual y métodos para manipularlo
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  const location = useLocation();
  
  if (!context) {
    throw new Error('useNavigation debe usarse dentro de un NavigationProvider');
  }
  
  // Funciones auxiliares específicas para la navegación
  
  /**
   * Comprueba si la ruta actual coincide exactamente con la ruta proporcionada
   */
  const isExactRoute = (path: string): boolean => {
    return location.pathname === path;
  };
  
  /**
   * Comprueba si la ruta actual comienza con la ruta proporcionada (coincidencia parcial)
   */
  const isActiveRoute = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };
  
  /**
   * Determina si una clave del menú debe estar seleccionada según la ruta actual
   */
  const isSelectedKey = (key: string): boolean => {
    return context.selectedKeys.includes(key);
  };
  
  /**
   * Navega a una ruta específica con parámetros opcionales
   */
  const navigateToRoute = (
    route: string, 
    params?: Record<string, string | number>
  ): void => {
    if (!params) {
      context.navigateTo(route);
      return;
    }
    
    // Construir la URL con parámetros de consulta
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${route}?${queryString}` : route;
    
    context.navigateTo(url);
  };
  
  return {
    ...context,
    isExactRoute,
    isActiveRoute,
    isSelectedKey,
    navigateToRoute
  };
};

export default useNavigation; 