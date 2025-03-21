/**
 * Funcionalidad principal para análisis clínico
 * 
 * Este módulo proporciona funciones para realizar análisis clínicos
 * utilizando la API de DeepSeek y el backend de análisis clínico.
 */

import { 
  PatientAnalysis, 
  ChatResponse, 
  ErrorProcessor, 
  ThoughtStep, 
  Diagnosis, 
  Recommendation,
  ClinicalAnalysisResult,
  AIMessage
} from '../types/ai-types';
import { callAIAPI } from '../services/aiService';
import { config } from './aiClient';
import { 
  CLINICAL_ANALYSIS_SYSTEM_PROMPT, 
  getClinicalAnalysisUserPrompt,
  CLINICAL_CHAT_SYSTEM_PROMPT,
  getClinicalChatUserPrompt,
  AIRequestConfig
} from './aiPrompts';
import { 
  analyzePatientWithBackend,
  askQuestionWithBackend,
  testAnalysisEndpoint
} from './clinicalAnalysisApi';

/**
 * Convierte los resultados del clinicalAnalysisGraph al formato esperado por la UI
 * @param {ClinicalAnalysisResult} graphResult - Resultado del clinicalAnalysisGraph
 * @returns {PatientAnalysis} - Formato compatible con la UI existente
 */
function mapGraphResultToUIFormat(graphResult: ClinicalAnalysisResult): PatientAnalysis {
  // Convertir los pasos de pensamiento a formato ThoughtChain
  const thoughtChain: ThoughtStep[] = [
    {
      title: "Identificación de síntomas",
      description: "Analizando síntomas relevantes del paciente",
      status: graphResult.symptoms.length > 0 ? "finish" : "processing" 
    },
    {
      title: "Análisis DSM-5",
      description: "Comparando síntomas con criterios diagnósticos",
      status: graphResult.dsmAnalysis.length > 0 ? "finish" : 
              graphResult.symptoms.length > 0 ? "processing" : "wait"
    },
    {
      title: "Formulación diagnóstica",
      description: "Generando posibles diagnósticos",
      status: graphResult.possibleDiagnoses.length > 0 ? "finish" : 
              graphResult.dsmAnalysis.length > 0 ? "processing" : "wait"
    },
    {
      title: "Recomendaciones",
      description: "Sugiriendo opciones de tratamiento",
      status: graphResult.treatmentSuggestions.length > 0 ? "finish" : 
              graphResult.possibleDiagnoses.length > 0 ? "processing" : "wait"
    }
  ];

  // Convertir diagnósticos a formato de UI
  const diagnoses: Diagnosis[] = graphResult.possibleDiagnoses.map((diagnosis: string, index: number) => {
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

  // Corregir para incluir todos los campos requeridos
  const recommendations: Recommendation[] = graphResult.treatmentSuggestions.map((treatment: string, index) => ({
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
 * Analiza los datos del paciente para generar diagnósticos y recomendaciones
 * @param {string} patientData - Los datos completos del paciente
 * @returns {Promise<PatientAnalysis>} - Análisis completo del paciente
 */
export async function deepseekAnalyzePatient(patientData: string): Promise<PatientAnalysis> {
  try {
    // Intentamos usar el backend primero
    try {
      console.log("Usando el backend con LangGraph");
      // Verificar que el endpoint esté disponible
      const endpointAvailable = await testAnalysisEndpoint();
      
      if (endpointAvailable) {
        return await analyzePatientWithBackend(patientData);
      } else {
        throw new Error("Endpoint de análisis no disponible");
      }
    } catch (backendError) {
      console.error("Error al usar backend:", backendError);
      console.log("Fallback a DeepSeek API directa");
      
      // Fallback a la implementación original si hay error en el backend
      const response = await callAIAPI({
        model: config.MODEL,
        messages: [
          { role: 'system', content: CLINICAL_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: getClinicalAnalysisUserPrompt(patientData) }
        ],
        temperature: AIRequestConfig.clinicalAnalysis.temperature,
        response_format: { type: "json_object" as const }
      });

      // Extraer la respuesta JSON
      const content = response.choices[0].message.content;
      console.log("Content recibido:", content);
      
      // Parsear el JSON
      const result = JSON.parse(content);
      
      return {
        thoughtChain: result.thoughtChain || [],
        diagnoses: result.diagnoses || [],
        recommendations: result.recommendations || []
      };
    }
  } catch (error) {
    console.error("Error al procesar respuesta de análisis:", error);
    // Proporcionar datos fallback en caso de error
    const errorThoughtChain: ThoughtStep[] = [
      {
        title: "Error en el análisis",
        description: `No se pudo procesar la respuesta del servicio de IA: ${error instanceof Error ? error.message : String(error)}`,
        status: "error"
      }
    ];
    
    // Crear una recomendación de fallback con la estructura completa requerida
    const fallbackRecommendation: Recommendation = {
      id: "fallback-1",
      title: "Revisión del caso",
      description: "Se recomienda revisar manualmente el caso debido a un error en el procesamiento automático.",
      type: "evaluación",
      priority: "media"
    };
    
    return {
      thoughtChain: errorThoughtChain,
      diagnoses: [],
      recommendations: [fallbackRecommendation]
    };
  }
}

/**
 * Procesa una consulta específica sobre el paciente
 * @param {string} question - La pregunta del usuario
 * @param {string} patientData - Los datos del paciente
 * @param {Array} history - El historial de conversación
 * @returns {Promise<ChatResponse>} - La respuesta a la consulta
 */
export async function deepseekChatWithAI(
  question: string, 
  patientData: string, 
  history: Array<{ type: string; content: string }>
): Promise<ChatResponse> {
  try {
    // Primero intentamos analizar con el backend
    let analysisState: ClinicalAnalysisResult | null = null;
    try {
      // Verificar que el endpoint esté disponible
      const endpointAvailable = await testAnalysisEndpoint();
      
      if (endpointAvailable) {
        // Analizar primero para obtener el estado
        const analysis = await analyzePatientWithBackend(patientData);
        
        // Extraer estado del análisis (esto depende de la implementación de analyzePatientWithBackend)
        // Por ahora usamos la estructura básica que contiene los mismos campos
        analysisState = {
          symptoms: analysis.diagnoses.map(d => d.name),
          dsmAnalysis: [],
          possibleDiagnoses: analysis.diagnoses.map(d => d.name),
          treatmentSuggestions: analysis.recommendations.map(r => r.description)
        };
        
        // Usar endpoint de preguntas con el estado del análisis
        const answer = await askQuestionWithBackend(question, analysisState);
        
        return {
          answer,
          updatedDiagnoses: null,
          updatedThoughtChain: null
        };
      }
    } catch (backendError) {
      console.error("Error al usar backend para responder:", backendError);
      console.log("Fallback a DeepSeek API directa");
    }
    
    // Fallback a la implementación original
    // Convertir historial a formato compatible con DeepSeek/OpenAI
    const formattedHistory: AIMessage[] = history.map(msg => ({
      role: (msg.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content
    }));

    // Crear mensaje del sistema con contexto y usar servicio centralizado
    const response = await callAIAPI({
      model: config.MODEL,
      messages: [
        { role: 'system', content: CLINICAL_CHAT_SYSTEM_PROMPT },
        ...formattedHistory,
        { 
          role: 'user', 
          content: getClinicalChatUserPrompt(question, patientData, analysisState) 
        }
      ],
      temperature: AIRequestConfig.clinicalChat.temperature
    });

    return {
      answer: response.choices[0].message.content,
      updatedDiagnoses: null,
      updatedThoughtChain: null
    };
  } catch (error) {
    console.error("Error al procesar consulta:", error);
    return {
      answer: `Lo siento, no pude procesar tu consulta debido a un error: ${error instanceof Error ? error.message : String(error)}`,
      updatedDiagnoses: null,
      updatedThoughtChain: null
    };
  }
}

/**
 * Wrapper con manejo de errores para análisis de paciente
 * @param {string} patientData - Datos del paciente
 * @param {ErrorProcessor} errorProcessor - Procesador de errores opcional
 * @returns {Promise<PatientAnalysis>} - Resultado del análisis
 */
export const analyzePatientWithErrorHandling = async (
  patientData: string, 
  errorProcessor?: ErrorProcessor
): Promise<PatientAnalysis> => {
  try {
    return await deepseekAnalyzePatient(patientData);
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
 * Wrapper con manejo de errores para chat con IA
 * @param {string} question - Pregunta del usuario
 * @param {string} patientData - Datos del paciente
 * @param {Array} history - Historial de conversación
 * @param {ErrorProcessor} errorProcessor - Procesador de errores opcional
 * @returns {Promise<ChatResponse>} - Respuesta del chat
 */
export const chatWithAIWithErrorHandling = async (
  question: string,
  patientData: string,
  history: Array<{ type: string; content: string }>,
  errorProcessor?: ErrorProcessor
): Promise<ChatResponse> => {
  try {
    return await deepseekChatWithAI(question, patientData, history);
  } catch (error) {
    // Procesar el error si se proporciona un procesador
    if (errorProcessor && error instanceof Error) {
      errorProcessor(error);
    }
    
    // Re-lanzar el error para manejo en capas superiores
    throw error;
  }
}; 