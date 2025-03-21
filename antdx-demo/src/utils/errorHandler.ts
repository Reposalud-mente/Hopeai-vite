import { AxiosError } from 'axios';
import { notification } from 'antd';
import { 
  ErrorSeverity, 
  ErrorSource, 
  createErrorFromException,
  ErrorData
} from '../context/ErrorContext';

// Interface for API error responses
export interface ApiErrorResponse {
  error: string;
  message: string;
  status: number;
  path?: string;
  timestamp?: string;
  details?: Record<string, unknown>;
}

// Interface for AI error responses
export interface AIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  }
}

/**
 * Jerarquía de clases de error para HopeAI
 */

// Error base para todas las excepciones de la aplicación
export class BaseError extends Error {
  public severity: ErrorSeverity;
  public source: ErrorSource;
  public context?: Record<string, unknown>;

  constructor(
    message: string, 
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    source: ErrorSource = ErrorSource.UNKNOWN,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.severity = severity;
    this.source = source;
    this.context = context;

    // Mantener la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Convertir a ErrorData para el sistema de manejo de errores
  public toErrorData(): Omit<ErrorData, 'id' | 'timestamp' | 'handled'> {
    return {
      message: this.message,
      severity: this.severity,
      source: this.source,
      stack: this.stack,
      context: this.context
    };
  }
}

// Error específico para errores de API/servidor
export class APIError extends BaseError {
  public status?: number;
  
  constructor(
    message: string,
    status?: number,
    severity?: ErrorSeverity,
    context?: Record<string, unknown>
  ) {
    // Determinar la severidad basada en el código de estado si no se proporciona
    const errorSeverity = severity || (status ? getSeverityFromStatus(status) : ErrorSeverity.ERROR);
    
    super(message, errorSeverity, ErrorSource.API, {
      ...context,
      status
    });
    
    this.status = status;
  }

  // Crear a partir de una respuesta de error
  public static fromResponse(response: ApiErrorResponse): APIError {
    return new APIError(
      response.message || 'Error del servidor',
      response.status,
      getSeverityFromStatus(response.status),
      {
        path: response.path,
        timestamp: response.timestamp,
        details: response.details
      }
    );
  }

  // Crear a partir de un error de Axios
  public static fromAxiosError(error: AxiosError): APIError {
    const status = error.response?.status;
    const message = status ? getMessageFromStatus(status) : error.message;
    
    return new APIError(
      message,
      status,
      status ? getSeverityFromStatus(status) : ErrorSeverity.ERROR,
      {
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method
      }
    );
  }
}

// Error específico para errores de IA
export class AIError extends BaseError {
  public errorType?: string;
  public errorCode?: string;
  
  constructor(
    message: string,
    errorType?: string,
    errorCode?: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, unknown>
  ) {
    super(message, severity, ErrorSource.AI, {
      ...context,
      errorType,
      errorCode
    });
    
    this.errorType = errorType;
    this.errorCode = errorCode;
  }

  // Crear a partir de una respuesta de error de IA
  public static fromResponse(response: AIErrorResponse): AIError {
    return new AIError(
      response.error.message || 'Error en la IA',
      response.error.type,
      response.error.code,
      ErrorSeverity.ERROR,
      {
        param: response.error.param
      }
    );
  }
}

// Error específico para errores de UI
export class UIError extends BaseError {
  public component?: string;
  
  constructor(
    message: string,
    component?: string,
    severity: ErrorSeverity = ErrorSeverity.WARNING,
    context?: Record<string, unknown>
  ) {
    super(message, severity, ErrorSource.UI, {
      ...context,
      component
    });
    
    this.component = component;
  }
}

// Type guard for API error responses
export function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'error' in obj &&
    'message' in obj &&
    'status' in obj
  );
}

// Type guard for AI error responses
export function isAIErrorResponse(obj: unknown): obj is AIErrorResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'error' in obj &&
    typeof obj.error === 'object' &&
    'message' in obj.error &&
    'type' in obj.error
  );
}

// Handle Axios errors
export function handleAxiosError(
  error: unknown,
  contextInfo?: Record<string, unknown>
): Omit<ErrorData, 'id' | 'timestamp' | 'handled'> {
  // Si es un AxiosError, usar la nueva clase APIError
  if (error instanceof AxiosError) {
    try {
      // Intentar extraer datos de la respuesta
      const responseData = error.response?.data;
      
      // Verificar si es una respuesta de API formateada
      if (isApiErrorResponse(responseData)) {
        const apiError = APIError.fromResponse(responseData);
        return {
          ...apiError.toErrorData(),
          context: {
            ...apiError.context,
            ...contextInfo
          }
        };
      } 
      // Verificar si es una respuesta de AI formateada
      else if (isAIErrorResponse(responseData)) {
        const aiError = AIError.fromResponse(responseData);
        return {
          ...aiError.toErrorData(),
          context: {
            ...aiError.context,
            ...contextInfo
          }
        };
      }
      
      // Usar el error de Axios genérico
      const apiError = APIError.fromAxiosError(error);
      return {
        ...apiError.toErrorData(),
        context: {
          ...apiError.context,
          ...contextInfo
        }
      };
    } catch (conversionError) {
      console.error("Error al convertir error de Axios:", conversionError);
    }
  }
  
  // Default error data si no es un AxiosError o hay algún problema
  return {
    message: error instanceof Error ? error.message : 'Error en la conexión con el servidor',
    severity: ErrorSeverity.ERROR,
    source: ErrorSource.API,
    stack: error instanceof Error ? error.stack : undefined,
    context: contextInfo,
  };
}

// Get error message from HTTP status code
function getMessageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Solicitud incorrecta';
    case 401:
      return 'No autorizado. Inicie sesión nuevamente';
    case 403:
      return 'Acceso prohibido';
    case 404:
      return 'Recurso no encontrado';
    case 409:
      return 'Conflicto con los datos actuales';
    case 422:
      return 'Datos de entrada no válidos';
    case 429:
      return 'Demasiadas solicitudes. Intente nuevamente más tarde';
    case 500:
      return 'Error interno del servidor';
    case 502:
      return 'Error de puerta de enlace';
    case 503:
      return 'Servicio no disponible temporalmente';
    default:
      return `Error en la solicitud (${status})`;
  }
}

// Get severity from HTTP status code
function getSeverityFromStatus(status: number): ErrorSeverity {
  if (status >= 500) {
    return ErrorSeverity.CRITICAL;
  } else if (status >= 400) {
    return ErrorSeverity.ERROR;
  } else {
    return ErrorSeverity.WARNING;
  }
}

// Handle AI API errors
export function handleAIError(
  error: unknown,
  contextInfo?: Record<string, unknown>
): Omit<ErrorData, 'id' | 'timestamp' | 'handled'> {
  // Si es un error de AI, usarlo directamente
  if (error instanceof AIError) {
    return {
      ...error.toErrorData(),
      context: {
        ...error.context,
        ...contextInfo
      }
    };
  }
  
  // Si es un error genérico
  if (error instanceof Error) {
    const aiError = new AIError(
      error.message,
      'unknown',
      undefined,
      ErrorSeverity.ERROR,
      contextInfo
    );
    
    return aiError.toErrorData();
  }

  // Handle non-Error objects
  return {
    message: 'Error en el procesamiento de la IA',
    severity: ErrorSeverity.ERROR,
    source: ErrorSource.AI,
    context: {
      ...contextInfo,
      rawError: typeof error === 'object' ? JSON.stringify(error) : String(error),
    },
  };
}

// Global error logger
export function logErrorToConsole(error: ErrorData): void {
  const { severity, message, source, context } = error;
  
  // Output formatted console message
  console.group(`[${severity.toUpperCase()}] [${source}] ${message}`);
  console.error(error.stack || 'No stack trace');
  
  if (context) {
    console.log('Context:', context);
  }
  
  if (error.componentStack) {
    console.log('Component stack:', error.componentStack);
  }
  
  console.groupEnd();
}

// Function to handle any type of error and show notification
export function handleAndNotifyError(
  error: unknown, 
  source: ErrorSource = ErrorSource.UNKNOWN,
  contextInfo?: Record<string, unknown>
): ErrorData {
  let errorData: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>;
  
  // Manejar los errores según su tipo
  if (error instanceof BaseError) {
    errorData = error.toErrorData();
  }
  // Determine the appropriate error handler for otros errores
  else if (source === ErrorSource.API) {
    errorData = handleAxiosError(error, contextInfo);
  } else if (source === ErrorSource.AI) {
    errorData = handleAIError(error, contextInfo);
  } else {
    errorData = createErrorFromException(error, source, contextInfo);
  }
  
  // Create a fake ID and timestamp for the notification
  // The real error will be created using the ErrorContext
  const fakeErrorData: ErrorData = {
    ...errorData,
    id: Date.now().toString(),
    timestamp: new Date(),
    handled: false,
  };
  
  // Show notification
  notification.error({
    message: getSeverityLabel(errorData.severity),
    description: errorData.message,
    duration: errorData.severity === ErrorSeverity.CRITICAL ? 0 : 4.5,
  });
  
  return fakeErrorData;
}

// Helper function to get severity label
function getSeverityLabel(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'Información';
    case ErrorSeverity.WARNING:
      return 'Advertencia';
    case ErrorSeverity.ERROR:
      return 'Error';
    case ErrorSeverity.CRITICAL:
      return 'Error Crítico';
    default:
      return 'Error';
  }
}

// Una función unificada para manejar errores
export function createError(
  message: string,
  options?: {
    source?: ErrorSource;
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
  }
): BaseError {
  const { source = ErrorSource.UNKNOWN, severity = ErrorSeverity.ERROR, context } = options || {};
  
  switch (source) {
    case ErrorSource.API:
      return new APIError(message, undefined, severity, context);
    case ErrorSource.AI:
      return new AIError(message, 'custom', undefined, severity, context);
    case ErrorSource.UI:
      return new UIError(message, undefined, severity, context);
    default:
      return new BaseError(message, severity, source, context);
  }
} 