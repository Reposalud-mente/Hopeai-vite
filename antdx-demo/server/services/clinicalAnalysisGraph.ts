import { StateGraph, Annotation, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate, 
  SystemMessagePromptTemplate 
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración para DeepSeek
const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

// Verificar que la API key esté configurada
if (!DEEPSEEK_API_KEY) {
  console.warn("⚠️ DEEPSEEK_API_KEY no está configurada en variables de entorno. La integración con IA no funcionará correctamente.");
}

// Exportar configuración para usar en otros módulos
export const config = {
  API_BASE: DEEPSEEK_API_BASE,
  API_KEY: DEEPSEEK_API_KEY,
  MODEL: DEEPSEEK_MODEL
};

// Definir tipo para el estado
export type AnalysisState = {
  patientInfo: string;
  symptoms: string[];
  dsmAnalysis: string[];
  possibleDiagnoses: string[];
  treatmentSuggestions: string[];
  currentThinking: string;
};

// Definir tipo para el resultado de análisis clínico
export type ClinicalAnalysisResult = {
  symptoms: string[];
  dsmAnalysis: string[];
  possibleDiagnoses: string[];
  treatmentSuggestions: string[];
  currentThinking: string;
};

// Definimos el estado del grafo
const State = Annotation.Root({
  // Entrada del paciente 
  patientInfo: Annotation<string>(),
  // Resultados de la identificación de síntomas
  symptoms: Annotation<string[]>({
    default: () => [], 
    reducer: (state, update) => [...state, ...update]
  }),
  // Resultados del análisis contra el DSM-5
  dsmAnalysis: Annotation<string[]>({
    default: () => [],
    reducer: (state, update) => [...state, ...update]
  }),
  // Diagnósticos posibles
  possibleDiagnoses: Annotation<string[]>({
    default: () => [],
    reducer: (state, update) => [...state, ...update]
  }),
  // Sugerencias de tratamiento
  treatmentSuggestions: Annotation<string[]>({
    default: () => [],
    reducer: (state, update) => [...state, ...update]
  }),
  // Pensamiento actual
  currentThinking: Annotation<string>()
});

// Creamos un modelo de lenguaje para usar en nuestro grafo
const createLLM = () => {
  // Utilizar configuración de variables de entorno
  return new ChatOpenAI({
    temperature: 0,
    modelName: config.MODEL, // Usar modelo de DeepSeek
    apiKey: config.API_KEY,
    streaming: false, // En el backend no necesitamos streaming
    configuration: {
      baseURL: `${config.API_BASE}/v1`
    }
  });
};

// Función para extraer síntomas del texto del paciente
const extractSymptoms = async (state: AnalysisState) => {
  const llm = createLLM();
  
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Eres un asistente especializado en psicología clínica. Analiza la siguiente información de un paciente y extrae todos los síntomas relevantes."
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Información del paciente:\n{patientInfo}\n\nExtrae y enumera todos los síntomas mencionados en formato de lista."
    )
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const response = await chain.invoke({
    patientInfo: state.patientInfo
  });
  
  // Convertir la respuesta de texto a un array de síntomas
  const symptomsList = response
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(symptom => symptom.replace(/^-\s*/, '').trim());
  
  return {
    symptoms: symptomsList,
    currentThinking: "Identificando síntomas del paciente"
  };
};

// Función para analizar síntomas contra criterios del DSM-5
const analyzeDSM = async (state: AnalysisState) => {
  const llm = createLLM();
  
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Eres un experto en psicología clínica con amplio conocimiento del DSM-5. Compara los siguientes síntomas con los criterios del DSM-5 y determina qué trastornos podrían corresponder."
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Síntomas del paciente:\n{symptoms}\n\nIdentifica qué criterios del DSM-5 cumplen estos síntomas y menciona los posibles trastornos asociados."
    )
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const response = await chain.invoke({
    symptoms: state.symptoms.join('\n')
  });
  
  // Procesamos la respuesta para obtener el análisis del DSM
  const dsmAnalysisList = response
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.trim());
  
  return {
    dsmAnalysis: dsmAnalysisList,
    currentThinking: "Comparando síntomas con criterios del DSM-5"
  };
};

// Función para generar diagnósticos posibles
const generateDiagnoses = async (state: AnalysisState) => {
  const llm = createLLM();
  
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Eres un psicólogo clínico experimentado. Formula posibles diagnósticos basados en los síntomas y el análisis del DSM-5."
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Síntomas del paciente:\n{symptoms}\n\nAnálisis DSM-5:\n{dsmAnalysis}\n\nFormula los diagnósticos posibles con sus códigos F del CIE-10."
    )
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const response = await chain.invoke({
    symptoms: state.symptoms.join('\n'),
    dsmAnalysis: state.dsmAnalysis.join('\n')
  });
  
  // Procesar la respuesta para obtener diagnósticos
  const diagnoses = response
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(diagnosis => diagnosis.trim());
  
  return {
    possibleDiagnoses: diagnoses,
    currentThinking: "Formulando diagnósticos posibles"
  };
};

// Función para sugerir tratamientos
const suggestTreatments = async (state: AnalysisState) => {
  const llm = createLLM();
  
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Eres un psicólogo clínico con amplia experiencia en tratamientos basados en evidencia. Sugiere tratamientos apropiados para los diagnósticos presentados."
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Diagnósticos:\n{diagnoses}\n\nRecomienda tratamientos basados en evidencia para estos diagnósticos, incluyendo enfoques psicoterapéuticos y posibles consideraciones farmacológicas."
    )
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const response = await chain.invoke({
    diagnoses: state.possibleDiagnoses.join('\n')
  });
  
  // Procesar la respuesta para obtener sugerencias de tratamiento
  const treatments = response
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(treatment => treatment.trim());
  
  return {
    treatmentSuggestions: treatments,
    currentThinking: "Sugiriendo opciones de tratamiento"
  };
};

// Función de enrutamiento para el flujo del grafo
const routeToNext = (state: AnalysisState) => {
  if (state.symptoms.length === 0) {
    return "extract_symptoms";
  } else if (state.dsmAnalysis.length === 0) {
    return "analyze_dsm";
  } else if (state.possibleDiagnoses.length === 0) {
    return "generate_diagnoses";
  } else if (state.treatmentSuggestions.length === 0) {
    return "suggest_treatments";
  } else {
    return "END";
  }
};

// Función para responder consultas específicas
const answerQuestion = async (state: AnalysisState, query: string) => {
  const llm = createLLM();
  
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Eres un asistente especializado en psicología clínica. Responde a la siguiente consulta usando la información disponible sobre el paciente."
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Información del paciente:\nSíntomas: {symptoms}\nAnálisis DSM-5: {dsmAnalysis}\nDiagnósticos posibles: {diagnoses}\nSugerencias de tratamiento: {treatments}\n\nConsulta: {query}\n\nProporciona una respuesta detallada y basada en evidencia."
    )
  ]);
  
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  
  const response = await chain.invoke({
    symptoms: state.symptoms.join('\n'),
    dsmAnalysis: state.dsmAnalysis.join('\n'),
    diagnoses: state.possibleDiagnoses.join('\n'),
    treatments: state.treatmentSuggestions.join('\n'),
    query: query
  });
  
  return response;
};

// Creamos y configuramos el grafo
export const createClinicalAnalysisGraph = () => {
  const graphBuilder = new StateGraph(State);
  
  // Añadimos los nodos al grafo
  graphBuilder.addNode("extract_symptoms", extractSymptoms);
  graphBuilder.addNode("analyze_dsm", analyzeDSM);
  graphBuilder.addNode("generate_diagnoses", generateDiagnoses);
  graphBuilder.addNode("suggest_treatments", suggestTreatments);
  
  // Usamos el enrutador condicional comenzando desde START
  graphBuilder.addConditionalEdges(START, routeToNext);
  
  // Compilamos el grafo
  return graphBuilder.compile();
};

// Función para ejecutar el grafo completo
export const runClinicalAnalysis = async (patientInfo: string): Promise<ClinicalAnalysisResult> => {
  try {
    const graph = createClinicalAnalysisGraph();
    const result = await graph.invoke({ patientInfo });
    return result;
  } catch (error) {
    console.error("Error al ejecutar el grafo de análisis clínico:", error);
    throw error;
  }
};

// Función para responder a preguntas específicas usando el estado del análisis
export const answerClinicalQuestion = async (state: AnalysisState, question: string): Promise<string> => {
  try {
    return await answerQuestion(state, question);
  } catch (error) {
    console.error("Error al responder pregunta clínica:", error);
    throw error;
  }
}; 