import { useCallback } from 'react';
import { ErrorSource } from '../context/ErrorContext';
import { useError } from './useError';

// Props for the useErrorHandling hook
interface UseErrorHandlingProps {
  source?: ErrorSource;
  showNotification?: boolean;
  autoLog?: boolean;
}

/**
 * Custom hook para manejo de errores (mantiene compatibilidad con implementación anterior)
 * Esta versión utiliza el sistema centralizado de errores y redirige al hook useError
 * Se mantiene para compatibilidad con componentes existentes
 * 
 * @deprecated Use useError instead
 */
export const useErrorHandling = ({
  source = ErrorSource.UNKNOWN,
  showNotification = true,
  autoLog = true,
}: UseErrorHandlingProps = {}) => {
  const { 
    captureError, 
    processError, 
    markErrorAsHandled 
  } = useError();

  /**
   * Procesa un error basado en su origen
   */
  const handleError = useCallback((
    error: unknown, 
    contextInfo?: Record<string, unknown>
  ): string => {
    return captureError(error, source, contextInfo, showNotification, autoLog);
  }, [captureError, source, showNotification, autoLog]);

  /**
   * Ejecuta una función y maneja cualquier error
   */
  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    contextInfo?: Record<string, unknown>
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, contextInfo);
      return null;
    }
  }, [handleError]);

  /**
   * Crea un manejador de errores para una operación específica
   */
  const createErrorHandler = useCallback((
    operationName: string,
    additionalContext?: Record<string, unknown>
  ) => {
    return (error: unknown): string => {
      return handleError(error, {
        operation: operationName,
        ...additionalContext,
      });
    };
  }, [handleError]);

  return {
    handleError,
    executeWithErrorHandling,
    createErrorHandler,
    markErrorAsHandled,
    // Añadir processError para mantener retrocompatibilidad
    processError: (error: unknown, contextInfo?: Record<string, unknown>) => 
      processError(error, source, contextInfo)
  };
};

/**
 * Create an API error handling hook
 * @deprecated Use useError instead
 */
export const useApiErrorHandling = (
  options: Omit<UseErrorHandlingProps, 'source'> = {}
) => {
  return useErrorHandling({
    ...options,
    source: ErrorSource.API,
  });
};

/**
 * Create an AI error handling hook
 * @deprecated Use useError instead
 */
export const useAIErrorHandling = (
  options: Omit<UseErrorHandlingProps, 'source'> = {}
) => {
  return useErrorHandling({
    ...options,
    source: ErrorSource.AI,
  });
};

/**
 * Create a UI error handling hook
 * @deprecated Use useError instead
 */
export const useUIErrorHandling = (
  options: Omit<UseErrorHandlingProps, 'source'> = {}
) => {
  return useErrorHandling({
    ...options,
    source: ErrorSource.UI,
  });
}; 