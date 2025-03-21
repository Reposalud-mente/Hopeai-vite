import { useState, useEffect, useCallback } from 'react';
import type { ClinicalAnalysisResult, PatientAnalysis } from '../types/ai-types';
import { analyzePatientWithBackend, testAnalysisEndpoint } from '../api/clinicalAnalysisApi';
import { fetchAIAnalysisWithErrorHandling, chatWithPatientDataWithErrorHandling } from '../api/ai';

/**
 * Representa un paso en el proceso de análisis clínico con su estado
 * @interface ThoughtStep
 * @property {string} title - Título del paso de razonamiento
 * @property {string} description - Descripción detallada del paso
 * @property {'wait' | 'processing' | 'finish' | 'error'} status - Estado actual de este paso
 * @property {React.ReactNode | null} [icon] - Icono opcional para representar visualmente el paso
 */
export interface ThoughtStep {
  title: string;
  description: string;
  status: 'wait' | 'processing' | 'finish' | 'error';
  icon?: React.ReactNode | null;
}

/**
 * Representa un diagnóstico sugerido por el sistema de IA
 * @interface Diagnosis
 * @property {string} name - Nombre del diagnóstico (basado en DSM-5/CIE-11)
 * @property {string} description - Descripción clínica del diagnóstico
 * @property {string} confidence - Nivel de confianza del diagnóstico (bajo, medio, alto)
 */
export interface Diagnosis {
  name: string;
  description: string;
  confidence: string;
}

/**
 * Representa un mensaje en la conversación clínica
 * @interface ChatMessage
 * @property {'user' | 'assistant'} type - Origen del mensaje (usuario o asistente)
 * @property {string} content - Contenido del mensaje
 */
export interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
}

/**
 * Objeto devuelto por el hook useClinicalAnalysis
 * @interface UseClinicalAnalysisReturn
 * @property {ThoughtStep[]} thoughtSteps - Pasos de razonamiento clínico 
 * @property {Diagnosis[]} suggestedDiagnoses - Diagnósticos sugeridos basados en el análisis
 * @property {ChatMessage[]} chatHistory - Historial de conversación clínica
 * @property {boolean} loading - Indicador de estado de carga
 * @property {string | null} error - Mensaje de error si ocurre alguno
 * @property {ClinicalAnalysisResult | null} analysisState - Estado completo del análisis clínico
 * @property {() => Promise<void>} runAnalysis - Función para iniciar el análisis clínico
 * @property {(question: string) => Promise<string | null>} askQuestion - Función para realizar preguntas al asistente clínico
 */
export interface UseClinicalAnalysisReturn {
  thoughtSteps: ThoughtStep[];
  suggestedDiagnoses: Diagnosis[];
  chatHistory: ChatMessage[];
  loading: boolean;
  error: string | null;
  analysisState: ClinicalAnalysisResult | null;
  runAnalysis: () => Promise<void>;
  askQuestion: (question: string) => Promise<string | null>;
}

/**
 * Convierte un estado de análisis al formato interno del hook
 * @param {string} status - Estado original del análisis
 * @returns {'wait' | 'processing' | 'finish' | 'error'} Estado compatible con el componente de visualización
 */
const mapStatusToComponent = (status: string): 'wait' | 'processing' | 'finish' | 'error' => {
  if (status === 'error') return 'error';
  if (status === 'processing' || status === 'pending') return 'processing';
  if (status === 'finish' || status === 'completed') return 'finish';
  return 'wait';
};

/**
 * Hook unificado para el análisis clínico que combina la potencia del razonamiento
 * clínico basado en IA con un sistema de pasos de pensamiento estructurado.
 * 
 * Este hook gestiona:
 * - Obtención y análisis de datos clínicos del paciente
 * - Generación de diagnósticos sugeridos basados en criterios DSM-5/CIE-11
 * - Visualización del proceso de razonamiento clínico
 * - Interacción conversacional para obtener información adicional
 * 
 * @param {string} patientInfo - Información clínica del paciente en formato texto
 * @param {boolean} [useEnhancedAnalysis=true] - Utiliza el análisis avanzado con streaming de pensamiento
 * @returns {UseClinicalAnalysisReturn} Objeto con estado del análisis y funciones para interactuar
 */
export const useClinicalAnalysis = (
  patientInfo: string,
  useEnhancedAnalysis: boolean = true
): UseClinicalAnalysisReturn => {
  // Estado compartido para ambos modos
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para modo enhanced (streaming)
  const [analysisState, setAnalysisState] = useState<ClinicalAnalysisResult | null>(null);
  
  // Estados para ambos modos
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([
    {
      title: "Identificación de síntomas",
      description: "Esperando datos del paciente",
      status: 'wait'
    },
    {
      title: "Análisis DSM-5",
      description: "Pendiente de identificación de síntomas",
      status: 'wait'
    },
    {
      title: "Formulación diagnóstica",
      description: "Pendiente de análisis DSM-5",
      status: 'wait'
    },
    {
      title: "Recomendaciones",
      description: "Pendiente de formulación diagnóstica",
      status: 'wait'
    }
  ]);
  
  // Estado para diagnósticos sugeridos
  const [suggestedDiagnoses, setSuggestedDiagnoses] = useState<Diagnosis[]>([]);
  
  // Estado para historial de chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Función para ejecutar el análisis mejorado (streaming)
  const runEnhancedAnalysis = useCallback(async () => {
    if (!patientInfo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Actualizar el paso "Identificación de síntomas" a "processing"
      setThoughtSteps(prevSteps => 
        prevSteps.map((step, index) => 
          index === 0 
            ? { ...step, status: 'processing', description: "Analizando datos del paciente" } 
            : step
        )
      );
      
      // Verificar si el endpoint está disponible
      const endpointAvailable = await testAnalysisEndpoint();
      
      if (!endpointAvailable) {
        throw new Error("El servicio de análisis no está disponible en este momento");
      }
      
      // Llamar al backend para el análisis
      const analysis: PatientAnalysis = await analyzePatientWithBackend(patientInfo);
      
      // Extraer el estado del análisis para mantener compatibilidad con el código existente
      // Convertir el resultado a estructura ClinicalAnalysisResult
      const result: ClinicalAnalysisResult = {
        symptoms: analysis.diagnoses.map(d => d.name),
        dsmAnalysis: [], // No tenemos acceso a este campo directamente
        possibleDiagnoses: analysis.diagnoses.map(d => d.name),
        treatmentSuggestions: analysis.recommendations.map(r => r.description)
      };
      
      // Actualizar el estado del análisis
      setAnalysisState(result);
      
      // Actualizar los pasos de pensamiento basados en el resultado y el ThoughtChain
      // Usamos el ThoughtChain del análisis para determinar el estado de los pasos
      updateThoughtStepsFromAnalysis(analysis, result);
      
      // Convertir los diagnósticos del análisis al formato de diagnóstico
      setSuggestedDiagnoses(
        analysis.diagnoses.map(d => ({
          name: d.name,
          description: d.description || '',
          confidence: d.confidence || 'Media'
        }))
      );
      
    } catch (err) {
      console.error('Error en análisis clínico:', err);
      setError('Ocurrió un error en el análisis. Por favor, inténtalo de nuevo.');
      
      // Marcar el paso actual como error
      setThoughtSteps(prevSteps => 
        prevSteps.map((step) => 
          step.status === 'processing' 
            ? { ...step, status: 'error', description: "Error en el procesamiento" } 
            : step
        )
      );
    } finally {
      setLoading(false);
    }
  }, [patientInfo]);

  // Función para ejecutar el análisis legado
  const runLegacyAnalysis = useCallback(async () => {
    if (!patientInfo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Ejecutamos el análisis a través del servicio centralizado
      const result = await fetchAIAnalysisWithErrorHandling(patientInfo);
      
      // Formateamos los pasos de razonamiento para el componente ThoughtChain
      if (result.thoughtChain && result.thoughtChain.length > 0) {
        setThoughtSteps(result.thoughtChain.map(step => ({
          title: step.title,
          description: step.description,
          status: mapStatusToComponent(step.status),
          icon: null as React.ReactNode | null
        })));
      }
      
      // Formateamos los diagnósticos para el componente Suggestion
      if (result.diagnoses && result.diagnoses.length > 0) {
        setSuggestedDiagnoses(result.diagnoses.map(diagnosis => ({
          name: diagnosis.name,
          description: diagnosis.description,
          confidence: diagnosis.confidence,
        })));
      }
      
    } catch (err) {
      console.error('Error en el análisis clínico:', err);
      setError('Ocurrió un error en el análisis. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [patientInfo]);

  /**
   * Inicia el proceso de análisis clínico basado en la información del paciente.
   * Selecciona automáticamente entre el modo de análisis mejorado (con streaming)
   * o el modo legado según la configuración.
   * 
   * Este método:
   * 1. Inicializa el proceso de análisis
   * 2. Gestiona estados de carga
   * 3. Procesa la información clínica del paciente
   * 4. Genera diagnósticos sugeridos y recomendaciones
   * 
   * @returns {Promise<void>} Promesa que se resuelve cuando el análisis se completa
   * @throws {Error} Si ocurre un error durante el análisis
   */
  const runAnalysis = useCallback(async () => {
    if (useEnhancedAnalysis) {
      await runEnhancedAnalysis();
    } else {
      await runLegacyAnalysis();
    }
  }, [useEnhancedAnalysis, runEnhancedAnalysis, runLegacyAnalysis]);

  /**
   * Actualiza los pasos de pensamiento basados en los resultados del análisis de la IA
   * 
   * @param {PatientAnalysis} analysis - Análisis del paciente recibido del servicio
   * @param {ClinicalAnalysisResult} state - Estado actual del análisis clínico
   */
  const updateThoughtStepsFromAnalysis = (analysis: PatientAnalysis, state: ClinicalAnalysisResult) => {
    // Si tenemos ThoughtChain en el análisis, usarlo para actualizar los estados
    if (analysis.thoughtChain && analysis.thoughtChain.length > 0) {
      const updatedSteps = [...thoughtSteps];
      
      // Mapear cada paso del ThoughtChain a nuestros pasos
      analysis.thoughtChain.forEach((chainStep, index) => {
        if (index < updatedSteps.length) {
          updatedSteps[index] = {
            ...updatedSteps[index],
            status: chainStep.status as 'wait' | 'processing' | 'finish' | 'error',
            description: chainStep.description
          };
        }
      });
      
      setThoughtSteps(updatedSteps);
    } else {
      // Fallback a la lógica anterior basada en el estado
      updateThoughtSteps(state);
    }
  };
  
  /**
   * Actualiza los pasos de pensamiento basados en el estado del análisis clínico
   * 
   * @param {ClinicalAnalysisResult} state - Estado actual del análisis
   */
  const updateThoughtSteps = (state: ClinicalAnalysisResult) => {
    const steps = [...thoughtSteps];
    
    // Actualizar cada paso según el estado correspondiente
    if (state.symptoms.length > 0) {
      steps[0] = {
        ...steps[0],
        status: 'finish',
        description: `Se identificaron ${state.symptoms.length} síntomas relevantes`
      };
      
      if (state.dsmAnalysis.length > 0) {
        steps[1] = {
          ...steps[1],
          status: 'finish',
          description: "Análisis DSM-5 completado"
        };
        
        if (state.possibleDiagnoses.length > 0) {
          steps[2] = {
            ...steps[2],
            status: 'finish',
            description: `Se formularon ${state.possibleDiagnoses.length} diagnósticos posibles`
          };
          
          if (state.treatmentSuggestions.length > 0) {
            steps[3] = {
              ...steps[3],
              status: 'finish',
              description: "Recomendaciones de tratamiento generadas"
            };
          } else {
            steps[3] = {
              ...steps[3],
              status: 'processing',
              description: "Generando recomendaciones de tratamiento"
            };
          }
        } else {
          steps[2] = {
            ...steps[2],
            status: 'processing',
            description: "Formulando diagnósticos posibles"
          };
        }
      } else {
        steps[1] = {
          ...steps[1],
          status: 'processing',
          description: "Analizando según criterios DSM-5"
        };
      }
    } else {
      steps[0] = {
        ...steps[0],
        status: 'processing',
        description: "Analizando datos del paciente"
      };
    }
    
    setThoughtSteps(steps);
  };
  
  /**
   * Permite realizar preguntas al asistente clínico en el contexto del paciente actual
   * 
   * @param {string} question - Pregunta clínica formulada por el profesional
   * @returns {Promise<string | null>} Respuesta del asistente o null si hay error
   */
  const askQuestion = useCallback(async (question: string): Promise<string | null> => {
    if (!question) return null;
    
    setLoading(true);
    
    try {
      // Añadimos la pregunta del usuario al historial
      setChatHistory(prev => [...prev, { 
        type: 'user',
        content: question
      }]);
      
      // Obtenemos la respuesta a través del servicio centralizado
      const response = await chatWithPatientDataWithErrorHandling(
        question, 
        patientInfo, 
        chatHistory
      );
      
      // Añadimos la respuesta al historial
      setChatHistory(prev => [...prev, { 
        type: 'assistant',
        content: response.answer
      }]);
      
      // Si hay actualizaciones en el análisis, las aplicamos
      if (response.updatedDiagnoses) {
        setSuggestedDiagnoses(response.updatedDiagnoses.map(diagnosis => ({
          name: diagnosis.name,
          description: diagnosis.description,
          confidence: diagnosis.confidence,
        })));
      }
      
      if (response.updatedThoughtChain) {
        setThoughtSteps(response.updatedThoughtChain.map(step => ({
          title: step.title,
          description: step.description,
          status: mapStatusToComponent(step.status),
          icon: null as React.ReactNode | null
        })));
      }
      
      return response.answer;
    } catch (err) {
      console.error('Error al procesar la pregunta:', err);
      setError('No se pudo procesar tu pregunta. Inténtalo de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientInfo, chatHistory]);

  // Ejecutamos el análisis automáticamente cuando se proporciona la información del paciente
  useEffect(() => {
    if (patientInfo) {
      runAnalysis();
    }
  }, [patientInfo, runAnalysis]);

  return {
    thoughtSteps,
    suggestedDiagnoses,
    chatHistory,
    loading,
    error,
    analysisState,
    runAnalysis,
    askQuestion
  };
}; 