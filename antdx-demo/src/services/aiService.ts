/**
 * Servicio para integración con DeepSeek API
 * 
 * Este servicio proporciona métodos para realizar análisis clínicos
 * y consultas utilizando IA, con manejo de errores y caché.
 */

import axios from 'axios';
import { MemoryCache, memoize } from '../utils/cacheUtils';
import { useError } from '../hooks/useError';
import { ErrorSource, ErrorSeverity } from '../context/ErrorContext';
import {
  AIMessage,
  AIRequestOptions,
  AIResponse,
  Diagnosis,
  Recommendation,
  ThoughtStep,
  ClinicalAnalysisResult
} from '../types/ai-types';
import { Patient } from '../types/clinical-types';
import { AIError } from '../utils/errorHandler';

// URL base para la API de DeepSeek
const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://api.deepseek.com/v1';
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || '';

// Modelo a utilizar
const DEFAULT_MODEL = 'deepseek-chat';

// Cliente axios configurado
const aiClient = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_API_KEY}`
  },
  timeout: 30000 // 30 segundos
});

// Caché para respuestas de análisis clínico (1 hora)
const analysisCache = new MemoryCache<ClinicalAnalysisResult>(60 * 60 * 1000);

/**
 * Realiza una petición a la API de DeepSeek
 * @param options Opciones de la petición
 * @returns Respuesta de la API
 */
export async function callAIAPI(options: AIRequestOptions): Promise<AIResponse> {
  try {
    const response = await aiClient.post('/chat/completions', {
      ...options,
      model: options.model || DEFAULT_MODEL
    });
    
    return response.data;
  } catch (error) {
    // Detectar y manejar errores específicos de la API de IA
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;
      throw new AIError(
        errorData.error?.message || 'Error en la API de IA',
        errorData.error?.type,
        errorData.error?.code,
        ErrorSeverity.ERROR,
        { statusCode: error.response.status }
      );
    }
    
    // Propagar otros errores
    throw error;
  }
}

/**
 * Genera un mensaje de sistema para el análisis clínico
 * @returns Mensaje de sistema
 */
function generateSystemMessage(): AIMessage {
  return {
    role: 'system',
    content: `Eres un asistente clínico especializado en psicología, con expertise en DSM-5 y CIE-11.
Tu objetivo es ayudar a los profesionales de salud mental a analizar casos clínicos.
Debes pensar paso a paso, identificando síntomas, signos, factores de riesgo y realizando diagnósticos diferenciales.
Proporciona respuestas precisas, basadas en evidencia, y contextualmente apropiadas.
Cuando analices un caso, debes considerar:
1. Síntomas principales y su duración
2. Historia clínica y factores predisponentes
3. Criterios diagnósticos según DSM-5 o CIE-11
4. Diagnósticos diferenciales
5. Recomendaciones de tratamiento basadas en evidencia

Tus respuestas serán utilizadas por profesionales, por lo que deben ser técnicamente precisas.`
  };
}

/**
 * Genera un mensaje para el análisis clínico basado en los datos del paciente
 * @param patient Datos del paciente
 * @returns Mensaje para el análisis
 */
function generatePatientAnalysisMessage(patient: Patient): AIMessage {
  const patientInfo = `
Nombre: ${patient.name}
Edad: ${patient.age || 'No disponible'}
Género: ${patient.gender || 'No disponible'}
Motivo de consulta: ${patient.consultReason || 'No disponible'}
Historia clínica: ${patient.clinicalHistory || 'No disponible'}
Historia familiar: ${patient.familyHistory || 'No disponible'}
Antecedentes médicos: ${patient.medicalHistory || 'No disponible'}
Borrador de evaluación: ${patient.evaluationDraft || 'No disponible'}
  `;
  
  // Añadir resultados de tests si existen
  let testsInfo = '';
  if (patient.testResults && patient.testResults.length > 0) {
    testsInfo = '\nResultados de pruebas psicológicas:\n';
    patient.testResults.forEach(test => {
      testsInfo += `\n- ${test.name} (${test.date || 'Fecha no disponible'}):\n`;
      test.results.forEach(result => {
        testsInfo += `  * ${result.scale}: ${result.score}`;
        if (result.percentile) testsInfo += ` (Percentil ${result.percentile})`;
        if (result.interpretation) testsInfo += ` - ${result.interpretation}`;
        testsInfo += '\n';
      });
    });
  }
  
  return {
    role: 'user',
    content: `Por favor, analiza el siguiente caso clínico y proporciona una evaluación completa:

${patientInfo}
${testsInfo}

Quiero que me proporciones:
1. Análisis de síntomas principales 
2. Posibles diagnósticos según DSM-5/CIE-11
3. Justificación de cada diagnóstico
4. Recomendaciones terapéuticas basadas en evidencia

Responde con un formato JSON que incluya los siguientes campos:
- symptoms: lista de síntomas identificados
- dsmAnalysis: análisis según criterios DSM-5
- possibleDiagnoses: lista de posibles diagnósticos con nivel de confianza
- treatmentSuggestions: recomendaciones de tratamiento
`
  };
}

/**
 * Función memoizada para analizar un paciente
 * Esta función se ejecutará una sola vez para la misma entrada (gracias a memoize)
 */
const analyzeMemoized = memoize(
  async (patientData: Patient): Promise<ClinicalAnalysisResult> => {
    const messages = [
      generateSystemMessage(),
      generatePatientAnalysisMessage(patientData)
    ];
    
    const options: AIRequestOptions = {
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    };
    
    // Llamar a la API
    const response = await callAIAPI(options);
    
    // Extraer el contenido de la respuesta
    const content = response.choices[0].message.content;
    
    try {
      // Intentar parsear como JSON
      const result = JSON.parse(content) as ClinicalAnalysisResult;
      result.rawOutput = content; // Guardar respuesta original
      return result;
    } catch (error) {
      // Si no es JSON válido, devolver una estructura básica con el contenido raw
      console.error('Error al parsear respuesta JSON:', error);
      return {
        symptoms: [],
        dsmAnalysis: [],
        possibleDiagnoses: [],
        treatmentSuggestions: [],
        rawOutput: content
      };
    }
  },
  // Función para generar clave de caché basada en datos del paciente
  (patient: Patient) => `analysis_${patient.id}_${patient.evaluationDraft?.length || 0}`,
  // TTL de 1 hora
  { ttl: 60 * 60 * 1000 }
);

/**
 * Analiza los datos de un paciente
 * @param patient Datos del paciente
 * @param forceRefresh Forzar recálculo sin usar caché
 * @returns Resultado del análisis
 */
export async function analyzePatient(
  patient: Patient, 
  forceRefresh = false
): Promise<ClinicalAnalysisResult> {
  const cacheKey = `analysis_${patient.id}_${patient.evaluationDraft?.length || 0}`;
  
  // Si no se fuerza recarga y existe en caché, devolver desde caché
  if (!forceRefresh) {
    const cachedAnalysis = analysisCache.get(cacheKey);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }
  }
  
  // Ejecutar análisis memoizado
  const result = await analyzeMemoized(patient);
  
  // Guardar en caché
  analysisCache.set(cacheKey, result);
  
  return result;
}

/**
 * Convierte un resultado de análisis clínico a diagnósticos para la UI
 * @param result Resultado del análisis
 * @returns Lista de diagnósticos
 */
export function convertToDiagnoses(result: ClinicalAnalysisResult): Diagnosis[] {
  // Si hay diagnósticos posibles en el resultado
  if (result.possibleDiagnoses && result.possibleDiagnoses.length > 0) {
    return result.possibleDiagnoses.map((diagnosis, index) => {
      // Extraer nombre y descripción del diagnóstico
      const parts = diagnosis.split(':');
      const name = parts[0]?.trim() || 'Diagnóstico sin especificar';
      const description = parts[1]?.trim() || '';
      
      // Asignar un nivel de confianza predeterminado si no se especifica
      const confidencePattern = /\(([^)]+)\)/;
      const confidenceMatch = diagnosis.match(confidencePattern);
      const confidence = confidenceMatch ? confidenceMatch[1] : index === 0 ? 'Alta' : 'Media';
      
      return {
        name,
        description,
        confidence
      };
    });
  }
  
  return [];
}

/**
 * Convierte un resultado de análisis clínico a recomendaciones para la UI
 * @param result Resultado del análisis
 * @returns Lista de recomendaciones
 */
export function convertToRecommendations(result: ClinicalAnalysisResult): Recommendation[] {
  // Si hay recomendaciones de tratamiento en el resultado
  if (result.treatmentSuggestions && result.treatmentSuggestions.length > 0) {
    return result.treatmentSuggestions.map(suggestion => {
      // Extraer título y descripción de la recomendación
      const parts = suggestion.split(':');
      const title = parts[0]?.trim() || 'Recomendación';
      const description = parts[1]?.trim() || suggestion;
      
      return {
        title,
        description
      };
    });
  }
  
  return [];
}

/**
 * Genera una cadena de pensamiento para mostrar en la UI
 * @param result Resultado del análisis
 * @returns Pasos de la cadena de pensamiento
 */
export function generateThoughtChain(result: ClinicalAnalysisResult): ThoughtStep[] {
  const thoughtChain: ThoughtStep[] = [
    {
      title: 'Identificación de síntomas',
      description: result.symptoms?.join('\n') || 'No se identificaron síntomas específicos',
      status: 'finish'
    },
    {
      title: 'Análisis según DSM-5/CIE-11',
      description: result.dsmAnalysis?.join('\n') || 'No se realizó análisis según criterios diagnósticos',
      status: 'finish'
    },
    {
      title: 'Formulación de diagnósticos',
      description: result.possibleDiagnoses?.join('\n') || 'No se identificaron diagnósticos posibles',
      status: 'finish'
    },
    {
      title: 'Recomendaciones terapéuticas',
      description: result.treatmentSuggestions?.join('\n') || 'No se generaron recomendaciones específicas',
      status: 'finish'
    }
  ];
  
  return thoughtChain;
}

/**
 * Hook personalizado para usar el servicio de IA con manejo de errores
 */
export function useAIService() {
  const { withErrorHandling } = useError();
  
  return {
    /**
     * Analiza los datos de un paciente con manejo de errores
     */
    analyzePatient: async (patient: Patient, forceRefresh = false) => {
      return withErrorHandling(
        async () => analyzePatient(patient, forceRefresh),
        'Error al analizar los datos del paciente',
        ErrorSource.AI,
        { 
          patientId: patient.id,
          draftLength: patient.evaluationDraft?.length || 0 
        }
      );
    },
    
    /**
     * Realiza una llamada directa a la API de IA con manejo de errores
     */
    callAI: async (options: AIRequestOptions) => {
      return withErrorHandling(
        async () => callAIAPI(options),
        'Error en la comunicación con la IA',
        ErrorSource.AI,
        { 
          model: options.model,
          messagesCount: options.messages.length
        }
      );
    },
    
    convertToDiagnoses,
    convertToRecommendations,
    generateThoughtChain
  };
} 