import { Patient } from '../models/patient';
import { ClinicalQuery } from '../models/clinicalQuery';
import { TestResult } from '../models/testResult';

/**
 * Interfaz para datos estructurados de paciente
 */
export interface StructuredPatientData {
  demographics: {
    name?: string;
    age?: number | string;
    gender?: string;
    occupation?: string;
  };
  clinicalInfo: {
    consultReason?: string;
    relevantHistory?: string;
    medications?: string[];
    previousDiagnosis?: string[];
  };
  testResults?: Array<{
    name: string;
    score?: string | number;
    date?: string;
    interpretation?: string;
    details?: Record<string, unknown>;
  }>;
  evaluationNotes?: string;
  previousQueries?: Array<{
    question: string;
    answer: string;
    date: string;
    confidenceScore?: number;
  }>;
  [key: string]: unknown;
}

/**
 * Construye un contexto enriquecido del paciente para análisis clínico
 * @param patient Objeto del paciente con datos relacionados
 * @returns Objeto estructurado con datos relevantes del paciente
 */
export async function buildEnrichedPatientContext(patientId: string): Promise<StructuredPatientData> {
  try {
    // Obtener paciente con datos relacionados
    const patient = await Patient.findByPk(patientId, {
      include: [
        { model: ClinicalQuery, as: 'clinicalQueries' },
        { model: TestResult, as: 'testResults' }
      ]
    });

    if (!patient) {
      throw new Error(`Paciente con ID ${patientId} no encontrado`);
    }

    // Construir contexto estructurado
    const structuredContext: StructuredPatientData = {
      demographics: {
        name: patient.getDataValue('name'),
        age: patient.getDataValue('age'),
        gender: patient.getDataValue('gender'),
        occupation: patient.getDataValue('occupation')
      },
      clinicalInfo: {
        consultReason: patient.getDataValue('consultReason'),
        relevantHistory: patient.getDataValue('clinicalHistory'),
        medications: patient.getDataValue('medications') || [],
        previousDiagnosis: patient.getDataValue('previousDiagnosis') || []
      },
      evaluationNotes: patient.getDataValue('evaluationDraft')
    };

    // Añadir resultados de pruebas si existen
    const testResults = patient.getDataValue('testResults');
    if (testResults && Array.isArray(testResults) && testResults.length > 0) {
      structuredContext.testResults = testResults.map(test => ({
        name: test.getDataValue('name'),
        score: test.getDataValue('score'),
        date: test.getDataValue('testDate') ? new Date(test.getDataValue('testDate')).toISOString().split('T')[0] : undefined,
        interpretation: test.getDataValue('interpretation'),
        details: test.getDataValue('resultDetails') || {}
      }));
    }

    // Añadir consultas previas si existen (máximo 5, ordenadas por fecha)
    const clinicalQueries = patient.getDataValue('clinicalQueries');
    if (clinicalQueries && Array.isArray(clinicalQueries) && clinicalQueries.length > 0) {
      structuredContext.previousQueries = clinicalQueries
        .filter(query => query.getDataValue('answer'))
        .sort((a, b) => 
          new Date(b.getDataValue('createdAt')).getTime() - 
          new Date(a.getDataValue('createdAt')).getTime()
        )
        .slice(0, 5)
        .map(query => ({
          question: query.getDataValue('question'),
          answer: query.getDataValue('answer'),
          date: new Date(query.getDataValue('createdAt')).toISOString().split('T')[0],
          confidenceScore: query.getDataValue('confidenceScore')
        }));
    }

    return structuredContext;
  } catch (error) {
    console.error('Error al construir contexto enriquecido del paciente:', error);
    // Devolver contexto mínimo para evitar fallos
    return {
      demographics: {},
      clinicalInfo: {}
    };
  }
}

/**
 * Convierte el contexto estructurado a texto plano para prompts
 * @param context Contexto estructurado del paciente
 * @returns Texto formateado para uso en prompts
 */
export function contextToText(context: StructuredPatientData): string {
  let text = '';
  
  // Datos demográficos
  text += '### DATOS DEMOGRÁFICOS ###\n';
  if (context.demographics.name) text += `Nombre: ${context.demographics.name}\n`;
  if (context.demographics.age) text += `Edad: ${context.demographics.age}\n`;
  if (context.demographics.gender) text += `Género: ${context.demographics.gender}\n`;
  if (context.demographics.occupation) text += `Ocupación: ${context.demographics.occupation}\n`;
  
  // Información clínica
  text += '\n### INFORMACIÓN CLÍNICA ###\n';
  if (context.clinicalInfo.consultReason) text += `Motivo de consulta: ${context.clinicalInfo.consultReason}\n`;
  if (context.clinicalInfo.relevantHistory) text += `Historia relevante: ${context.clinicalInfo.relevantHistory}\n`;
  
  if (context.clinicalInfo.medications && context.clinicalInfo.medications.length > 0) {
    text += 'Medicación actual:\n';
    context.clinicalInfo.medications.forEach(med => text += `- ${med}\n`);
  }
  
  if (context.clinicalInfo.previousDiagnosis && context.clinicalInfo.previousDiagnosis.length > 0) {
    text += 'Diagnósticos previos:\n';
    context.clinicalInfo.previousDiagnosis.forEach(diag => text += `- ${diag}\n`);
  }
  
  // Resultados de pruebas
  if (context.testResults && context.testResults.length > 0) {
    text += '\n### RESULTADOS DE EVALUACIONES ###\n';
    context.testResults.forEach(test => {
      text += `Prueba: ${test.name}\n`;
      if (test.score !== undefined) text += `Puntuación: ${test.score}\n`;
      if (test.date) text += `Fecha: ${test.date}\n`;
      if (test.interpretation) text += `Interpretación: ${test.interpretation}\n`;
      text += '\n';
    });
  }
  
  // Notas de evaluación
  if (context.evaluationNotes) {
    text += '\n### NOTAS DE EVALUACIÓN ###\n';
    text += `${context.evaluationNotes}\n`;
  }
  
  // Consultas previas
  if (context.previousQueries && context.previousQueries.length > 0) {
    text += '\n### CONSULTAS CLÍNICAS PREVIAS ###\n';
    context.previousQueries.forEach(query => {
      text += `Fecha: ${query.date}\n`;
      text += `Pregunta: ${query.question}\n`;
      text += `Respuesta: ${query.answer.substring(0, 200)}...\n\n`;
    });
  }
  
  return text;
} 