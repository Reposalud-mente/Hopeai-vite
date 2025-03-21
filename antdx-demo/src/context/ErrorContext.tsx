import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { BaseError } from '../utils/errorHandler';

// Mantener las enums para compatibilidad con el código existente
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorSource {
  UI = 'ui',
  API = 'api',
  AI = 'ai',
  UNKNOWN = 'unknown',
}

// Estructura de error simplificada
export interface ErrorData {
  id: string;
  message: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp: Date;
  stack?: string;
  context?: Record<string, unknown>;
  handled: boolean;
  originalError?: unknown;
}

// Interfaz de contexto simplificada
interface ErrorContextType {
  errors: ErrorData[];
  lastError: ErrorData | null;
  addError: (error: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>) => string;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  markErrorAsHandled: (id: string) => void;
  // Mantener estas funciones por compatibilidad
  getErrorsBySource: (source: ErrorSource) => ErrorData[];
  getErrorsBySeverity: (severity: ErrorSeverity) => ErrorData[];
  hasUnhandledErrors: () => boolean;
}

// Crear contexto con valores por defecto
const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  lastError: null,
  addError: () => '',
  clearError: () => {},
  clearAllErrors: () => {},
  markErrorAsHandled: () => {},
  getErrorsBySource: () => [],
  getErrorsBySeverity: () => [],
  hasUnhandledErrors: () => false
});

// Props del proveedor de errores simplificadas
interface ErrorProviderProps {
  children: ReactNode;
  maxErrorCount?: number;
  logToConsole?: boolean;
}

// Provedor simplificado
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  maxErrorCount = 20, // Reducido de 50 a 20
  logToConsole = true
}) => {
  const [errors, setErrors] = useState<ErrorData[]>([]);

  // Generar ID único para errores
  const generateErrorId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  // Añadir un nuevo error
  const addError = useCallback((
    errorData: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>
  ) => {
    const newError: ErrorData = {
      ...errorData,
      id: generateErrorId(),
      timestamp: new Date(),
      handled: false,
    };

    // Log en consola para debugging
    if (logToConsole) {
      console.error('Error:', newError.message, newError);
    }

    setErrors(prevErrors => {
      // Añadir nuevo error y limitar el total
      const updatedErrors = [newError, ...prevErrors].slice(0, maxErrorCount);
      return updatedErrors;
    });

    return newError.id;
  }, [maxErrorCount, logToConsole]);

  // Eliminar un error específico
  const clearError = useCallback((id: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== id));
  }, []);

  // Eliminar todos los errores
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Marcar un error como gestionado
  const markErrorAsHandled = useCallback((id: string) => {
    setErrors(prevErrors => 
      prevErrors.map(error => 
        error.id === id ? { ...error, handled: true } : error
      )
    );
  }, []);
  
  // Filtrar errores por origen
  const getErrorsBySource = useCallback((source: ErrorSource) => {
    return errors.filter(error => error.source === source);
  }, [errors]);
  
  // Filtrar errores por severidad
  const getErrorsBySeverity = useCallback((severity: ErrorSeverity) => {
    return errors.filter(error => error.severity === severity);
  }, [errors]);
  
  // Comprobar si hay errores no gestionados
  const hasUnhandledErrors = useCallback(() => {
    return errors.some(error => !error.handled);
  }, [errors]);

  // Último error para fácil acceso
  const lastError = errors.length > 0 ? errors[0] : null;

  return (
    <ErrorContext.Provider
      value={{
        errors,
        lastError,
        addError,
        clearError,
        clearAllErrors,
        markErrorAsHandled,
        getErrorsBySource,
        getErrorsBySeverity,
        hasUnhandledErrors
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

// Hook personalizado para usar el contexto de errores
export const useError = () => {
  const context = useContext(ErrorContext);
  
  // Envolver withErrorHandling para simplificar su uso
  const withErrorHandling = async <T,>(
    fn: () => Promise<T>,
    errorMessage: string = 'Se ha producido un error',
    source: ErrorSource = ErrorSource.UNKNOWN,
    contextData: Record<string, unknown> = {}
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      const errorData = createErrorFromException(error, source, {
        ...contextData,
        handledBy: 'withErrorHandling',
        errorMessage
      });
      
      errorData.message = errorMessage || errorData.message;
      
      context.addError(errorData);
      return null;
    }
  };
  
  return {
    ...context,
    withErrorHandling
  };
};

// Utilidad para crear error desde diferentes fuentes (simplificada)
export const createErrorFromException = (
  error: unknown,
  source: ErrorSource = ErrorSource.UNKNOWN,
  context?: Record<string, unknown>
): Omit<ErrorData, 'id' | 'timestamp' | 'handled'> => {
  // Si ya es un BaseError, usar sus datos
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
  
  // Si es un Error estándar
  if (error instanceof Error) {
    return {
      message: error.message || 'Se ha producido un error',
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
}; 