import OpenAI from 'openai';
import { Patient } from '../models/patient';
import { ClinicalQuery } from '../models/clinicalQuery';
import { ClinicalReference } from '../../src/types/ClinicalQuery';

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

interface TestResult {
  name: string;
  score?: string | number;
  interpretation?: string;
}

interface PatientQueryData {
  id: number;
  question: string;
  answer: string;
  createdAt: Date;
}

interface PatientData {
  name?: string;
  age?: number | string;
  consultReason?: string;
  testResults?: TestResult[];
  evaluationDraft?: string;
  clinicalQueries?: PatientQueryData[];
  getDataValue: (key: string) => string | number | undefined;
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
      const patientContext = this.buildPatientContext(patient);

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
      console.error('Error al procesar consulta clínica:', error);
      return null;
    }
  }

  /**
   * Construye el contexto del paciente para la IA
   */
  private buildPatientContext(patient: PatientData): string {
    let context = `
Nombre: ${patient.name || 'No especificado'}
Edad: ${patient.age || 'No especificada'}
Motivo de consulta: ${patient.consultReason || 'No especificado'}
`;

    // Añadir resultados de pruebas si existen
    if (patient.testResults && patient.testResults.length > 0) {
      context += '\nResultados de evaluaciones:\n';
      patient.testResults.forEach((test: TestResult) => {
        context += `- ${test.name}: ${test.score || 'N/A'} (${test.interpretation || 'Sin interpretación'})\n`;
      });
    }

    // Añadir borrador de evaluación si existe
    if (patient.evaluationDraft) {
      context += `\nNotas de evaluación:\n${patient.evaluationDraft}\n`;
    }

    // Añadir historial de consultas previas (máximo 3)
    if (patient.clinicalQueries && patient.clinicalQueries.length > 0) {
      const previousQueries = patient.clinicalQueries
        .filter((q: PatientQueryData) => q.answer && q.id !== q.id)
        .sort((a: PatientQueryData, b: PatientQueryData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      if (previousQueries.length > 0) {
        context += '\nConsultas clínicas previas:\n';
        previousQueries.forEach((q: PatientQueryData) => {
          context += `- Pregunta: ${q.question}\n`;
          context += `  Respuesta: ${q.answer.substring(0, 150)}...\n`;
        });
      }
    }

    return context;
  }

  /**
   * Envía la consulta a la IA y procesa la respuesta
   */
  private async sendToAI(question: string, patientContext: string): Promise<AIResponse> {
    try {
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
      let parsedResponse: AIResponse;
      try {
        parsedResponse = JSON.parse(jsonMatch[0]) as AIResponse;
        
        // Validar estructura mínima
        if (!parsedResponse.mainAnswer || !parsedResponse.reasoning) {
          throw new Error('Respuesta incompleta');
        }
        
        // Asegurarse de que hay referencias
        if (!parsedResponse.references || !Array.isArray(parsedResponse.references)) {
          parsedResponse.references = [];
        }
        
        // Asegurarse de que hay un nivel de confianza
        if (typeof parsedResponse.confidenceScore !== 'number') {
          parsedResponse.confidenceScore = 0.5; // Valor predeterminado
        }
      } catch (error) {
        console.error('Error al parsear respuesta JSON:', error, 'Respuesta:', content);
        
        // Crear una respuesta de fallback
        parsedResponse = {
          mainAnswer: "No se pudo procesar la respuesta en formato estructurado. La respuesta original fue: " + content.substring(0, 500),
          reasoning: "Error al procesar el razonamiento.",
          confidenceScore: 0.3,
          references: [{
            source: "Error",
            citation: "No se pudieron extraer referencias."
          }]
        };
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error al comunicarse con la IA:', error);
      
      // Devolver respuesta de error formateada
      return {
        mainAnswer: "Lo siento, hubo un error al procesar esta consulta. Por favor, inténtelo de nuevo más tarde.",
        reasoning: "Error en la comunicación con el sistema de IA.",
        confidenceScore: 0,
        references: [{
          source: "Error del sistema",
          citation: "No se pudo obtener una respuesta del sistema de IA."
        }]
      };
    }
  }
} 