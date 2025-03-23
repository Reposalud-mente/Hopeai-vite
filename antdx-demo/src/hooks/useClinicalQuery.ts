import { useState, useCallback, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { 
  ClinicalQuery, 
  ClinicalQueryResponse, 
  ClinicalQueryHistoryResponse 
} from '../types/ClinicalQuery';
import { queryCache, generateCacheKey } from '../utils/clinicalQueryCache';
import notificationService from '../utils/notificationService';
import { createClinicalQuery } from '../api/clinicalQueries';

interface UseClinicalQueryOptions {
  patientId: string;
  autoFetch?: boolean;
  limit?: number;
  enableCache?: boolean;
  cacheTtl?: number;
}

/**
 * Hook para gestionar consultas clínicas
 */
export const useClinicalQuery = ({ 
  patientId, 
  autoFetch = true,
  limit = 10,
  enableCache = true,
  cacheTtl = 60
}: UseClinicalQueryOptions) => {
  const [queries, setQueries] = useState<ClinicalQuery[]>([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQueries, setSuggestedQueries] = useState<ClinicalQuery[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  /**
   * Obtener historial de consultas para un paciente
   */
  const fetchQueries = useCallback(async (offset = 0, tag?: string, favorite?: boolean) => {
    if (!patientId) {
      setError('ID de paciente no proporcionado');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());
      
      if (tag) queryParams.append('tag', tag);
      if (favorite) queryParams.append('favorite', 'true');
      
      const response = await axios.get<ClinicalQueryHistoryResponse>(
        `/api/clinical/queries/patient/${patientId}?${queryParams.toString()}`
      );
      
      if (response.data.success && response.data.data) {
        setQueries(response.data.data.queries);
        setTotalQueries(response.data.data.total);
        setRetryCount(0); // Resetear contador si tiene éxito
      } else {
        setError(response.data.error || 'Error al obtener consultas');
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error al obtener consultas clínicas:', err);
      
      // Manejar diferentes tipos de errores
      if (axiosError.response) {
        // El servidor respondió con un código de error
        const status = axiosError.response.status;
        if (status === 404) {
          setError('No se encontraron datos de consultas para este paciente');
        } else if (status >= 500) {
          setError('Error en el servidor. Intente más tarde');
        } else {
          setError(`Error ${status}: ${axiosError.response.statusText || 'Error desconocido'}`);
        }
      } else if (axiosError.request) {
        // No se recibió respuesta
        setError('No se pudo conectar con el servidor. Verifique su conexión');
        
        // Implementar reintentos automáticos si es por error de conexión
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchQueries(offset, tag, favorite);
          }, 2000 * (retryCount + 1)); // Backoff exponencial
        }
      } else {
        setError('Error al comunicarse con el servidor');
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, limit, retryCount]);

  /**
   * Buscar consultas similares en caché
   */
  const findSimilarQueries = useCallback((question: string): ClinicalQuery[] => {
    if (!enableCache) return [];
    return queryCache.findSimilar(question, patientId);
  }, [enableCache, patientId]);

  /**
   * Enviar una nueva consulta clínica
   */
  const submitQuery = useCallback(async (question: string): Promise<ClinicalQuery | undefined> => {
    if (!question.trim()) return undefined;
    
    setSubmitting(true);
    setError(null);
    
    // Primero buscamos en caché si está habilitado
    if (enableCache) {
      const cacheKey = generateCacheKey(question, patientId);
      const cachedQuery = queryCache.get(cacheKey);
      
      if (cachedQuery) {
        // Notificar al usuario que se está utilizando una respuesta en caché
        notificationService.toast('info', 'Usando respuesta en caché', { 
          duration: 2 
        });
        
        // Actualizar estado con la consulta cacheada
        setQueries(prev => {
          // Evitar duplicados en la lista
          if (!prev.some(q => q.id === cachedQuery.id)) {
            return [cachedQuery, ...prev];
          }
          return prev;
        });
        
        setSubmitting(false);
        return cachedQuery;
      }
      
      // Buscar consultas similares
      const similarQueries = queryCache.findSimilar(question, patientId);
      if (similarQueries.length > 0) {
        setSuggestedQueries(similarQueries);
      }
    }
    
    // Mostrar notificación de carga
    const loadingKey = `query-${Date.now()}`;
    notificationService.loadingToast('Procesando consulta clínica...', loadingKey);
    
    try {
      // Usar la función de API en lugar de llamar a axios directamente
      const response = await createClinicalQuery(patientId, question);
      
      if (response.success && response.data) {
        const newQuery = response.data;
        
        // Actualizar la lista de consultas
        setQueries(prev => [newQuery, ...prev]);
        
        // Guardar en caché si está habilitado
        if (enableCache && newQuery) {
          const cacheKey = generateCacheKey(question, patientId);
          queryCache.set(cacheKey, newQuery, { 
            ttl: cacheTtl, 
            patientId 
          });
        }
        
        // Actualizar notificación con éxito
        notificationService.updateToast(
          'success',
          'Consulta procesada correctamente',
          loadingKey,
          3
        );
        
        return newQuery;
      }
      
      // Si hay un error en la respuesta
      if (response.error) {
        setError(response.error);
        notificationService.updateToast(
          'error',
          `Error: ${response.error}`,
          loadingKey,
          4.5
        );
      }
      
      return undefined;
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error al enviar consulta:', err);
      
      // Manejar diferentes tipos de errores
      let errorMsg = 'Error desconocido';
      
      if (axiosError.response) {
        // El servidor respondió con un código de error
        const status = axiosError.response.status;
        errorMsg = `Error ${status}: ${axiosError.response.statusText || 'Error en la respuesta del servidor'}`;
      } else if (axiosError.request) {
        // No se recibió respuesta
        errorMsg = 'No se pudo conectar con el servidor. Verifique su conexión';
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
      
      setError(`Error al enviar consulta: ${errorMsg}`);
      
      notificationService.updateToast(
        'error',
        `Error al procesar consulta: ${errorMsg}`,
        loadingKey,
        4.5
      );
      
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }, [patientId, enableCache, cacheTtl]);

  /**
   * Verificar el estado de procesamiento de una consulta
   */
  const checkQueryStatus = useCallback(async (queryId: number): Promise<ClinicalQuery | undefined> => {
    try {
      const response = await axios.get<ClinicalQueryResponse>(`/api/clinical/queries/${queryId}`);
      
      if (response.data.success && response.data.data) {
        const updatedQuery = response.data.data;
        
        // Actualizar la consulta en la lista
        setQueries(prev => 
          prev.map(q => q.id === queryId ? updatedQuery : q)
        );
        
        // Actualizar en caché si está habilitado
        if (enableCache && updatedQuery) {
          const cacheKey = generateCacheKey(updatedQuery.question, patientId);
          queryCache.set(cacheKey, updatedQuery, { 
            ttl: cacheTtl, 
            patientId 
          });
        }
        
        return updatedQuery;
      }
      return undefined;
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error al verificar estado de consulta:', err);
      
      let errorMsg = 'Error desconocido';
      if (axiosError.response) {
        errorMsg = `Error ${axiosError.response.status}: ${axiosError.response.statusText || 'Error del servidor'}`;
      } else if (axiosError.request) {
        errorMsg = 'No se pudo conectar con el servidor';
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
      
      notificationService.toast('error', `Error: ${errorMsg}`, { duration: 3 });
      return undefined;
    }
  }, [enableCache, cacheTtl, patientId]);

  /**
   * Cambiar estado de favorito
   */
  const toggleFavorite = useCallback(async (queryId: number, isFavorite: boolean): Promise<boolean> => {
    try {
      const response = await axios.patch(`/api/clinical/queries/${queryId}/favorite`, {
        isFavorite
      });
      
      if (response.data.success) {
        // Actualizar la consulta en la lista
        setQueries(prev => prev.map(q => 
          q.id === queryId ? { ...q, isFavorite } : q
        ));
        
        // Actualizar en caché si corresponde
        if (enableCache) {
          queryCache.updateFavoriteStatus(queryId, isFavorite, patientId);
        }
        
        // Mostrar notificación
        notificationService.toast(
          'success',
          isFavorite ? 'Consulta marcada como favorita' : 'Consulta desmarcada como favorita',
          { duration: 2 }
        );
        
        return true;
      }
      return false;
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error al cambiar estado de favorito:', err);
      
      let errorMsg = 'Error desconocido';
      if (axiosError.response) {
        errorMsg = `Error ${axiosError.response.status}: ${axiosError.response.statusText || 'Error del servidor'}`;
      } else if (axiosError.request) {
        errorMsg = 'No se pudo conectar con el servidor';
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
      
      notificationService.toast(
        'error',
        `No se pudo actualizar el estado de favorito: ${errorMsg}`,
        { duration: 3 }
      );
      
      return false;
    }
  }, [enableCache, patientId]);

  /**
   * Reprocesar una consulta existente
   */
  const reprocessQuery = useCallback(async (queryId: number): Promise<ClinicalQuery | undefined> => {
    setLoading(true);
    
    // Mostrar notificación de carga
    const loadingKey = `reprocess-${queryId}`;
    notificationService.loadingToast('Reprocesando consulta...', loadingKey);
    
    try {
      const response = await axios.post<ClinicalQueryResponse>(`/api/clinical/queries/${queryId}/process`);
      
      if (response.data.success && response.data.data) {
        const updatedQuery = response.data.data;
        
        // Actualizar la consulta en la lista
        setQueries(prev => 
          prev.map(q => q.id === queryId ? updatedQuery : q)
        );
        
        // Actualizar en caché si está habilitado
        if (enableCache && updatedQuery) {
          const cacheKey = generateCacheKey(updatedQuery.question, patientId);
          queryCache.set(cacheKey, updatedQuery, { 
            ttl: cacheTtl, 
            patientId 
          });
        }
        
        // Actualizar notificación con éxito
        notificationService.updateToast(
          'success',
          'Consulta reprocesada correctamente',
          loadingKey,
          3
        );
        
        return updatedQuery;
      }
      
      // Si hay un error en la respuesta
      if (response.data.error) {
        notificationService.updateToast(
          'error',
          `Error: ${response.data.error}`,
          loadingKey,
          4.5
        );
      }
      
      return undefined;
    } catch (err) {
      console.error('Error al reprocesar consulta:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al reprocesar consulta: ${errorMsg}`);
      
      notificationService.updateToast(
        'error',
        `Error al reprocesar consulta: ${errorMsg}`,
        loadingKey,
        4.5
      );
      
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [enableCache, cacheTtl, patientId]);

  /**
   * Limpiar caché para el paciente actual
   */
  const clearCache = useCallback(() => {
    if (enableCache) {
      queryCache.clearForPatient(patientId);
      notificationService.toast(
        'success',
        'Caché de consultas limpiado',
        { duration: 2 }
      );
    }
  }, [enableCache, patientId]);

  /**
   * Proporcionar retroalimentación sobre una consulta
   */
  const provideFeedback = useCallback(async (queryId: number, feedback: {
    rating: number;
    comment?: string;
    tags?: string[];
  }): Promise<boolean> => {
    try {
      const response = await axios.post(`/api/clinical/queries/${queryId}/feedback`, feedback);
      
      if (response.data.success) {
        // Actualizar la consulta en la lista
        setQueries(prev => prev.map(q => 
          q.id === queryId 
            ? { 
                ...q, 
                hasFeedback: true, 
                feedbackRating: feedback.rating,
                feedbackComment: feedback.comment,
                feedbackTags: feedback.tags
              } 
            : q
        ));
        
        // Actualizar notificación con éxito
        notificationService.toast(
          'success',
          'Gracias por su retroalimentación',
          { duration: 2 }
        );
        
        return true;
      }
      return false;
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('Error al enviar retroalimentación:', err);
      
      let errorMsg = 'Error desconocido';
      if (axiosError.response) {
        errorMsg = `Error ${axiosError.response.status}: ${axiosError.response.statusText || 'Error del servidor'}`;
      } else if (axiosError.request) {
        errorMsg = 'No se pudo conectar con el servidor';
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
      
      notificationService.toast(
        'error',
        `No se pudo enviar la retroalimentación: ${errorMsg}`,
        { duration: 3 }
      );
      
      return false;
    }
  }, []);

  // Cargar consultas al montar el componente si autoFetch está habilitado
  useEffect(() => {
    if (patientId && autoFetch) {
      fetchQueries();
    }
  }, [patientId, autoFetch, fetchQueries]);

  return {
    queries,
    totalQueries,
    suggestedQueries,
    loading,
    submitting,
    error,
    fetchQueries,
    submitQuery,
    checkQueryStatus,
    toggleFavorite,
    reprocessQuery,
    findSimilarQueries,
    provideFeedback,
    clearCache,
    retryCount
  };
}; 