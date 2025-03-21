import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { BaseError } from '../utils/errorHandler';

// Define error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Define error source types
export enum ErrorSource {
  UI = 'ui',
  API = 'api',
  AI = 'ai',
  UNKNOWN = 'unknown',
}

// Error interface
export interface ErrorData {
  id: string;
  message: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp: Date;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
  handled: boolean;
  originalError?: unknown;
}

// Error context interface
interface ErrorContextType {
  errors: ErrorData[];
  lastError: ErrorData | null;
  addError: (error: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>) => string;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  markErrorAsHandled: (id: string) => void;
  getErrorsBySource: (source: ErrorSource) => ErrorData[];
  getErrorsBySeverity: (severity: ErrorSeverity) => ErrorData[];
  hasUnhandledErrors: () => boolean;
}

// Create context with default values
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

// Error provider props
interface ErrorProviderProps {
  children: ReactNode;
  maxErrorCount?: number;
  logToConsole?: boolean;
}

// Create provider component
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  maxErrorCount = 50,
  logToConsole = true
}) => {
  const [errors, setErrors] = useState<ErrorData[]>([]);

  // Generate a unique error ID
  const generateErrorId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Add a new error
  const addError = useCallback((
    errorData: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>
  ) => {
    const newError: ErrorData = {
      ...errorData,
      id: generateErrorId(),
      timestamp: new Date(),
      handled: false,
    };

    // Log to console for development debugging
    if (logToConsole) {
      console.error('Error logged:', newError);
    }

    setErrors(prevErrors => {
      // Add new error and limit the total number
      const updatedErrors = [newError, ...prevErrors].slice(0, maxErrorCount);
      return updatedErrors;
    });

    return newError.id;
  }, [maxErrorCount, logToConsole]);

  // Clear a specific error
  const clearError = useCallback((id: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== id));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Mark an error as handled
  const markErrorAsHandled = useCallback((id: string) => {
    setErrors(prevErrors => 
      prevErrors.map(error => 
        error.id === id ? { ...error, handled: true } : error
      )
    );
  }, []);
  
  // Get errors filtered by source
  const getErrorsBySource = useCallback((source: ErrorSource) => {
    return errors.filter(error => error.source === source);
  }, [errors]);
  
  // Get errors filtered by severity
  const getErrorsBySeverity = useCallback((severity: ErrorSeverity) => {
    return errors.filter(error => error.severity === severity);
  }, [errors]);
  
  // Check if there are any unhandled errors
  const hasUnhandledErrors = useCallback(() => {
    return errors.some(error => !error.handled);
  }, [errors]);

  // Get the most recent error
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

// Custom hook for using the error context
export const useError = () => useContext(ErrorContext);

// Utility function to create error from different sources
export const createErrorFromException = (
  error: unknown,
  source: ErrorSource = ErrorSource.UNKNOWN,
  context?: Record<string, unknown>
): Omit<ErrorData, 'id' | 'timestamp' | 'handled'> => {
  // If it's already a BaseError, use its data
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
  
  // If it's a standard Error
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
  
  // For any other type of error
  return {
    message: error instanceof Object ? JSON.stringify(error) : String(error),
    severity: ErrorSeverity.ERROR,
    source,
    context,
    originalError: error
  };
}; 