import { useState, useCallback, useMemo, useRef } from 'react';
import notificationService from '../utils/notificationService';

type LoadingStateType = 'idle' | 'loading' | 'success' | 'error';
type Operation = 'create' | 'update' | 'delete' | 'fetch' | 'submit' | 'process' | 'analyze';
type EntityType = 'patient' | 'evaluation' | 'analysis' | 'test' | 'recommendation' | 'data' | 'ai';
type ProgressStepStatus = 'pending' | 'active' | 'completed' | 'error';
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'default';

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  percentage: number;
  status?: ProgressStepStatus;
}

interface UseLoadingStateOptions {
  operation?: Operation;
  entity?: EntityType;
  showMessage?: boolean;
  messageSuccess?: string;
  messageError?: string;
  messageLoading?: string;
  showNotification?: boolean;
  isProgressiveOperation?: boolean;
  progressSteps?: ProgressStep[];
}

/**
 * Hook para gestionar estados de carga con feedback visual consistente
 * Soporta operaciones progresivas para mostrar avance detallado
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
    isProgressiveOperation = false,
    progressSteps = [],
  } = options;

  const [state, setState] = useState<LoadingStateType>('idle');
  const [error, setError] = useState<Error | null>(null);
  
  const [progress, setProgress] = useState<number>(0);
  const [steps, setSteps] = useState<ProgressStep[]>(progressSteps);
  const [currentStepId, setCurrentStepId] = useState<string | null>(
    progressSteps.length > 0 ? progressSteps[0].id : null
  );
  
  const startTimeRef = useRef<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const getDefaultMessages = useCallback(() => {
    const entityDisplay = entity === 'data' ? 'datos' : 
                         entity === 'patient' ? 'paciente' : 
                         entity === 'evaluation' ? 'evaluación' :
                         entity === 'analysis' ? 'análisis' :
                         entity === 'test' ? 'prueba' :
                         entity === 'ai' ? 'inteligencia artificial' :
                         entity === 'recommendation' ? 'recomendación' : 'datos';

    const operationDisplay = operation === 'create' ? 'Creando' :
                            operation === 'update' ? 'Actualizando' :
                            operation === 'delete' ? 'Eliminando' :
                            operation === 'fetch' ? 'Cargando' :
                            operation === 'submit' ? 'Enviando' :
                            operation === 'analyze' ? 'Analizando' :
                            operation === 'process' ? 'Procesando' : 'Cargando';

    const operationDoneDisplay = operation === 'create' ? 'creado' :
                                operation === 'update' ? 'actualizado' :
                                operation === 'delete' ? 'eliminado' :
                                operation === 'fetch' ? 'cargado' :
                                operation === 'submit' ? 'enviado' :
                                operation === 'analyze' ? 'analizado' :
                                operation === 'process' ? 'procesado' : 'completado';

    return {
      loading: messageLoading || `${operationDisplay} ${entityDisplay}...`,
      success: messageSuccess || `${entityDisplay} ${operationDoneDisplay} con éxito`,
      error: messageError || `Error al ${operation === 'create' ? 'crear' : 
                              operation === 'update' ? 'actualizar' :
                              operation === 'delete' ? 'eliminar' :
                              operation === 'fetch' ? 'cargar' :
                              operation === 'submit' ? 'enviar' :
                              operation === 'analyze' ? 'analizar' :
                              operation === 'process' ? 'procesar' : 'completar'} ${entityDisplay}`
    };
  }, [entity, messageError, messageLoading, messageSuccess, operation]);

  const messages = useMemo(() => getDefaultMessages(), [getDefaultMessages]);
  const messageKey = useMemo(() => `${operation}-${entity}`, [operation, entity]);

  const startLoading = useCallback(() => {
    setState('loading');
    setError(null);
    setProgress(0);
    startTimeRef.current = Date.now();
    
    if (isProgressiveOperation && steps.length > 0) {
      setSteps(currentSteps => 
        currentSteps.map(step => ({
          ...step,
          status: step.id === steps[0].id ? 'active' as ProgressStepStatus : 'pending' as ProgressStepStatus,
          percentage: 0
        }))
      );
      setCurrentStepId(steps[0].id);
    }
    
    if (showMessage) {
      const loadingMessage = isProgressiveOperation 
        ? `${messages.loading} (0%)`
        : messages.loading;
      notificationService.loadingToast(loadingMessage, messageKey);
    }
  }, [messages, messageKey, showMessage, isProgressiveOperation, steps]);

  const setSuccess = useCallback(() => {
    setState('success');
    setProgress(100);
    
    if (isProgressiveOperation) {
      setSteps(currentSteps => 
        currentSteps.map(step => ({
          ...step,
          status: 'completed' as ProgressStepStatus,
          percentage: 100
        }))
      );
    }
    
    if (showMessage) {
      notificationService.updateToast('success', messages.success, messageKey, 2);
    }
    if (showNotification) {
      notificationService.success('Operación exitosa', messages.success);
    }
  }, [messages, messageKey, showMessage, showNotification, isProgressiveOperation]);

  const setFailed = useCallback((err: Error, failedStepId?: string) => {
    setState('error');
    setError(err);
    
    if (isProgressiveOperation && failedStepId) {
      setSteps(currentSteps => 
        currentSteps.map(step => ({
          ...step,
          status: step.id === failedStepId ? 'error' as ProgressStepStatus : step.status
        }))
      );
    }
    
    if (showMessage) {
      notificationService.updateToast('error', messages.error, messageKey, 3);
    }
    if (showNotification) {
      notificationService.error('Error', err.message || messages.error);
    }
  }, [messages, messageKey, showMessage, showNotification, isProgressiveOperation]);

  const updateProgress = useCallback((newProgress: number, currentStepId?: string, description?: string) => {
    const validProgress = Math.min(100, Math.max(0, newProgress));
    setProgress(validProgress);
    
    if (startTimeRef.current && validProgress > 0 && validProgress < 100) {
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      const estimatedTotal = (elapsedTime * 100) / validProgress;
      const remaining = Math.max(0, estimatedTotal - elapsedTime);
      setEstimatedTimeRemaining(Math.round(remaining));
    }
    
    if (isProgressiveOperation && currentStepId) {
      let foundActiveStep = false;
      
      setSteps(currentSteps => {
        const updatedSteps = currentSteps.map((step, index) => {
          if (step.id === currentStepId) {
            foundActiveStep = true;
            const nextStep = index < currentSteps.length - 1 ? currentSteps[index + 1] : null;
            
            if (validProgress >= 100) {
              if (nextStep) {
                setCurrentStepId(nextStep.id);
              }
              return { 
                ...step, 
                status: 'completed' as ProgressStepStatus, 
                percentage: 100,
                description: description || step.description
              };
            }
            
            return { 
              ...step, 
              status: 'active' as ProgressStepStatus, 
              percentage: validProgress,
              description: description || step.description
            };
          } 
          else if (foundActiveStep) {
            return { ...step, status: 'pending' as ProgressStepStatus, percentage: 0 };
          } 
          else {
            return { ...step, status: 'completed' as ProgressStepStatus, percentage: 100 };
          }
        });
        
        return updatedSteps;
      });
    }
    
    if (showMessage && isProgressiveOperation) {
      const currentStep = steps.find(s => s.id === currentStepId);
      const progressMessage = currentStep
        ? `${messages.loading}: ${currentStep.title} (${validProgress}%)`
        : `${messages.loading} (${validProgress}%)`;
        
      notificationService.updateToast('default' as NotificationType, progressMessage, messageKey, 0);
    }
  }, [steps, isProgressiveOperation, showMessage, messages.loading, messageKey]);

  const runWithLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
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

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setProgress(0);
    setEstimatedTimeRemaining(null);
    startTimeRef.current = null;
    
    if (isProgressiveOperation && progressSteps.length > 0) {
      setSteps(progressSteps);
      setCurrentStepId(progressSteps[0].id);
    }
  }, [isProgressiveOperation, progressSteps]);

  return {
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    error,
    state,
    progress,
    steps,
    currentStepId,
    estimatedTimeRemaining,
    startLoading,
    setSuccess,
    setFailed,
    updateProgress,
    runWithLoading,
    reset
  };
};

export default useLoadingState; 