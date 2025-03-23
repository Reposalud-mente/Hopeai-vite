import OpenAI from 'openai';
import { Patient } from '../models/patient';
import { ClinicalQuery } from '../models/clinicalQuery';
import { ClinicalReference } from '../../src/types/ClinicalQuery';
import { buildEnrichedPatientContext, contextToText } from '../ai/contextBuilder';

/**
 * Interfaz para respuestas IA
 */
interface AIResponse {
  mainAnswer: string;
  reasoning: string;
  confidenceScore: number;
  references: ClinicalReference[];
  suggestedQuestions?: string[];
  diagnosticConsiderations?: string[];
  treatmentSuggestions?: string[];
}

// Modelado de datos (usado en typescript para documentación)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TestResult {
  name: string;
  score?: string | number;
  interpretation?: string;
  getDataValue: (key: string) => string | number | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PatientQueryData {
  id: number;
  question: string;
  answer: string;
  createdAt: Date;
  getDataValue: (key: string) => string | number | Date | boolean | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PatientData {
  name?: string;
  age?: number | string;
  consultReason?: string;
  testResults?: TestResult[];
  evaluationDraft?: string;
  clinicalQueries?: PatientQueryData[];
  getDataValue: (key: string) => string | number | Date | boolean | TestResult[] | PatientQueryData[] | undefined;
}

/**
 * Servicio para procesar consultas clínicas interactivas
 */
export class ClinicalQueryService {
  private openai: OpenAI;

  constructor() {
    // Inicializar cliente de OpenAI compatible con DeepSeek
    this.openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    });
  }

  /**
   * Procesa una consulta clínica y obtiene respuesta de la IA
   */
  async processQuery(queryId: number): Promise<typeof ClinicalQuery.prototype | null> {
    let query: typeof ClinicalQuery.prototype | null = null;
    
    try {
      // Obtener la consulta
      query = await ClinicalQuery.findByPk(queryId);
      if (!query) {
        throw new Error(`Consulta con ID ${queryId} no encontrada`);
      }

      // Obtener el paciente
      const patientId = query.getDataValue('patientId') as string;
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        throw new Error(`Paciente no encontrado para la consulta ${queryId}`);
      }

      // Construir contexto enriquecido del paciente
      const enrichedContext = await buildEnrichedPatientContext(patientId);
      const patientContext = contextToText(enrichedContext);

      // Enviar consulta a la IA
      const aiResponse = await this.sendToAI(query.getDataValue('question') as string, patientContext);

      // Actualizar la consulta con la respuesta
      await query.update({
        answer: aiResponse.mainAnswer,
        responseJson: aiResponse,
        confidenceScore: aiResponse.confidenceScore,
        references: aiResponse.references
      });

      return query;
    } catch (error) {
      console.error('Error al procesar consulta clínica:', error);
      
      // Si hay una consulta válida, actualizar con respuesta de error
      if (query) {
        await query.update({
          answer: 'No se pudo procesar la consulta. Por favor, inténtelo de nuevo más tarde.',
          responseJson: {
            mainAnswer: 'Error al procesar la consulta',
            reasoning: 'Se produjo un error durante el procesamiento',
            confidenceScore: 0,
            references: []
          },
          confidenceScore: 0
        });
      }
      
      return null;
    }
  }

  /**
   * Método legado para compatibilidad - Procesa una consulta con el método original
   * Útil como fallback si el nuevo flujo falla
   */
  async processQueryLegacy(queryId: number): Promise<typeof ClinicalQuery.prototype | null> {
    try {
      // Obtener la consulta
      const query = await ClinicalQuery.findByPk(queryId);
      if (!query) {
        throw new Error(`Consulta con ID ${queryId} no encontrada`);
      }

      // Obtener el paciente
      const patient = await Patient.findByPk(query.getDataValue('patientId'), {
        include: [{ model: ClinicalQuery, as: 'clinicalQueries' }]
      });
      if (!patient) {
        throw new Error(`Paciente no encontrado para la consulta ${queryId}`);
      }

      // Construir contexto del paciente
      const patientContext = this.buildPatientContext(patient, queryId);

      // Enviar consulta a la IA
      const aiResponse = await this.sendToAI(query.getDataValue('question'), patientContext);

      // Actualizar la consulta con la respuesta
      await query.update({
        answer: aiResponse.mainAnswer,
        responseJson: aiResponse,
        confidenceScore: aiResponse.confidenceScore,
        references: aiResponse.references
      });

      return query;
    } catch (error) {
      console.error('Error al procesar consulta clínica (método legado):', error);
      return null;
    }
  }

  /**
   * Construye el contexto del paciente para la IA (método legado)
   * @param patient Objeto de paciente con datos y métodos getDataValue
   * @param queryId ID opcional de la consulta actual para excluirla del historial
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildPatientContext(patient: any, queryId?: number): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let context = `
Nombre: ${patient.getDataValue('name') || 'No especificado'}
Edad: ${patient.getDataValue('age') || 'No especificada'}
Motivo de consulta: ${patient.getDataValue('consultReason') || 'No especificado'}
`;

    // Añadir resultados de pruebas si existen
    const testResults = patient.getDataValue('testResults');
    if (testResults && Array.isArray(testResults) && testResults.length > 0) {
      context += '\nResultados de evaluaciones:\n';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      testResults.forEach((test: any) => {
        context += `- ${test.getDataValue('name')}: ${test.getDataValue('score') || 'N/A'} (${test.getDataValue('interpretation') || 'Sin interpretación'})\n`;
      });
    }

    // Añadir borrador de evaluación si existe
    if (patient.getDataValue('evaluationDraft')) {
      context += `\nNotas de evaluación:\n${patient.getDataValue('evaluationDraft')}\n`;
    }

    // Añadir historial de consultas previas (máximo 3)
    const clinicalQueries = patient.getDataValue('clinicalQueries');
    if (clinicalQueries && Array.isArray(clinicalQueries) && clinicalQueries.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previousQueries = clinicalQueries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q.getDataValue('answer') && q.getDataValue('id') !== queryId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => {
          const dateA = new Date(a.getDataValue('createdAt'));
          const dateB = new Date(b.getDataValue('createdAt'));
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 3);

      if (previousQueries.length > 0) {
        context += '\nConsultas clínicas previas:\n';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        previousQueries.forEach((q: any) => {
          context += `- Pregunta: ${q.getDataValue('question')}\n`;
          context += `  Respuesta: ${q.getDataValue('answer').substring(0, 150)}...\n`;
        });
      }
    }

    return context;
  }

  /**
   * Envía la consulta a la IA y procesa la respuesta
   */
  private async sendToAI(question: string, patientContext: string): Promise<AIResponse> {
    const systemPrompt = `Eres un asistente de IA especializado en psicología clínica que ayuda a profesionales de salud mental.
Tus respuestas deben:
1. Basarse en evidencia científica y criterios diagnósticos DSM-5/CIE-11
2. Ser claras, objetivas y sin juicios de valor
3. Incluir fundamentación clínica con referencias explícitas
4. Mantener un lenguaje profesional pero accesible
5. Reconocer limitaciones cuando la información es insuficiente
6. NUNCA sugerir diagnósticos definitivos, solo consideraciones diagnósticas
7. Mantener un enfoque ético centrado en el bienestar del paciente

IMPORTANTE: Siempre aclara que tus respuestas son orientativas y no reemplazan el juicio clínico profesional.`;

    const userPrompt = `
CONTEXTO DEL PACIENTE:
${patientContext}

CONSULTA DEL PROFESIONAL:
${question}

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

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Extraer el JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo obtener una respuesta estructurada de la IA');
      }

      // Parsear el JSON
      const parsedResponse = JSON.parse(jsonMatch[0]) as AIResponse;
      
      // Validar campos requeridos
      if (!parsedResponse.mainAnswer || !parsedResponse.reasoning || parsedResponse.confidenceScore === undefined) {
        throw new Error('Respuesta de IA incompleta o mal formateada');
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error al procesar respuesta de IA:', error);
      throw error;
    }
  }
} 