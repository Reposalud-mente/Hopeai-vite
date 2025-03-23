/**
 * Tipos para el dominio clínico de HopeAI
 * Este archivo contiene las interfaces para pacientes y datos clínicos
 */

import { ReactNode } from 'react';
import { Recommendation } from './ai-types';

// Actualizamos para exportar solo lo que no se define en este archivo
export { Recommendation };

/**
 * Estructura de datos de paciente
 */
export interface Patient {
  id: string | number;
  name: string;
  status: string;
  birthDate?: string;
  age?: number;
  gender?: string;
  evaluationDate?: string;
  psychologist?: string;
  consultReason?: string;
  evaluationDraft?: string;
  clinicalHistory?: string;
  familyHistory?: string;
  medicalHistory?: string;
  testResults?: TestResult[];
  diagnoses?: Diagnosis[];
}

/**
 * Estructura para resultados de tests psicológicos
 */
export interface TestResult {
  name: string;
  date?: string;
  results: TestScore[];
}

/**
 * Estructura para puntuaciones de tests
 */
export interface TestScore {
  scale: string;
  score: number;
  interpretation?: string;
  percentile?: number;
}

/**
 * Estructura para evaluación clínica
 */
export interface ClinicalEvaluation {
  id: number;
  patientId: number;
  date: string;
  psychologist: string;
  content: string;
  diagnoses: Diagnosis[];
  recommendations: Recommendation[];
}

/**
 * Estructura para estado de análisis clínico
 */
export interface ClinicalAnalysisState {
  thoughtChain: ThoughtStep[];
  patientData: Patient;
  currentStep: number;
  isComplete: boolean;
  lastUpdated: string;
  diagnoses: Diagnosis[];
  recommendations: Recommendation[];
}

/**
 * Estructura para datos de sesión clínica
 */
export interface ClinicalSession {
  id: number;
  patientId: number;
  date: string;
  psychologist: string;
  notes: string;
  treatmentPlan?: string;
  progress?: string;
  nextSessionGoals?: string;
}

/**
 * Estructura para historial de mensajes de análisis
 */
export interface AnalysisMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Estructura para un reporte clínico completo
 */
export interface ClinicalReport {
  patientInfo: Patient;
  evaluationSummary: string;
  testResultsSummary: string;
  diagnosisSummary: string;
  recommendationsSection: string;
  createdAt: string;
  psychologist: string;
}

/**
 * Representa un paso en el proceso de análisis clínico con su estado
 * @interface ThoughtStep
 * @property {string} title - Título del paso de razonamiento
 * @property {string} description - Descripción detallada del paso
 * @property {'wait' | 'processing' | 'finish' | 'error'} status - Estado actual de este paso
 * @property {React.ReactNode | null} [icon] - Icono opcional para representar visualmente el paso
 */
export interface ThoughtStep {
  title: string;
  description: string;
  status: 'wait' | 'processing' | 'finish' | 'error';
  icon?: ReactNode | null;
}

/**
 * Representa un diagnóstico sugerido por el sistema de IA
 * @interface Diagnosis
 * @property {string} name - Nombre del diagnóstico (basado en DSM-5/CIE-11)
 * @property {string} description - Descripción clínica del diagnóstico
 * @property {string} confidence - Nivel de confianza del diagnóstico (bajo, medio, alto)
 */
export interface Diagnosis {
  name: string;
  description: string;
  confidence: string;
}

/**
 * Representa un mensaje en la conversación clínica
 * @interface ChatMessage
 * @property {'user' | 'assistant'} type - Origen del mensaje (usuario o asistente)
 * @property {string} content - Contenido del mensaje
 */
export interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
}

/**
 * Utilitario para convertir un estado de análisis al formato interno del componente
 * @param status - Estado original del análisis
 * @returns Estado compatible con el componente
 */
export const mapStatusToComponent = (status: string): 'wait' | 'processing' | 'finish' | 'error' => {
  if (status === 'error') return 'error';
  if (status === 'processing' || status === 'pending') return 'processing';
  if (status === 'finish' || status === 'completed') return 'finish';
  return 'wait';
};

/**
 * Estado de la operación de análisis clínico
 */
export type ClinicalAnalysisStatus = 
  | 'idle'        // Sin iniciar
  | 'processing'  // En proceso
  | 'completed'   // Completado con éxito
  | 'error';      // Error durante el proceso

/**
 * Resultado de tratamiento sugerido para un paciente
 */
export interface TreatmentSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'tratamiento' | 'seguimiento' | 'estudio';
  priority: 'alta' | 'media' | 'baja';
} 