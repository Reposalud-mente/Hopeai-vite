// Interfaces para el módulo de análisis interactivo

export interface ClinicalReference {
  source: string;       // DSM-5, CIE-11, artículo, etc.
  citation: string;     // Texto de la cita
  link?: string;        // Enlace opcional a la fuente
}

export interface ClinicalResponseJson {
  mainAnswer: string;                 // Respuesta principal
  reasoning: string;                  // Razonamiento clínico
  confidenceScore: number;            // Nivel de confianza (0-1)
  references: ClinicalReference[];    // Referencias que fundamentan la respuesta
  suggestedQuestions?: string[];      // Preguntas de seguimiento sugeridas
  diagnosticConsiderations?: string[]; // Consideraciones diagnósticas relevantes
  treatmentSuggestions?: string[];    // Sugerencias de tratamiento si aplica
}

export interface ClinicalQuery {
  id: number;
  question: string;
  answer: string;
  responseJson: ClinicalResponseJson | null;
  confidenceScore: number | null;
  createdAt: Date;
  isFavorite: boolean;
  patientId: string;
  tags?: string[];
  // Campos para el sistema de retroalimentación
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackTags?: string[];
  hasFeedback?: boolean;
}

// Interfaz para peticiones de creación de consultas
export interface CreateClinicalQueryRequest {
  question: string;
  patientId: string;
  tags?: string[];
}

// Interfaz para respuestas a consultas clínicas
export interface ClinicalQueryResponse {
  success: boolean;
  data?: ClinicalQuery;
  error?: string;
}

// Interfaz para obtener historial de consultas
export interface ClinicalQueryHistoryResponse {
  success: boolean;
  data?: {
    queries: ClinicalQuery[];
    total: number;
  };
  error?: string;
} 