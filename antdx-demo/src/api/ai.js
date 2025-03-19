/**
 * API de integración con DeepSeek para análisis clínico
 * 
 * Este módulo proporciona funciones para interactuar con la API de DeepSeek
 * utilizando el formato compatible con OpenAI.
 */

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
 * @param {Object} data - Los datos para enviar a la API
 * @returns {Promise<Object>} - La respuesta de la API
 */
async function callDeepseekAPI(endpoint, data) {
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
 * Analiza los datos del paciente para generar diagnósticos y recomendaciones
 * @param {string} patientData - Los datos completos del paciente
 * @returns {Promise<Object>} - Análisis completo del paciente
 */
export async function deepseekAnalyzePatient(patientData) {
  const systemPrompt = `
Eres un psicólogo clínico especializado que proporciona análisis en formato JSON.
Debes analizar los datos del paciente y proporcionar un análisis profesional.
Tu respuesta DEBE ser un objeto JSON válido con la estructura específica que se indica a continuación.
`;

  const userPrompt = `
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

  try {
    const response = await callDeepseekAPI('/chat/completions', {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // Extraer la respuesta JSON
    const content = response.choices[0].message.content;
    console.log("Content recibido:", content);
    
    // Parsear el JSON
    const result = JSON.parse(content);
    
    return {
      thoughtChain: result.thoughtChain || [],
      diagnoses: result.diagnoses || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("Error al procesar respuesta de análisis:", error);
    // Proporcionar datos fallback en caso de error
    return {
      thoughtChain: [
        {
          title: "Error en el análisis",
          description: `No se pudo procesar la respuesta del servicio de IA: ${error.message}`,
          status: "error"
        }
      ],
      diagnoses: [],
      recommendations: []
    };
  }
}

/**
 * Procesa una consulta específica sobre el paciente
 * @param {string} question - La pregunta del usuario
 * @param {string} patientData - Los datos del paciente
 * @param {Array} history - El historial de conversación
 * @returns {Promise<Object>} - La respuesta a la consulta
 */
export async function deepseekChatWithAI(question, patientData, history) {
  // Convertir historial a formato compatible con DeepSeek/OpenAI
  const formattedHistory = history.map(msg => ({
    role: msg.type === 'sender' ? 'user' : 'assistant',
    content: msg.content
  }));

  // Crear mensaje del sistema con contexto
  const systemMessage = `
Eres un asistente clínico especializado en psicología y psiquiatría.
Estás ayudando a un profesional de la salud mental con un paciente.

DATOS DEL PACIENTE:
${patientData}

Responde las preguntas de manera concisa y profesional basándote en los datos del paciente y el conocimiento clínico actual.
`;

  try {
    // Preparar mensajes para la API
    const messages = [
      { role: 'system', content: systemMessage },
      ...formattedHistory,
      { role: 'user', content: question }
    ];

    // Realizar la llamada a la API
    const response = await callDeepseekAPI('/chat/completions', {
      model: DEEPSEEK_MODEL,
      messages: messages,
      temperature: 0.3
    });

    // Extraer la respuesta
    const answer = response.choices[0].message.content;
    
    return {
      answer,
      // Otros datos que podrían actualizarse según la conversación
      updatedDiagnoses: null,
      updatedThoughtChain: null
    };
  } catch (error) {
    console.error("Error en chat con IA:", error);
    return {
      answer: `Lo siento, no pude procesar tu pregunta. Error: ${error.message}`,
      updatedDiagnoses: null,
      updatedThoughtChain: null
    };
  }
} 