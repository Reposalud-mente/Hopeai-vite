import { StateGraph, Annotation, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate, 
  SystemMessagePromptTemplate 
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Definimos el estado del grafo
const State = Annotation.Root({
  // Entrada del paciente 
  patientInfo: Annotation.String(),
  // Resultados de la identificación de síntomas
  symptoms: Annotation.Array({
    default: () => [], 
    reducer: (state, update) => [...state, ...update]
  }),
  // Resultados del análisis contra el DSM-5
  dsmAnalysis: Annotation.Array({
    default: () => [],
    reducer: (state, update) => [...state, ...update]
  }),
  // Diagnósticos posibles
  possibleDiagnoses: Annotation.Array({
    default: () => [],
    reducer: (state, update) => [...state, ...update]
  }),
  // Sugerencias de tratamiento
  treatmentSuggestions: Annotation.Array({
    default: () => [],
    reducer: (state, update) => [...state, ...update]
  }),
  // Pensamiento actual
  currentThinking: Annotation.String()
});

// Creamos un modelo de lenguaje para usar en nuestro grafo
const createLLM = () => {
  return new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-3.5-turbo", // Usar un modelo apropiado
    streaming: true
  });
};

// Función para extraer síntomas del texto del paciente
const extractSymptoms = async (state) => {
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
const analyzeDSM = async (state) => {
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
const generateDiagnoses = async (state) => {
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
const suggestTreatments = async (state) => {
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
const routeToNext = (state) => {
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
const answerQuestion = async (state, query) => {
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
  
  // Configuramos el punto de entrada
  graphBuilder.addEdge(START, routeToNext);
  
  // Configuramos las transiciones entre nodos
  graphBuilder.addEdge("extract_symptoms", routeToNext);
  graphBuilder.addEdge("analyze_dsm", routeToNext);
  graphBuilder.addEdge("generate_diagnoses", routeToNext);
  graphBuilder.addEdge("suggest_treatments", routeToNext);
  
  // Compilamos el grafo
  return graphBuilder.compile();
};

// Función para ejecutar el grafo completo
export const runClinicalAnalysis = async (patientInfo) => {
  const graph = createClinicalAnalysisGraph();
  const result = await graph.invoke({ patientInfo });
  return result;
};

// Función para responder a preguntas específicas
export const answerClinicalQuestion = async (analysisState, question) => {
  return await answerQuestion(analysisState, question);
}; 