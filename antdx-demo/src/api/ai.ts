/**
 * API de integración con DeepSeek para análisis clínico
 * 
 * Este módulo centraliza y exporta las funciones principales para interactuar con la API de DeepSeek
 * utilizando el formato compatible con OpenAI.
 */

// Importar servicios centralizados
import { callAIAPI } from '../services/aiService';

// Importar funciones de análisis clínico
import { 
  analyzePatientWithErrorHandling, 
  chatWithAIWithErrorHandling 
} from './clinicalAnalysis';

// Import tipos
import { 
  PatientAnalysis, 
  ChatResponse,
  ErrorProcessor,
  AIMessage 
} from '../types/ai-types';
import { withErrorHandling } from './aiClient';

/**
 * Realiza un análisis clínico del paciente con manejo de errores
 * @param {string} patientData - Datos del paciente a analizar
 * @param {ErrorProcessor} errorProcessor - Procesador de errores personalizado (opcional)
 * @returns {Promise<PatientAnalysis>} - Análisis completo del paciente
 */
export const fetchAIAnalysisWithErrorHandling = async (
  patientData: string, 
  errorProcessor?: ErrorProcessor
): Promise<PatientAnalysis> => {
  return analyzePatientWithErrorHandling(patientData, errorProcessor);
};

/**
 * Ejecuta una consulta sobre el asistente de IA con manejo de errores
 * @param {string} prompt - El prompt a enviar al asistente
 * @param {string} systemPrompt - El prompt del sistema (opcional)
 * @param {ErrorProcessor} errorProcessor - Procesador de errores personalizado (opcional)
 * @returns {Promise<string>} - La respuesta del asistente
 */
export const fetchAICompletionWithErrorHandling = async (
  prompt: string,
  systemPrompt?: string,
  errorProcessor?: ErrorProcessor
): Promise<string> => {
  try {
    const messages: AIMessage[] = [];
    
    // Añadir mensaje del sistema si existe
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    // Añadir mensaje del usuario
    messages.push({ role: 'user', content: prompt });
    
    const response = await callAIAPI({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    // Procesar el error si se proporciona un procesador
    if (errorProcessor && error instanceof Error) {
      errorProcessor(error);
    }
    
    // Re-lanzar el error para manejo en capas superiores
    throw error;
  }
};

/**
 * Genera un informe clínico con manejo de errores
 * @param {string} patientData - Datos del paciente
 * @param {ErrorProcessor} errorProcessor - Procesador de errores personalizado (opcional)
 * @returns {Promise<string>} - Informe clínico generado
 */
export const generateClinicalReportWithErrorHandling = async (
  patientData: string,
  errorProcessor?: ErrorProcessor
): Promise<string> => {
  return withErrorHandling(async () => {
    // Por ahora, esta función es un stub que retorna un mensaje de que la funcionalidad
    // será implementada pronto. En el futuro, usará aiPrompts y clinicalAnalysis
    return "Funcionalidad de generación de informes clínicos en desarrollo. Estará disponible en próximas actualizaciones.";
  }, errorProcessor);
};

/**
 * Procesa una consulta sobre el paciente con manejo de errores
 * @param {string} question - Pregunta del usuario
 * @param {string} patientData - Datos del paciente
 * @param {Array} history - Historial de conversación
 * @param {ErrorProcessor} errorProcessor - Procesador de errores personalizado (opcional)
 * @returns {Promise<ChatResponse>} - Respuesta a la consulta
 */
export const chatWithPatientDataWithErrorHandling = async (
  question: string,
  patientData: string,
  history: Array<{ type: string; content: string }>,
  errorProcessor?: ErrorProcessor
): Promise<ChatResponse> => {
  return chatWithAIWithErrorHandling(question, patientData, history, errorProcessor);
};

// Re-exportar funcionalidades para mantener compatibilidad con código existente
export { analyzePatientWithErrorHandling as deepseekAnalyzePatient };
export { chatWithAIWithErrorHandling as deepseekChatWithAI }; 