/**
 * Plantillas de prompts para análisis clínico
 * 
 * Este módulo proporciona plantillas de prompts para diferentes escenarios
 * de análisis clínico utilizando la API de DeepSeek.
 */

/**
 * Prompt de sistema para el análisis clínico general
 */
export const CLINICAL_ANALYSIS_SYSTEM_PROMPT = `
Eres un psicólogo clínico especializado que proporciona análisis en formato JSON.
Debes analizar los datos del paciente y proporcionar un análisis profesional.
Tu respuesta DEBE ser un objeto JSON válido con la estructura específica que se indica a continuación.
`;

/**
 * Prompt de usuario para el análisis clínico general
 * @param {string} patientData - Datos del paciente para analizar
 * @returns {string} - Prompt completo para el análisis
 */
export function getClinicalAnalysisUserPrompt(patientData: string): string {
  return `
Analiza los siguientes datos de paciente:

DATOS DEL PACIENTE:
${patientData}

Tu respuesta debe ser un objeto JSON con exactamente las siguientes propiedades:
{
  "thoughtChain": [
    {"title": "string", "description": "string", "status": "string"}
  ],
  "diagnoses": [
    {"name": "string", "description": "string", "confidence": "string"}
  ],
  "recommendations": [
    {"title": "string", "description": "string"}
  ]
}
`;
}

/**
 * Prompt de sistema para consultas específicas sobre un paciente
 */
export const CLINICAL_CHAT_SYSTEM_PROMPT = `
Eres un asistente de psicología clínica especializado en proporcionar respuestas profesionales.
Utiliza un tono profesional pero accesible, basando tus respuestas en evidencia científica.
Evita especulaciones y aclara cuando no hay suficientes datos para una conclusión definitiva.
`;

/**
 * Prompt de usuario para consultas específicas sobre un paciente
 * @param {string} question - Pregunta del usuario
 * @param {string} patientData - Datos del paciente
 * @param {Object} analysisState - Estado actual del análisis clínico (opcional)
 * @returns {string} - Prompt completo para la consulta
 */
export function getClinicalChatUserPrompt(
  question: string, 
  patientData: string,
  analysisState?: {
    symptoms?: string[];
    possibleDiagnoses?: string[];
    treatmentSuggestions?: string[];
  }
): string {
  // Si tenemos estado de análisis, lo incluimos en el contexto
  const analysisContext = analysisState ? `
ANÁLISIS PREVIO:
${analysisState.symptoms?.length ? `Síntomas identificados:\n${analysisState.symptoms.join('\n')}` : ''}
${analysisState.possibleDiagnoses?.length ? `Posibles diagnósticos:\n${analysisState.possibleDiagnoses.join('\n')}` : ''}
${analysisState.treatmentSuggestions?.length ? `Sugerencias de tratamiento:\n${analysisState.treatmentSuggestions.join('\n')}` : ''}
` : '';

  return `
DATOS DEL PACIENTE:
${patientData}

${analysisContext}

CONSULTA: ${question}

Proporciona una respuesta detallada basada en la información disponible sobre el paciente.
`;
}

/**
 * Prompt de sistema para generar reportes clínicos
 */
export const CLINICAL_REPORT_SYSTEM_PROMPT = `
Eres un psicólogo clínico que genera informes profesionales.
Tu tarea es generar un informe clínico estructurado basado en los datos del paciente.
El informe debe seguir un formato profesional y utilizar terminología clínica adecuada.
`;

/**
 * Prompt de usuario para generar reportes clínicos
 * @param {string} patientData - Datos del paciente
 * @param {Object} diagnosis - Diagnóstico seleccionado (opcional)
 * @returns {string} - Prompt completo para el reporte
 */
export function getClinicalReportUserPrompt(
  patientData: string,
  diagnosis?: {
    name: string;
    description?: string;
  }
): string {
  const diagnosisContext = diagnosis ? `
DIAGNÓSTICO SELECCIONADO:
${diagnosis.name}
${diagnosis.description || ''}
` : '';

  return `
DATOS DEL PACIENTE:
${patientData}

${diagnosisContext}

Genera un informe clínico completo con las siguientes secciones:
1. Datos de identificación
2. Motivo de consulta
3. Historia clínica relevante
4. Evaluación psicológica
5. Impresión diagnóstica
6. Plan de tratamiento
7. Pronóstico

El informe debe ser profesional y presentarse en formato de texto estructurado.
`;
}

/**
 * Configuración recomendada para diferentes tipos de solicitudes
 */
export const AIRequestConfig = {
  clinicalAnalysis: {
    temperature: 0.2,
    response_format: { type: "json_object" }
  },
  clinicalChat: {
    temperature: 0.3
  },
  clinicalReport: {
    temperature: 0.4
  }
}; 