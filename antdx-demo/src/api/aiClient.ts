/**
 * Cliente para la API de DeepSeek
 * 
 * Este módulo proporciona funciones básicas para interactuar con la API de DeepSeek
 * utilizando el formato compatible con OpenAI.
 */

import { AIRequestOptions, AIResponse, ErrorProcessor } from '../types/ai-types';
import { handleAIError } from '../utils/errorHandler';

// Configuración para el cliente de DeepSeek
const DEEPSEEK_API_BASE = import.meta.env.VITE_DEEPSEEK_API_BASE || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || "deepseek-chat";

// Verificar que la API key esté configurada
if (!DEEPSEEK_API_KEY) {
  console.warn("⚠️ VITE_DEEPSEEK_API_KEY no está configurada. La integración con IA no funcionará correctamente.");
}

/**
 * Realiza una solicitud a la API de DeepSeek
 * @param {string} endpoint - El endpoint de la API
 * @param {AIRequestOptions} data - Los datos para enviar a la API
 * @returns {Promise<AIResponse>} - La respuesta de la API
 */
export async function callDeepseekAPI(endpoint: string, data: AIRequestOptions): Promise<AIResponse> {
  try {
    console.log(`Llamando a API: ${DEEPSEEK_API_BASE}${endpoint}`, data);
    
    const response = await fetch(`${DEEPSEEK_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      console.error("Error response:", errorData);
      throw new Error(`Error en API DeepSeek: ${errorData.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    console.log("API response:", responseData);
    return responseData;
  } catch (error) {
    console.error("Error al llamar a DeepSeek API:", error);
    throw error;
  }
}

/**
 * Wrapper para manejar errores en las llamadas a la API de DeepSeek
 * @param {Function} apiCall - Función que realiza la llamada a la API
 * @param {ErrorProcessor} errorProcessor - Procesador de errores opcional
 * @returns {Promise<T>} - Resultado de la función apiCall
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  errorProcessor?: ErrorProcessor
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    // Manejar el error con el sistema de errores centralizado
    handleAIError(error);
    
    // Si se proporciona un procesador de errores personalizado, usarlo
    if (errorProcessor) {
      errorProcessor(error instanceof Error ? error : new Error(String(error)));
    }
    
    // Proporcionar datos fallback o relanzar el error según sea necesario
    throw error;
  }
}

// Exportar configuración para usar en otros módulos
export const config = {
  API_BASE: DEEPSEEK_API_BASE,
  API_KEY: DEEPSEEK_API_KEY,
  MODEL: DEEPSEEK_MODEL
}; 