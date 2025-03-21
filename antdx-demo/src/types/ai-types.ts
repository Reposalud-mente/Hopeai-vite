/**
 * Tipos para la integración con DeepSeek API
 * Este archivo contiene las interfaces para las respuestas y solicitudes a la API de DeepSeek
 */

/**
 * Estructura de mensaje para la API de DeepSeek/OpenAI
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

/**
 * Opciones de configuración para las llamadas a la API
 */
export interface AIRequestOptions {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: {
    type: "text" | "json_object";
  };
  stream?: boolean;
}

/**
 * Estructura de respuesta de la API de DeepSeek/OpenAI
 */
export interface AIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Estructura de la elección en la respuesta de la API
 */
export interface AIChoice {
  index: number;
  message: AIMessage;
  finish_reason: string;
}

/**
 * Estructura para el paso de pensamiento mostrado en la UI
 */
export interface ThoughtStep {
  title: string;
  description: string;
  status: 'wait' | 'processing' | 'finish' | 'error';
  icon?: React.ReactNode;
}

/**
 * Estructura para diagnóstico mostrado en la UI
 */
export interface Diagnosis {
  name: string;
  description: string;
  confidence: string;
}

/**
 * Estructura para recomendación mostrada en la UI
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'tratamiento' | 'evaluación' | 'seguimiento';
  priority: 'alta' | 'media' | 'baja';
}

/**
 * Estructura para el análisis completo del paciente
 */
export interface PatientAnalysis {
  thoughtChain: ThoughtStep[];
  diagnoses: Diagnosis[];
  recommendations: Recommendation[];
}

/**
 * Estructura para los resultados del grafo de análisis clínico
 */
export interface ClinicalAnalysisResult {
  symptoms: string[];
  dsmAnalysis: string[];
  possibleDiagnoses: string[];
  treatmentSuggestions: string[];
  rawOutput?: string;
}

/**
 * Estructura para la respuesta de chat
 */
export interface ChatResponse {
  answer: string;
  updatedDiagnoses: Diagnosis[] | null;
  updatedThoughtChain: ThoughtStep[] | null;
}

/**
 * Tipo para el procesador de errores
 */
export interface ErrorProcessor {
  (error: Error): void;
} 