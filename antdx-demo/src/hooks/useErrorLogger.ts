import { useCallback } from 'react';
import { useError, ErrorData } from '../context/ErrorContext';

/**
 * Interface for the error logger configuration
 */
interface ErrorLoggerConfig {
  // Send to server - can be enabled when a logging endpoint is available
  sendToServer?: boolean;
  // Maximum number of errors to batch before sending
  batchSize?: number;
  // Development mode detailed logging
  devDetailedLogging?: boolean;
  // Custom metadata to include with all logs
  metadata?: Record<string, any>;
}

/**
 * Hook for advanced error logging functionality
 */
export const useErrorLogger = ({
  sendToServer = false,
  batchSize = 10,
  devDetailedLogging = true,
  metadata = {},
}: ErrorLoggerConfig = {}) => {
  const { errors } = useError();

  /**
   * Format error for logging
   */
  const formatError = useCallback((error: ErrorData) => {
    return {
      id: error.id,
      message: error.message,
      severity: error.severity,
      source: error.source,
      timestamp: error.timestamp,
      context: error.context,
      stackTrace: error.stack,
      componentStack: error.componentStack,
      metadata,
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent,
    };
  }, [metadata]);

  /**
   * Send error logs to server
   * This is a placeholder that would connect to a real logging endpoint
   */
  const sendErrorsToServer = useCallback(async (errorBatch: ErrorData[]) => {
    if (!sendToServer || errorBatch.length === 0) {
      return;
    }

    try {
      const formattedErrors = errorBatch.map(formatError);
      
      console.log('Would send these errors to server:', formattedErrors);
      
      // This would be implemented when a logging endpoint is available
      // await fetch('/api/error-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ errors: formattedErrors }),
      // });
    } catch (e) {
      // Don't use the error context here to avoid infinite loops
      console.error('Failed to send error logs to server:', e);
    }
  }, [sendToServer, formatError]);

  /**
   * Get unhandled errors
   */
  const getUnhandledErrors = useCallback(() => {
    return errors.filter(error => !error.handled);
  }, [errors]);

  /**
   * Get errors to report (based on batch size)
   */
  const getErrorsToReport = useCallback(() => {
    const unhandledErrors = getUnhandledErrors();
    return unhandledErrors.slice(0, batchSize);
  }, [getUnhandledErrors, batchSize]);

  /**
   * Manually trigger reporting of current errors
   */
  const reportCurrentErrors = useCallback(async () => {
    const errorsToReport = getErrorsToReport();
    await sendErrorsToServer(errorsToReport);
    return errorsToReport.length;
  }, [getErrorsToReport, sendErrorsToServer]);

  /**
   * Log error details to console (development helper)
   */
  const logErrorToConsole = useCallback((error: ErrorData) => {
    if (!devDetailedLogging) {
      return;
    }
    
    const { severity, source, message, context, stack, componentStack } = error;
    
    console.group(`[${severity.toUpperCase()}] [${source}] ${message}`);
    
    if (context) {
      console.log('Context:', context);
    }
    
    if (stack) {
      console.log('Stack trace:', stack);
    }
    
    if (componentStack) {
      console.log('Component stack:', componentStack);
    }
    
    console.groupEnd();
  }, [devDetailedLogging]);

  /**
   * Log all current unhandled errors
   */
  const logAllErrors = useCallback(() => {
    if (!devDetailedLogging) {
      return;
    }
    
    const unhandledErrors = getUnhandledErrors();
    
    console.group(`Unhandled Errors (${unhandledErrors.length})`);
    unhandledErrors.forEach(error => logErrorToConsole(error));
    console.groupEnd();
    
    return unhandledErrors.length;
  }, [devDetailedLogging, getUnhandledErrors, logErrorToConsole]);

  return {
    reportCurrentErrors,
    logAllErrors,
    logErrorToConsole,
    errorCount: errors.length,
    unhandledErrorCount: getUnhandledErrors().length,
  };
};

export default useErrorLogger; 