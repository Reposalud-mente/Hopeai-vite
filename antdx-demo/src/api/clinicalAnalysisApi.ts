/**
 * API para comunicación con el backend de análisis clínico
 * 
 * Este módulo proporciona funciones para hacer peticiones al backend
 * que ejecuta LangGraph para análisis clínico.
 */

import axios from 'axios';
import { PatientAnalysis, ThoughtStep, Diagnosis, Recommendation, ClinicalAnalysisResult } from '../types/ai-types';

// URL base para las API del backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Cliente axios configurado
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60 segundos para análisis completo
});

/**
 * Convierte los resultados del backend al formato esperado por la UI
 * @param {ClinicalAnalysisResult} apiResult - Resultado del backend
 * @returns {PatientAnalysis} - Formato compatible con la UI existente
 */
function mapBackendResultToUIFormat(apiResult: ClinicalAnalysisResult): PatientAnalysis {
  // Convertir los pasos de pensamiento a formato ThoughtChain
  const thoughtChain: ThoughtStep[] = [
    {
      title: "Identificación de síntomas",
      description: "Analizando síntomas relevantes del paciente",
      status: apiResult.symptoms.length > 0 ? "finish" : "processing" 
    },
    {
      title: "Análisis DSM-5",
      description: "Comparando síntomas con criterios diagnósticos",
      status: apiResult.dsmAnalysis.length > 0 ? "finish" : 
              apiResult.symptoms.length > 0 ? "processing" : "wait"
    },
    {
      title: "Formulación diagnóstica",
      description: "Generando posibles diagnósticos",
      status: apiResult.possibleDiagnoses.length > 0 ? "finish" : 
              apiResult.dsmAnalysis.length > 0 ? "processing" : "wait"
    },
    {
      title: "Recomendaciones",
      description: "Sugiriendo opciones de tratamiento",
      status: apiResult.treatmentSuggestions.length > 0 ? "finish" : 
              apiResult.possibleDiagnoses.length > 0 ? "processing" : "wait"
    }
  ];

  // Convertir diagnósticos a formato de UI
  const diagnoses: Diagnosis[] = apiResult.possibleDiagnoses.map((diagnosis: string, index: number) => {
    // Extraer código CIE-10 si existe
    const cieMatch = diagnosis.match(/F\d+(\.\d+)?/);
    const cieCode = cieMatch ? cieMatch[0] : '';
    
    // Determinar nivel de confianza basado en la posición
    const confidence = index === 0 ? "Alta" : index === 1 ? "Media" : "Baja";
    
    return {
      name: diagnosis,
      description: `Diagnóstico según criterios DSM-5 y CIE-10 ${cieCode}`,
      confidence
    };
  });

  const recommendations: Recommendation[] = apiResult.treatmentSuggestions.map((treatment: string, index) => ({
    id: `rec-${index}`,
    title: "Tratamiento recomendado",
    description: treatment,
    type: 'tratamiento',
    priority: index === 0 ? 'alta' : index === 1 ? 'media' : 'baja'
  }));

  return {
    thoughtChain,
    diagnoses,
    recommendations
  };
}

/**
 * Verifica si el endpoint de análisis está disponible
 * @returns {Promise<boolean>} - true si está disponible
 */
export const testAnalysisEndpoint = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/analysis');
    return response.status === 200;
  } catch (error) {
    console.error('Error al verificar endpoint de análisis:', error);
    return false;
  }
};

/**
 * Envía datos del paciente al backend para análisis
 * @param {string} patientData - Datos del paciente
 * @returns {Promise<PatientAnalysis>} - Análisis completo
 */
export const analyzePatientWithBackend = async (patientData: string): Promise<PatientAnalysis> => {
  try {
    const response = await apiClient.post('/clinical/analyze', { patientData });
    
    if (response.data.success && response.data.data) {
      return mapBackendResultToUIFormat(response.data.data);
    } else {
      throw new Error(response.data.error || 'Respuesta inesperada del servidor');
    }
  } catch (error) {
    console.error('Error al analizar paciente con el backend:', error);
    throw error;
  }
};

/**
 * Envía una pregunta específica al backend para respuesta contextual
 * @param {string} question - La pregunta sobre el paciente
 * @param {ClinicalAnalysisResult} analysisState - Estado actual del análisis
 * @returns {Promise<string>} - Respuesta a la pregunta
 */
export const askQuestionWithBackend = async (
  question: string,
  analysisState: ClinicalAnalysisResult
): Promise<string> => {
  try {
    const response = await apiClient.post('/clinical/question', {
      question,
      analysisState
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data.answer;
    } else {
      throw new Error(response.data.error || 'Respuesta inesperada del servidor');
    }
  } catch (error) {
    console.error('Error al hacer pregunta al backend:', error);
    throw error;
  }
}; 