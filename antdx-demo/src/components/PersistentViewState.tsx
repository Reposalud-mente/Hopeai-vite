import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Modelo simple de persistencia de datos de vista
interface ViewData {
  scrollPosition?: number;
  activeTabKey?: string;
  searchQuery?: string;
  filterValues?: Record<string, unknown>;
  lastVisitTimestamp: number;
}

// Mapa de vistas persistidas
type PersistedViewsMap = Record<string, ViewData>;

interface PersistentViewStateProps {
  viewId: string; // Identificador único para esta vista
  onRestore?: (data: ViewData) => void; // Callback para restaurar el estado
  captureScrollPosition?: boolean;
  children: React.ReactNode;
}

// Duración máxima del cache en milisegundos (15 minutos)
const MAX_CACHE_AGE = 15 * 60 * 1000;

// Guardar datos de vista en localStorage
const saveViewState = (viewId: string, data: Partial<ViewData>) => {
  try {
    // Obtener todas las vistas persistidas
    const persistedViewsJSON = localStorage.getItem('persistedViews');
    const persistedViews: PersistedViewsMap = persistedViewsJSON 
      ? JSON.parse(persistedViewsJSON) 
      : {};
    
    // Actualizar o crear estado para esta vista específica
    persistedViews[viewId] = {
      ...persistedViews[viewId],
      ...data,
      lastVisitTimestamp: Date.now()
    };
    
    // Limpiar vistas antiguas
    Object.keys(persistedViews).forEach(key => {
      const view = persistedViews[key];
      if (Date.now() - view.lastVisitTimestamp > MAX_CACHE_AGE) {
        delete persistedViews[key];
      }
    });
    
    // Guardar todas las vistas actualizadas
    localStorage.setItem('persistedViews', JSON.stringify(persistedViews));
  } catch (error) {
    console.error('Error al guardar estado de vista:', error);
  }
};

// Obtener datos de vista desde localStorage
const getViewState = (viewId: string): ViewData | null => {
  try {
    const persistedViewsJSON = localStorage.getItem('persistedViews');
    if (!persistedViewsJSON) return null;
    
    const persistedViews: PersistedViewsMap = JSON.parse(persistedViewsJSON);
    const viewData = persistedViews[viewId];
    
    // Verificar si los datos son demasiado antiguos
    if (!viewData || Date.now() - viewData.lastVisitTimestamp > MAX_CACHE_AGE) {
      return null;
    }
    
    return viewData;
  } catch (error) {
    console.error('Error al obtener estado de vista:', error);
    return null;
  }
};

/**
 * Componente para persistir y restaurar el estado de una vista
 * Mejora la experiencia de usuario manteniendo el estado al navegar entre páginas
 */
const PersistentViewState: React.FC<PersistentViewStateProps> = ({
  viewId,
  onRestore,
  captureScrollPosition = true,
  children
}) => {
  const location = useLocation();
  const fullViewId = `${viewId}:${location.pathname}`;
  
  // Restaurar estado al montar el componente
  useEffect(() => {
    const savedState = getViewState(fullViewId);
    
    if (savedState && onRestore) {
      // Restaurar scroll si es necesario
      if (captureScrollPosition && typeof savedState.scrollPosition === 'number') {
        window.scrollTo(0, savedState.scrollPosition);
      }
      
      // Notificar al componente padre para restaurar otros estados
      onRestore(savedState);
    }
    
    // Registrar esta visita
    saveViewState(fullViewId, { lastVisitTimestamp: Date.now() });
  }, [fullViewId, onRestore, captureScrollPosition]);
  
  // Capturar posición de scroll y guardar al desmontar
  useEffect(() => {
    if (!captureScrollPosition) return;
    
    // Función para guardar posición de scroll
    const handleScroll = () => {
      saveViewState(fullViewId, { 
        scrollPosition: window.scrollY
      });
    };
    
    // Throttle para mejorar rendimiento
    let timeout: NodeJS.Timeout;
    const throttledScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(handleScroll, 200);
    };
    
    // Registrar listener de scroll
    window.addEventListener('scroll', throttledScroll);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      
      // Guardar posición final antes de desmontar
      handleScroll();
    };
  }, [fullViewId, captureScrollPosition]);
  
  return <>{children}</>;
};

// Hook para actualizar datos de vista
export const useUpdateViewState = (viewId: string, location: ReturnType<typeof useLocation>) => {
  const fullViewId = `${viewId}:${location.pathname}`;
  
  return (data: Partial<ViewData>) => {
    saveViewState(fullViewId, data);
  };
};

export default PersistentViewState; 