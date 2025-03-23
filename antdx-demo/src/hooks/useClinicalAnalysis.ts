import { useState, useEffect, useCallback } from 'react';
import type { ClinicalAnalysisResult, PatientAnalysis } from '../types/ai-types';
import { analyzePatientWithBackend, testAnalysisEndpoint } from '../api/clinicalAnalysisApi';
import { fetchAIAnalysisWithErrorHandling, chatWithPatientDataWithErrorHandling } from '../api/ai';
import { ThoughtStep, Diagnosis, ChatMessage, mapStatusToComponent } from '../types/clinical-types';

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

  // Función para ejecutar el análisis simple (no streaming)
  const runSimpleAnalysis = useCallback(async () => {
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
          icon: null // Los iconos se asignarán en el componente
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
      
      // Crear un objeto analysisState para mantener consistencia entre ambos modos
      setAnalysisState({
        symptoms: result.symptoms || [],
        dsmAnalysis: result.dsmAnalysis || [],
        possibleDiagnoses: result.diagnoses?.map(d => d.name) || [],
        treatmentSuggestions: result.recommendations || []
      });
      
    } catch (err) {
      console.error('Error en el análisis clínico:', err);
      setError('Ocurrió un error en el análisis. Por favor, inténtalo de nuevo.');
      
      // Marcar todos los pasos como error
      setThoughtSteps(prevSteps => 
        prevSteps.map(step => ({
          ...step,
          status: step.status === 'processing' ? 'error' : step.status,
          description: step.status === 'processing' ? "Error en el procesamiento" : step.description
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [patientInfo]);

  // Función unificada para ejecutar el análisis
  const runAnalysis = useCallback(async () => {
    if (useEnhancedAnalysis) {
      await runEnhancedAnalysis();
    } else {
      await runSimpleAnalysis();
    }
  }, [useEnhancedAnalysis, runEnhancedAnalysis, runSimpleAnalysis]);

  // Función para actualizar los pasos de pensamiento basados en el análisis
  const updateThoughtStepsFromAnalysis = (analysis: PatientAnalysis, state: ClinicalAnalysisResult) => {
    // Si hay un ThoughtChain en el análisis, úsalo directamente
    if (analysis.thoughtChain && analysis.thoughtChain.length > 0) {
      setThoughtSteps(analysis.thoughtChain.map(step => ({
        title: step.title,
        description: step.description,
        status: mapStatusToComponent(step.status),
        icon: null
      })));
      return;
    }
    
    // Si no hay ThoughtChain, actualizar basado en estado
    updateThoughtSteps(state);
  };
  
  // Actualizar los pasos de pensamiento basados en el estado del análisis
  const updateThoughtSteps = (state: ClinicalAnalysisResult) => {
    setThoughtSteps(prevSteps => {
      if (!state) return prevSteps;
      
      // Clonar los pasos actuales
      const newSteps = [...prevSteps];
      
      // Actualizar estados basados en los datos disponibles
      if (state.symptoms && state.symptoms.length > 0) {
        newSteps[0] = { 
          ...newSteps[0], 
          status: 'finish',
          description: `Se identificaron ${state.symptoms.length} síntomas principales`
        };
        
        newSteps[1] = { 
          ...newSteps[1], 
          status: 'processing',
          description: "Analizando síntomas según criterios DSM-5/CIE-11"
        };
      }
      
      if (state.dsmAnalysis && state.dsmAnalysis.length > 0) {
        newSteps[1] = { 
          ...newSteps[1], 
          status: 'finish',
          description: `Análisis completado con ${state.dsmAnalysis.length} criterios cumplidos`
        };
        
        newSteps[2] = { 
          ...newSteps[2], 
          status: 'processing',
          description: "Formulando diagnósticos potenciales"
        };
      }
      
      if (state.possibleDiagnoses && state.possibleDiagnoses.length > 0) {
        newSteps[2] = { 
          ...newSteps[2], 
          status: 'finish',
          description: `Se formularon ${state.possibleDiagnoses.length} diagnósticos potenciales`
        };
        
        newSteps[3] = { 
          ...newSteps[3], 
          status: 'processing',
          description: "Generando recomendaciones terapéuticas"
        };
      }
      
      if (state.treatmentSuggestions && state.treatmentSuggestions.length > 0) {
        newSteps[3] = { 
          ...newSteps[3], 
          status: 'finish',
          description: `Se generaron ${state.treatmentSuggestions.length} recomendaciones`
        };
      }
      
      return newSteps;
    });
  };

  // Función para enviar una pregunta al asistente
  const askQuestion = useCallback(async (question: string): Promise<string | null> => {
    if (!question) return null;
    
    setLoading(true);
    
    try {
      // Añadimos la pregunta del usuario al historial
      setChatHistory(prev => [...prev, { 
        type: 'user',
        content: question
      }]);
      
      // Obtener el historial previo en el formato esperado por la API
      const historyForApi = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Obtenemos la respuesta a través del servicio centralizado
      const response = await chatWithPatientDataWithErrorHandling(
        question, 
        patientInfo, 
        historyForApi
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
          icon: null
        })));
      }
      
      // Si hay actualizaciones en state, actualiza analysisState
      if (response.updatedState) {
        setAnalysisState(current => ({
          ...current,
          ...response.updatedState
        }));
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