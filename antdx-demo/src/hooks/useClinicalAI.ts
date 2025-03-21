import { useState, useEffect, useCallback } from 'react';
import { fetchAIAnalysisWithErrorHandling, chatWithPatientDataWithErrorHandling } from '../api/ai';

// Define interfaces for our data types
interface ThoughtStep {
  title: string;
  description: string;
  status: 'wait' | 'processing' | 'finish' | 'error';
  icon?: React.ReactNode;
}

interface Diagnosis {
  name: string;
  description: string;
  confidence: string;
}

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
}

// Define the return type of our hook
interface UseClinicalAIReturn {
  thoughtSteps: ThoughtStep[];
  suggestedDiagnoses: Diagnosis[];
  chatHistory: ChatMessage[];
  loading: boolean;
  error: string | null;
  runAnalysis: () => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
}

/**
 * Convierte un estado de análisis al formato interno del hook
 * @param status - Estado original del análisis
 * @returns Estado compatible con el componente
 */
const mapStatusToComponent = (status: string): 'wait' | 'processing' | 'finish' | 'error' => {
  if (status === 'error') return 'error';
  if (status === 'processing' || status === 'pending') return 'processing';
  if (status === 'finish' || status === 'completed') return 'finish';
  return 'wait';
};

/**
 * Hook personalizado para integrar el análisis clínico IA con nuestra interfaz
 * @param {string} patientInfo - Información del paciente para análisis
 * @returns {Object} - Estado y funciones del asistente clínico IA
 */
export const useClinicalAI = (patientInfo: string): UseClinicalAIReturn => {
  // Estado para almacenar los pasos del proceso de pensamiento
  const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
  
  // Estado para almacenar diagnósticos sugeridos
  const [suggestedDiagnoses, setSuggestedDiagnoses] = useState<Diagnosis[]>([]);
  
  // Estado para almacenar el historial de conversación
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Estado para indicar cuando el análisis está en progreso
  const [loading, setLoading] = useState<boolean>(false);
  
  // Estado para almacenar cualquier error
  const [error, setError] = useState<string | null>(null);

  // Función para ejecutar el análisis completo
  const runAnalysis = useCallback(async () => {
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
      
    } catch (err) {
      console.error('Error en el análisis clínico:', err);
      setError('Ocurrió un error en el análisis. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [patientInfo]);

  // Función para enviar una pregunta al asistente
  const askQuestion = useCallback(async (question: string) => {
    if (!question) return;
    
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
          icon: null
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
    runAnalysis,
    askQuestion
  };
}; 