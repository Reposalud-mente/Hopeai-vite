import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { 
  ClinicalQuery, 
  ClinicalQueryResponse, 
  ClinicalQueryHistoryResponse 
} from '../types/ClinicalQuery';

interface UseClinicalQueryOptions {
  patientId: string;
  autoFetch?: boolean;
  limit?: number;
}

/**
 * Hook para gestionar consultas clínicas
 */
export const useClinicalQuery = ({ 
  patientId, 
  autoFetch = true,
  limit = 10 
}: UseClinicalQueryOptions) => {
  const [queries, setQueries] = useState<ClinicalQuery[]>([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener historial de consultas para un paciente
   */
  const fetchQueries = useCallback(async (offset = 0, tag?: string, favorite?: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      let queryParams = new URLSearchParams();
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
      } else {
        setError(response.data.error || 'Error al obtener consultas');
      }
    } catch (err) {
      console.error('Error al obtener consultas clínicas:', err);
      setError('Error al comunicarse con el servidor');
    } finally {
      setLoading(false);
    }
  }, [patientId, limit]);

  /**
   * Enviar una nueva consulta clínica
   */
  const submitQuery = useCallback(async (question: string, tags?: string[]): Promise<ClinicalQuery | undefined> => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post<ClinicalQueryResponse>('/api/clinical/queries', {
        question,
        patientId,
        tags
      });
      
      if (response.data.success && response.data.data) {
        // Actualizar la lista de consultas con la nueva
        setQueries(prev => [response.data.data!, ...prev]);
        return response.data.data;
      } else {
        setError(response.data.error || 'Error al enviar consulta');
        return undefined;
      }
    } catch (err) {
      console.error('Error al enviar consulta clínica:', err);
      setError('Error al comunicarse con el servidor');
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }, [patientId]);

  /**
   * Verificar el estado de procesamiento de una consulta
   */
  const checkQueryStatus = useCallback(async (queryId: number): Promise<ClinicalQuery | undefined> => {
    try {
      const response = await axios.get<ClinicalQueryResponse>(`/api/clinical/queries/${queryId}`);
      
      if (response.data.success && response.data.data) {
        // Actualizar la consulta en la lista
        setQueries(prev => 
          prev.map(q => q.id === queryId ? response.data.data! : q)
        );
        return response.data.data;
      }
      return undefined;
    } catch (err) {
      console.error('Error al verificar estado de consulta:', err);
      return undefined;
    }
  }, []);

  /**
   * Cambiar estado de favorito
   */
  const toggleFavorite = useCallback(async (queryId: number, isFavorite: boolean): Promise<void> => {
    try {
      const response = await axios.patch<ClinicalQueryResponse>(`/api/clinical/queries/${queryId}/favorite`);
      
      if (response.data.success && response.data.data) {
        // Actualizar la consulta en la lista
        setQueries(prev => 
          prev.map(q => q.id === queryId ? response.data.data! : q)
        );
      }
    } catch (err) {
      console.error('Error al cambiar estado de favorito:', err);
      setError('Error al actualizar favorito');
    }
  }, []);

  /**
   * Reprocesar una consulta existente
   */
  const reprocessQuery = useCallback(async (queryId: number): Promise<ClinicalQuery | undefined> => {
    setLoading(true);
    
    try {
      const response = await axios.post<ClinicalQueryResponse>(`/api/clinical/queries/${queryId}/process`);
      
      if (response.data.success && response.data.data) {
        // Actualizar la consulta en la lista
        setQueries(prev => 
          prev.map(q => q.id === queryId ? response.data.data! : q)
        );
        return response.data.data;
      }
      return undefined;
    } catch (err) {
      console.error('Error al reprocesar consulta:', err);
      setError('Error al reprocesar consulta');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar consultas al montar el componente si autoFetch es true
  useEffect(() => {
    if (autoFetch && patientId) {
      fetchQueries();
    }
  }, [autoFetch, patientId, fetchQueries]);

  return {
    queries,
    totalQueries,
    loading,
    submitting,
    error,
    fetchQueries,
    submitQuery,
    checkQueryStatus,
    toggleFavorite,
    reprocessQuery
  };
}; 