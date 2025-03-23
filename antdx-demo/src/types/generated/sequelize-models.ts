/**
 * ESTE ARCHIVO ES GENERADO AUTOMÁTICAMENTE
 * NO MODIFICAR MANUALMENTE
 * 
 * Generado el: 2025-03-22T01:17:37.623Z
 */

export interface IPatient {
  id: string;
  name: string;
  age?: number;
  status: string;
  evaluationDate?: Date;
  psychologist?: string;
  consultReason?: string;
  evaluationDraft?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestResult {
  id: number;
  /** Nombre de la prueba psicológica */
  name: string;
  /** Puntuación o resultado cuantitativo */
  score?: string;
  /** Fecha de aplicación de la prueba */
  testDate?: Date;
  /** Interpretación clínica de los resultados */
  interpretation?: string;
  /** Detalles estructurados de los resultados */
  resultDetails?: Record<string, unknown>;
  patientId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClinicalQuery {
  id: number;
  question: string;
  answer?: string;
  /** Respuesta estructurada en formato JSON */
  responseJson?: Record<string, unknown>;
  /** Nivel de confianza de la respuesta (0-1) */
  confidenceScore?: number;
  /** Referencias clínicas utilizadas */
  references?: Record<string, unknown>;
  isFavorite: boolean;
  tags?: Array<unknown>;
  /** Calificación de la respuesta (1-5) */
  feedbackRating?: number;
  /** Comentario de retroalimentación */
  feedbackComment?: string;
  /** Etiquetas de retroalimentación (útil, precisa, etc.) */
  feedbackTags?: Array<unknown>;
  /** Indica si se ha proporcionado retroalimentación */
  hasFeedback: boolean;
  patientId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

