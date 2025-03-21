/**
 * Tipos para el dominio clínico de HopeAI
 * Este archivo contiene las interfaces para pacientes y datos clínicos
 */

import { ThoughtStep, Diagnosis, Recommendation } from './ai-types';

// Re-exportamos los tipos importados para que sean accesibles desde este módulo
export { Diagnosis, Recommendation };

/**
 * Estructura de datos de paciente
 */
export interface Patient {
  id: number;
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