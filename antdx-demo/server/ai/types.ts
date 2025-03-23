/**
 * Tipos para el módulo de análisis clínico interactivo
 */

// Tipos para análisis de datos del paciente
export interface PatientAnalysis {
  keyClinicalObservations: string[];
  potentialClinicalPatterns: string[];
  missingInformation: string[];
  riskFactors: string[];
  protectiveFactors: string[];
}

// Tipos para el sistema de análisis clínico interactivo

// Tipo para los datos de contexto del paciente
export interface PatientContextData {
  patientId: string;
  demographics: {
    name: string;
    age: number;
    gender: string;
    occupation?: string;
  };
  medicalHistory: {
    diagnoses?: string[];
    medications?: string[];
    allergies?: string[];
    familyHistory?: string[];
  };
  psychologicalData: {
    presentingProblems: string[];
    symptoms: string[];
    testResults?: Array<{
      testName: string;
      date: string;
      scores: Record<string, number | string>;
      interpretation?: string;
    }>;
    previousTreatments?: string[];
  };
  clinicalNotes?: string[];
  previousQueries?: Array<{
    question: string;
    answer: string;
    date: string;
  }>;
}

// Tipos para consideraciones diagnósticas
export interface DiagnosticConsideration {
  diagnosis: string;
  code?: string;
  confidence: number;
  supportingEvidence: string[];
  differentialDiagnoses?: string[];
}

export interface DiagnosticAnalysis {
  diagnosticConsiderations: DiagnosticConsideration[];
  differentialDiagnosis: string[];
}

// Tipos para recomendaciones de tratamiento
export interface TreatmentApproach {
  approach: string;
  evidenceLevel: string;
  description: string;
  expectedBenefits: string[];
  reference: string;
}

export interface MedicationConsideration {
  category: string;
  considerations: string;
  referralRecommendation: string;
}

export interface TreatmentRecommendation {
  approach: string;
  description: string;
  evidenceLevel: 'alto' | 'moderado' | 'bajo';
  expectedOutcomes: string[];
  timeframe?: string;
  considerations?: string[];
}

export interface TreatmentRecommendations {
  treatmentApproaches: TreatmentApproach[];
  medicationConsiderations: MedicationConsideration[];
  psychoeducation: string[];
  followUpRecommendations: string;
}

// Tipo para análisis completo
export interface FullAnalysis {
  patientAnalysis: PatientAnalysis;
  diagnosticAnalysis: DiagnosticAnalysis;
  treatmentRecommendations: TreatmentRecommendations;
}

// Tipos para la respuesta clínica completa
export interface ClinicalResponse {
  mainAnswer: string;
  reasoning: string;
  confidenceScore: number;
  references: Array<{
    source: string;
    citation: string;
    url?: string;
  }>;
  diagnosticConsiderations?: DiagnosticConsideration[];
  treatmentRecommendations?: TreatmentRecommendation[];
  suggestedQuestions?: string[];
}

// Tipo para los resultados de cada paso del análisis
export interface AnalysisStepResult {
  success: boolean;
  step: string;
  data?: string | DiagnosticConsideration[] | TreatmentRecommendation[] | ClinicalResponse;
  error?: string;
}

// Tipo para la función de streaming que procesa fragmentos de respuesta
export interface StreamChunkProcessor {
  (chunk: string): void;
}

// Tipo para el formato de mensaje en el sistema de chat
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Tipo para eventos de progreso durante el procesamiento
export interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
}

// Tipo para respuesta con error
export interface ErrorResponse {
  error: string;
  code: string;
  suggestion?: string;
} 