// Plantillas para prompts clínicos estructurados que se utilizarán con la API de DeepSeek

/**
 * Sistema base para consultas clínicas
 * Define el rol y comportamiento del asistente para análisis clínicos
 */
export const CLINICAL_SYSTEM_PROMPT = `Eres un asistente de IA especializado en psicología clínica que ayuda a profesionales de salud mental.
Tus respuestas deben:
1. Basarse en evidencia científica y criterios diagnósticos DSM-5/CIE-11
2. Ser claras, objetivas y sin juicios de valor
3. Incluir fundamentación clínica con referencias explícitas
4. Mantener un lenguaje profesional pero accesible
5. Reconocer limitaciones cuando la información es insuficiente
6. NUNCA sugerir diagnósticos definitivos, solo consideraciones diagnósticas
7. Mantener un enfoque ético centrado en el bienestar del paciente

IMPORTANTE: Siempre aclara que tus respuestas son orientativas y no reemplazan el juicio clínico profesional.`;

/**
 * Plantilla para análisis de caso
 * Utiliza la información del paciente para contextualizar la consulta
 */
export const CASE_ANALYSIS_TEMPLATE = (patientContext: string, query: string) => {
  return `
CONTEXTO DEL PACIENTE:
${patientContext}

CONSULTA DEL PROFESIONAL:
${query}

Responde a la consulta basándote en el contexto proporcionado. 
Estructura tu respuesta en formato JSON con los siguientes campos:
{
  "mainAnswer": "Respuesta principal a la consulta",
  "reasoning": "Explicación del razonamiento clínico aplicado",
  "confidenceScore": 0.X, // Nivel de confianza entre 0 y 1
  "references": [
    {
      "source": "Nombre de la fuente (DSM-5, estudio, etc.)",
      "citation": "Texto específico de la referencia"
    }
  ],
  "suggestedQuestions": ["Pregunta 1", "Pregunta 2"], // Opcional
  "diagnosticConsiderations": ["Consideración 1", "Consideración 2"], // Opcional
  "treatmentSuggestions": ["Sugerencia 1", "Sugerencia 2"] // Opcional
}`;
};

/**
 * Plantilla para analizar síntomas específicos
 */
export const SYMPTOM_ANALYSIS_TEMPLATE = (symptoms: string[], patientContext: string) => {
  const symptomsList = symptoms.map(s => `- ${s}`).join('\n');
  
  return `
SÍNTOMAS A ANALIZAR:
${symptomsList}

CONTEXTO DEL PACIENTE:
${patientContext}

Analiza los síntomas presentados en el contexto del paciente.
Estructura tu respuesta en formato JSON con los siguientes campos:
{
  "mainAnswer": "Análisis general de los síntomas",
  "reasoning": "Explicación de la relación entre síntomas y posibles causas",
  "confidenceScore": 0.X, // Nivel de confianza entre a 0 y 1
  "references": [
    {
      "source": "Nombre de la fuente",
      "citation": "Texto específico de la referencia"
    }
  ],
  "diagnosticConsiderations": ["Consideración 1", "Consideración 2"],
  "recommendedAssessments": ["Evaluación recomendada 1", "Evaluación recomendada 2"]
}`;
};

/**
 * Plantilla para consulta sobre tratamientos
 */
export const TREATMENT_INQUIRY_TEMPLATE = (condition: string, patientContext: string) => {
  return `
CONDICIÓN O DIAGNÓSTICO:
${condition}

CONTEXTO DEL PACIENTE:
${patientContext}

Proporciona información sobre posibles tratamientos para la condición especificada, considerando el contexto del paciente.
Estructura tu respuesta en formato JSON con los siguientes campos:
{
  "mainAnswer": "Respuesta principal sobre tratamientos",
  "reasoning": "Justificación de los tratamientos sugeridos",
  "confidenceScore": 0.X, // Nivel de confianza entre 0 y 1
  "references": [
    {
      "source": "Nombre de la fuente",
      "citation": "Texto específico de la referencia"
    }
  ],
  "treatmentOptions": [
    {
      "name": "Nombre del tratamiento",
      "description": "Breve descripción",
      "evidenceLevel": "Nivel de evidencia (Alto, Moderado, Bajo)"
    }
  ],
  "considerations": ["Consideración importante 1", "Consideración importante 2"]
}`;
};

/**
 * Función para extraer información relevante del paciente
 * @param patientData Datos completos del paciente
 * @returns Contexto resumido relevante para análisis clínico
 */
export const buildPatientContext = (patientData: any): string => {
  if (!patientData) return 'No hay información disponible del paciente.';

  let context = `
Nombre: ${patientData.name || 'No especificado'}
Edad: ${patientData.age || 'No especificada'}
Motivo de consulta: ${patientData.consultReason || 'No especificado'}
`;

  // Añadir resultados de pruebas si existen
  if (patientData.testResults && patientData.testResults.length > 0) {
    context += '\nResultados de evaluaciones:\n';
    patientData.testResults.forEach((test: any) => {
      context += `- ${test.name}: ${test.score || 'N/A'} (${test.interpretation || 'Sin interpretación'})\n`;
    });
  }

  // Añadir borrador de evaluación si existe
  if (patientData.evaluationDraft) {
    context += `\nNotas de evaluación:\n${patientData.evaluationDraft}\n`;
  }

  return context;
}; 