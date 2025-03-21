/**
 * Servicio para analíticas y métricas de la aplicación
 * 
 * Este servicio proporciona funcionalidades para rastrear el uso de la
 * aplicación, almacenar métricas y enviarlas a un servidor de analíticas.
 */

import { MemoryCache } from '../utils/cacheUtils';
import { useAuthService } from './authService';

// Tipos de eventos para analíticas
export enum AnalyticsEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  VIEW_PATIENT = 'view_patient',
  ANALYZE_PATIENT = 'analyze_patient',
  ADD_TEST_RESULT = 'add_test_result',
  SAVE_EVALUATION = 'save_evaluation',
  AI_REQUEST = 'ai_request',
  ERROR = 'error',
  FEATURE_USAGE = 'feature_usage'
}

// Interfaz para eventos de analíticas
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: Date;
  userId?: number;
  properties?: Record<string, unknown>;
}

// Caché para eventos (guardar temporalmente si no hay conexión)
const eventsCache = new MemoryCache<AnalyticsEvent[]>(24 * 60 * 60 * 1000); // 24 horas

// URL para envío de analíticas
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:3001/api/analytics';

// Cola de eventos pendientes de envío
let pendingEvents: AnalyticsEvent[] = [];

// Intervalo de envío de eventos en milisegundos (5 minutos)
const FLUSH_INTERVAL = 5 * 60 * 1000;

// Identificador del intervalo de envío
let flushIntervalId: number | null = null;

/**
 * Inicializa el servicio de analíticas
 */
export function initializeAnalytics(): void {
  // Restaurar eventos pendientes desde la caché
  const cachedEvents = eventsCache.get('pending_events');
  if (cachedEvents) {
    pendingEvents = cachedEvents;
  }
  
  // Configurar intervalo para envío automático
  if (!flushIntervalId) {
    flushIntervalId = window.setInterval(flushEvents, FLUSH_INTERVAL);
  }
  
  // Configurar evento para guardar antes de cerrar la página
  window.addEventListener('beforeunload', () => {
    eventsCache.set('pending_events', pendingEvents);
  });
}

/**
 * Detiene el servicio de analíticas
 */
export function stopAnalytics(): void {
  if (flushIntervalId) {
    clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
  
  // Guardar eventos pendientes
  eventsCache.set('pending_events', pendingEvents);
}

/**
 * Registra un evento de analíticas
 * @param type Tipo de evento
 * @param properties Propiedades adicionales
 */
export function trackEvent(type: AnalyticsEventType, properties?: Record<string, unknown>): void {
  // Obtener usuario actual
  const auth = useAuthService();
  const currentUser = auth.getCurrentUser();
  
  const event: AnalyticsEvent = {
    type,
    timestamp: new Date(),
    userId: currentUser?.id,
    properties
  };
  
  // Añadir a la cola de eventos pendientes
  pendingEvents.push(event);
  
  // Si hay demasiados eventos, enviar inmediatamente
  if (pendingEvents.length >= 50) {
    flushEvents();
  }
}

/**
 * Envía eventos pendientes al servidor
 */
export async function flushEvents(): Promise<boolean> {
  if (pendingEvents.length === 0) {
    return true;
  }
  
  // Copia de eventos a enviar
  const eventsToSend = [...pendingEvents];
  
  try {
    // Enviar eventos al servidor
    const response = await fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: eventsToSend }),
    });
    
    if (response.ok) {
      // Eliminar eventos enviados de la cola
      pendingEvents = pendingEvents.filter(
        event => !eventsToSend.includes(event)
      );
      
      // Actualizar caché
      eventsCache.set('pending_events', pendingEvents);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error al enviar eventos de analíticas:', error);
    return false;
  }
}

/**
 * Registra un error para analíticas
 * @param errorMessage Mensaje de error
 * @param errorCode Código de error
 * @param context Contexto adicional
 */
export function trackError(
  errorMessage: string,
  errorCode?: string,
  context?: Record<string, unknown>
): void {
  trackEvent(AnalyticsEventType.ERROR, {
    message: errorMessage,
    code: errorCode,
    ...context
  });
}

/**
 * Registra el uso de una característica
 * @param featureName Nombre de la característica
 * @param properties Propiedades adicionales
 */
export function trackFeatureUsage(
  featureName: string, 
  properties?: Record<string, unknown>
): void {
  trackEvent(AnalyticsEventType.FEATURE_USAGE, {
    feature: featureName,
    ...properties
  });
}

/**
 * Hook para usar el servicio de analíticas
 */
export function useAnalytics() {
  return {
    trackEvent,
    trackError,
    trackFeatureUsage,
    flushEvents
  };
} 