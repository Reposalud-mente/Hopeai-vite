import axios from 'axios';
import { ClinicalQuery } from '../types/ClinicalQuery';

/**
 * Interfaces para respuestas de la API
 */
export interface ClinicalQueryResponse {
  success: boolean;
  data?: ClinicalQuery;
  error?: string;
  message?: string;
}

export interface ClinicalQueryHistoryResponse {
  success: boolean;
  data?: {
    queries: ClinicalQuery[];
    total: number;
  };
  error?: string;
}

/**
 * Obtiene las consultas clínicas de un paciente
 */
export const getPatientQueries = async (
  patientId: string,
  params: { limit?: number; offset?: number; tag?: string; favorite?: boolean } = {}
): Promise<ClinicalQueryHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.tag) queryParams.append('tag', params.tag);
    if (params.favorite) queryParams.append('favorite', 'true');
    
    const response = await axios.get<ClinicalQueryHistoryResponse>(
      `/api/clinical/queries/patient/${patientId}?${queryParams.toString()}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener consultas del paciente:', error);
    return {
      success: false,
      error: 'Error al obtener historial de consultas'
    };
  }
};

/**
 * Crea una nueva consulta clínica
 */
export const createClinicalQuery = async (
  patientId: string,
  question: string,
  tags: string[] = []
): Promise<ClinicalQueryResponse> => {
  try {
    const response = await axios.post<ClinicalQueryResponse>('/api/clinical/queries', {
      patientId,
      question,
      tags
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al crear consulta clínica:', error);
    return {
      success: false,
      error: 'Error al enviar consulta al servidor'
    };
  }
};

/**
 * Marca o desmarca una consulta como favorita
 */
export const toggleFavoriteQuery = async (
  queryId: number,
  isFavorite: boolean
): Promise<ClinicalQueryResponse> => {
  try {
    const response = await axios.patch<ClinicalQueryResponse>(
      `/api/clinical/queries/${queryId}/favorite`,
      { isFavorite }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de favorito:', error);
    return {
      success: false,
      error: 'Error al actualizar estado de favorito'
    };
  }
};

/**
 * Obtiene una consulta clínica por ID
 */
export const getQueryById = async (queryId: number): Promise<ClinicalQueryResponse> => {
  try {
    const response = await axios.get<ClinicalQueryResponse>(`/api/clinical/queries/${queryId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener consulta por ID:', error);
    return {
      success: false,
      error: 'Error al obtener detalle de la consulta'
    };
  }
};

/**
 * Elimina una consulta clínica
 */
export const deleteQuery = async (queryId: number): Promise<ClinicalQueryResponse> => {
  try {
    const response = await axios.delete<ClinicalQueryResponse>(`/api/clinical/queries/${queryId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar consulta:', error);
    return {
      success: false,
      error: 'Error al eliminar la consulta'
    };
  }
}; 