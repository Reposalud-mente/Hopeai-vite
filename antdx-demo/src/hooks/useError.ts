import { useCallback } from 'react';
import { useError as useErrorContext, ErrorSeverity, ErrorSource, ErrorData } from '../context/ErrorContext';
import { 
  BaseError, 
  APIError, 
  AIError, 
  UIError, 
  createError,
  handleAxiosError,
  handleAIError,
  logErrorToConsole
} from '../utils/errorHandler';
import { showErrorNotification } from '../components/ErrorDisplay';
import type { ErrorProcessor } from '../types/ai-types';

/**
 * Hook unificado para manejo de errores en HopeAI
 * Proporciona funciones para crear, capturar y procesar errores
 */
export const useError = () => {
  const { 
    addError, 
    markErrorAsHandled,
    clearError,
    clearAllErrors,
    getErrorsBySource,
    getErrorsBySeverity,
    hasUnhandledErrors,
    errors,
    lastError
  } = useErrorContext();
  
  /**
   * Procesa un error según su tipo y fuente
   */
  const processError = useCallback((
    error: unknown, 
    source: ErrorSource = ErrorSource.UNKNOWN,
    context?: Record<string, unknown>
  ): Omit<ErrorData, 'id' | 'timestamp' | 'handled'> => {
    // Si ya es un error de nuestra jerarquía, usarlo directamente
    if (error instanceof BaseError) {
      return {
        message: error.message,
        severity: error.severity,
        source: error.source || source,
        stack: error.stack,
        context: { ...error.context, ...context },
        originalError: error
      };
    }
    
    // Determinar el procesador adecuado según la fuente
    if (source === ErrorSource.API) {
      return handleAxiosError(error, context);
    } else if (source === ErrorSource.AI) {
      return handleAIError(error, context);
    } else if (error instanceof Error) {
      return {
        message: error.message,
        severity: ErrorSeverity.ERROR,
        source,
        stack: error.stack,
        context,
        originalError: error
      };
    }
    
    // Para cualquier otro tipo de error
    return {
      message: error instanceof Object ? JSON.stringify(error) : String(error),
      severity: ErrorSeverity.ERROR,
      source,
      context,
      originalError: error
    };
  }, []);
  
  /**
   * Captura y registra un error en el sistema
   * @param error Error a capturar
   * @param source Fuente del error (opcional si es un BaseError)
   * @param context Información contextual adicional
   * @param showNotification Si se debe mostrar una notificación
   * @param autoLog Si se debe registrar automáticamente en consola
   * @returns El ID del error registrado
   */
  const captureError = useCallback((
    error: unknown, 
    source: ErrorSource = ErrorSource.UNKNOWN, 
    context?: Record<string, unknown>,
    showNotification: boolean = true,
    autoLog: boolean = true
  ): string => {
    const errorData = processError(error, source, context);
    
    // Añadir al contexto de errores
    const errorId = addError(errorData);
    
    // Recuperar el error completo con ID y timestamp
    const fullError: ErrorData = {
      ...errorData,
      id: errorId,
      timestamp: new Date(),
      handled: false,
    };
    
    // Registrar en consola si está habilitado
    if (autoLog) {
      logErrorToConsole(fullError);
    }
    
    // Mostrar notificación si está habilitado
    if (showNotification) {
      showErrorNotification(fullError);
    }
    
    return errorId;
  }, [addError, processError]);
  
  /**
   * Crea un nuevo error de API
   */
  const createApiError = useCallback((
    message: string,
    status?: number,
    severity?: ErrorSeverity,
    context?: Record<string, unknown>
  ) => {
    return new APIError(message, status, severity, context);
  }, []);
  
  /**
   * Crea un nuevo error de IA
   */
  const createAiError = useCallback((
    message: string,
    errorType?: string,
    errorCode?: string,
    severity?: ErrorSeverity,
    context?: Record<string, unknown>
  ) => {
    return new AIError(message, errorType, errorCode, severity, context);
  }, []);
  
  /**
   * Crea un nuevo error de UI
   */
  const createUiError = useCallback((
    message: string,
    component?: string,
    severity?: ErrorSeverity,
    context?: Record<string, unknown>
  ) => {
    return new UIError(message, component, severity, context);
  }, []);
  
  /**
   * Crea una función de manejo de errores para pasar a componentes/servicios
   * @param defaultSource Fuente predeterminada para los errores
   * @param defaultContext Contexto predeterminado para los errores
   * @returns Función para procesar errores
   */
  const createErrorProcessor = useCallback((
    defaultSource: ErrorSource = ErrorSource.UNKNOWN,
    defaultContext?: Record<string, unknown>,
    showNotification: boolean = true,
    autoLog: boolean = true
  ): ErrorProcessor => {
    return (error: Error) => {
      captureError(error, defaultSource, defaultContext, showNotification, autoLog);
    };
  }, [captureError]);
  
  /**
   * Ejecuta una función asíncrona con manejo de errores
   * @param asyncFn Función asíncrona a ejecutar
   * @param errorMessage Mensaje de error predeterminado
   * @param source Fuente del error
   * @param context Contexto del error
   * @returns Resultado de la función o undefined si hay error
   */
  const withErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string,
    source: ErrorSource = ErrorSource.UNKNOWN,
    context?: Record<string, unknown>,
    showNotification: boolean = true,
    autoLog: boolean = true
  ): Promise<T | undefined> => {
    try {
      return await asyncFn();
    } catch (error) {
      captureError(
        error instanceof Error 
          ? error 
          : createError(errorMessage || 'Error desconocido', { source, context }),
        source,
        context,
        showNotification,
        autoLog
      );
      return undefined;
    }
  }, [captureError]);
  
  return {
    // Métodos principales
    captureError,
    processError,
    markErrorAsHandled,
    clearError,
    clearAllErrors,
    
    // Creadores de errores específicos
    createApiError,
    createAiError,
    createUiError,
    
    // Utilidades de alto nivel
    createErrorProcessor,
    withErrorHandling,
    
    // Consultores
    getErrorsBySource,
    getErrorsBySeverity,
    hasUnhandledErrors,
    
    // Estado
    errors,
    lastError
  };
};

// Exportar también las funciones heredadas por compatibilidad
export * from '../utils/errorHandler'; 