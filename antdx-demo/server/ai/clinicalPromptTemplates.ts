/**
 * Templates para prompts de análisis clínico
 * Proporcionan estructura consistente para interacciones con IA
 */

/**
 * Template para instrucciones del sistema en análisis clínico
 */
export const CLINICAL_SYSTEM_PROMPT = `Eres un asistente de IA especializado en psicología clínica que ayuda a profesionales de salud mental.

Tus respuestas deben:
1. Basarse en evidencia científica actualizada y criterios diagnósticos DSM-5/CIE-11
2. Ser claras, objetivas y sin juicios de valor
3. Incluir fundamentación clínica con referencias explícitas
4. Mantener un lenguaje profesional pero accesible
5. Reconocer las limitaciones cuando la información es insuficiente
6. NUNCA sugerir diagnósticos definitivos, solo consideraciones diagnósticas
7. Mantener un enfoque ético centrado en el bienestar del paciente

Proceso de razonamiento:
- Analiza primero la información del paciente de forma objetiva
- Conecta los síntomas y signos con criterios diagnósticos establecidos
- Considera diagnósticos diferenciales
- Identifica factores predisponentes, precipitantes y mantenedores
- Evalúa severidad, impacto funcional y pronóstico
- Sugiere enfoques terapéuticos basados en evidencia

IMPORTANTE: 
- Siempre aclara que tus respuestas son orientativas y no reemplazan el juicio clínico profesional
- Mantén la confidencialidad y privacidad del paciente
- Destaca cualquier señal de riesgo (suicidio, autolesiones, violencia) que requiera atención inmediata`;

/**
 * Template para paso de análisis de datos del paciente
 */
export const ANALYZE_PATIENT_DATA_PROMPT = `
CONTEXTO DEL PACIENTE:
{{patientContext}}

Analiza cuidadosamente la información proporcionada sobre el paciente.
Identifica:
1. Datos demográficos relevantes
2. Síntomas y signos principales
3. Resultados de evaluaciones psicométricas
4. Evolución temporal de la sintomatología
5. Factores de riesgo y protectores
6. Información faltante que sería importante obtener

Estructura tu análisis en formato JSON con los siguientes campos:
{
  "keyClinicalObservations": ["Observación 1", "Observación 2"...],
  "potentialClinicalPatterns": ["Patrón 1", "Patrón 2"...],
  "missingInformation": ["Información 1", "Información 2"...],
  "riskFactors": ["Factor 1", "Factor 2"...],
  "protectiveFactors": ["Factor 1", "Factor 2"...]
}`;

/**
 * Template para paso de consideraciones diagnósticas
 */
export const DIAGNOSTIC_CONSIDERATIONS_PROMPT = `
CONTEXTO DEL PACIENTE:
{{patientContext}}

ANÁLISIS CLÍNICO PREVIO:
{{previousAnalysis}}

CONSULTA DEL PROFESIONAL:
{{query}}

Basándote en la información proporcionada y tu análisis previo, evalúa posibles consideraciones diagnósticas según criterios DSM-5/CIE-11.

Para cada consideración diagnóstica:
1. Identifica los criterios cumplidos
2. Señala los criterios no cumplidos o información insuficiente
3. Calcula un nivel de confianza aproximado (0-100%)
4. Incluye referencias específicas a los criterios diagnósticos

Estructura tu respuesta en formato JSON:
{
  "diagnosticConsiderations": [
    {
      "diagnosis": "Nombre del diagnóstico",
      "code": "Código DSM-5/CIE-11",
      "criteriaPresent": ["Criterio 1", "Criterio 2"...],
      "criteriaMissing": ["Criterio 1", "Criterio 2"...],
      "confidenceLevel": 70,
      "reasoning": "Breve explicación del razonamiento",
      "reference": "Referencia específica a los criterios (DSM-5 p.XX)"
    }
  ],
  "differentialDiagnosis": [
    "Diagnóstico diferencial 1",
    "Diagnóstico diferencial 2"
  ]
}`;

/**
 * Template para paso de tratamiento y recomendaciones
 */
export const TREATMENT_RECOMMENDATIONS_PROMPT = `
CONTEXTO DEL PACIENTE:
{{patientContext}}

ANÁLISIS CLÍNICO PREVIO:
{{previousAnalysis}}

CONSIDERACIONES DIAGNÓSTICAS:
{{diagnosticAnalysis}}

CONSULTA DEL PROFESIONAL:
{{query}}

Basándote en toda la información previa, proporciona recomendaciones de tratamiento basadas en evidencia.

Considera:
1. Intervenciones psicoterapéuticas (con nivel de evidencia)
2. Posibles intervenciones farmacológicas a considerar (si aplica)
3. Recursos adicionales y psicoeducación
4. Seguimiento recomendado y objetivos terapéuticos

Estructura tu respuesta en formato JSON:
{
  "treatmentApproaches": [
    {
      "approach": "Nombre del enfoque",
      "evidenceLevel": "Nivel de evidencia (A, B, C)",
      "description": "Breve descripción",
      "expectedBenefits": ["Beneficio 1", "Beneficio 2"...],
      "reference": "Referencia a guía clínica o metaanálisis"
    }
  ],
  "medicationConsiderations": [
    {
      "category": "Categoría de medicación",
      "considerations": "Consideraciones importantes",
      "referralRecommendation": "Recomendación para derivación"
    }
  ],
  "psychoeducation": ["Recurso 1", "Recurso 2"...],
  "followUpRecommendations": "Recomendaciones de seguimiento"
}`;

/**
 * Template para paso final de respuesta integrada
 */
export const INTEGRATED_RESPONSE_PROMPT = `
CONSULTA DEL PROFESIONAL:
{{query}}

ANÁLISIS CLÍNICO:
{{clinicalAnalysis}}

CONSIDERACIONES DIAGNÓSTICAS:
{{diagnosticAnalysis}}

RECOMENDACIONES DE TRATAMIENTO:
{{treatmentRecommendations}}

Ahora, basándote en todo el análisis previo, genera una respuesta integrada para el profesional de salud mental. La respuesta debe ser completa, fundamentada y directamente útil para la práctica clínica.

Estructura tu respuesta final en formato JSON con los siguientes campos:
{
  "mainAnswer": "Respuesta principal completa a la consulta",
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
}

RECUERDA: Tu respuesta debe ser informativa, basada en evidencia, ética y aclarar que no reemplaza el juicio clínico profesional.`; 