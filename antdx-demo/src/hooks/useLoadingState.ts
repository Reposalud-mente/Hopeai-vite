import { useState, useCallback, useMemo } from 'react';
import notificationService from '../utils/notificationService';

type LoadingStateType = 'idle' | 'loading' | 'success' | 'error';
type Operation = 'create' | 'update' | 'delete' | 'fetch' | 'submit' | 'process';
type EntityType = 'patient' | 'evaluation' | 'analysis' | 'test' | 'recommendation' | 'data';

interface UseLoadingStateOptions {
  operation?: Operation;
  entity?: EntityType;
  showMessage?: boolean;
  messageSuccess?: string;
  messageError?: string;
  messageLoading?: string;
  showNotification?: boolean;
}

/**
 * Hook para gestionar estados de carga con feedback visual consistente
 */
const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const {
    operation = 'fetch',
    entity = 'data',
    showMessage = true,
    messageSuccess,
    messageError,
    messageLoading,
    showNotification = false,
  } = options;

  const [state, setState] = useState<LoadingStateType>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Mensajes predeterminados basados en operación y entidad
  const getDefaultMessages = useCallback(() => {
    const entityDisplay = entity === 'data' ? 'datos' : 
                         entity === 'patient' ? 'paciente' : 
                         entity === 'evaluation' ? 'evaluación' :
                         entity === 'analysis' ? 'análisis' :
                         entity === 'test' ? 'prueba' :
                         entity === 'recommendation' ? 'recomendación' : 'datos';

    const operationDisplay = operation === 'create' ? 'Creando' :
                            operation === 'update' ? 'Actualizando' :
                            operation === 'delete' ? 'Eliminando' :
                            operation === 'fetch' ? 'Cargando' :
                            operation === 'submit' ? 'Enviando' :
                            operation === 'process' ? 'Procesando' : 'Cargando';

    const operationDoneDisplay = operation === 'create' ? 'creado' :
                                operation === 'update' ? 'actualizado' :
                                operation === 'delete' ? 'eliminado' :
                                operation === 'fetch' ? 'cargado' :
                                operation === 'submit' ? 'enviado' :
                                operation === 'process' ? 'procesado' : 'completado';

    return {
      loading: messageLoading || `${operationDisplay} ${entityDisplay}...`,
      success: messageSuccess || `${entityDisplay} ${operationDoneDisplay} con éxito`,
      error: messageError || `Error al ${operation === 'create' ? 'crear' : 
                              operation === 'update' ? 'actualizar' :
                              operation === 'delete' ? 'eliminar' :
                              operation === 'fetch' ? 'cargar' :
                              operation === 'submit' ? 'enviar' :
                              operation === 'process' ? 'procesar' : 'completar'} ${entityDisplay}`
    };
  }, [entity, messageError, messageLoading, messageSuccess, operation]);

  const messages = useMemo(() => getDefaultMessages(), [getDefaultMessages]);
  const messageKey = useMemo(() => `${operation}-${entity}`, [operation, entity]);

  // Iniciar operación asíncrona
  const startLoading = useCallback(() => {
    setState('loading');
    setError(null);
    if (showMessage) {
      notificationService.loadingToast(messages.loading, messageKey);
    }
  }, [messages, messageKey, showMessage]);

  // Finalizar con éxito
  const setSuccess = useCallback(() => {
    setState('success');
    if (showMessage) {
      notificationService.updateToast('success', messages.success, messageKey, 2);
    }
    if (showNotification) {
      notificationService.success('Operación exitosa', messages.success);
    }
  }, [messages, messageKey, showMessage, showNotification]);

  // Finalizar con error
  const setFailed = useCallback((err: Error) => {
    setState('error');
    setError(err);
    if (showMessage) {
      notificationService.updateToast('error', messages.error, messageKey, 3);
    }
    if (showNotification) {
      notificationService.error('Error', err.message || messages.error);
    }
  }, [messages, messageKey, showMessage, showNotification]);

  // Ejecutar función asíncrona con manejo de estado
  const runWithLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      // Aplazamos la ejecución para permitir que la UI se actualice antes de iniciar operaciones pesadas
      await new Promise(resolve => setTimeout(resolve, 0));
      const result = await asyncFn();
      setSuccess();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setFailed(error);
      throw error;
    }
  }, [setFailed, setSuccess, startLoading]);

  // Resetear estado
  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return {
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    error,
    state,
    startLoading,
    setSuccess,
    setFailed,
    runWithLoading,
    reset
  };
};

export default useLoadingState; 