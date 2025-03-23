import OpenAI from 'openai';
import { config } from '../config';

/**
 * Adaptador para la API de DeepSeek que sigue el formato de OpenAI
 * Con soporte para respuestas normales y streaming
 */
export class DeepSeekAdapter {
  private client: OpenAI;
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = config.deepSeek.apiKey;
    this.apiUrl = config.deepSeek.apiUrl;
    this.model = config.deepSeek.model;

    // Configurar cliente de OpenAI con la URL base de DeepSeek
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.apiUrl,
    });
  }

  /**
   * Genera una respuesta de texto utilizando la API de DeepSeek
   * @param prompt El mensaje a enviar a la API
   * @returns La respuesta generada
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Eres un asistente clínico especializado en psicología y psiquiatría. Proporciona respuestas detalladas, precisas y basadas en evidencia científica.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      });

      return response.choices[0]?.message?.content || 'No se pudo generar una respuesta.';
    } catch (error) {
      console.error('Error al generar respuesta con DeepSeek:', error);
      throw new Error(`Error al generar respuesta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera una respuesta de texto con streaming utilizando la API de DeepSeek
   * @param prompt El mensaje a enviar a la API
   * @returns Un stream de la respuesta generada
   */
  async generateStreamingResponse(prompt: string): Promise<AsyncIterable<string>> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Eres un asistente clínico especializado en psicología y psiquiatría. Proporciona respuestas detalladas, precisas y basadas en evidencia científica.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2048,
        stream: true
      });

      // Convertir el stream de OpenAI en un AsyncIterable de strings para facilitar su uso
      const asyncIterator = {
        [Symbol.asyncIterator]: async function* () {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              yield content;
            }
          }
        }
      };

      return asyncIterator;
    } catch (error) {
      console.error('Error al generar respuesta streaming con DeepSeek:', error);
      throw new Error(`Error al generar respuesta streaming: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera una respuesta estructurada en JSON utilizando la API de DeepSeek
   * @param prompt El mensaje a enviar a la API
   * @returns El objeto JSON parseado de la respuesta
   */
  async generateStructuredResponse<T>(prompt: string): Promise<T> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'Eres un asistente clínico especializado en psicología y psiquiatría. Responde siempre en formato JSON válido siguiendo exactamente la estructura solicitada.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Intentar parsear la respuesta como JSON
      try {
        return JSON.parse(content) as T;
      } catch (parseError) {
        console.error('Error al parsear respuesta JSON:', parseError);
        throw new Error('La respuesta no es un JSON válido');
      }
    } catch (error) {
      console.error('Error al generar respuesta estructurada con DeepSeek:', error);
      throw new Error(`Error al generar respuesta estructurada: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
} 