import { useState, useEffect, useCallback } from 'react';
import type { ClinicalAnalysisResult, PatientAnalysis } from '../types/ai-types';
import { analyzePatientWithBackend, testAnalysisEndpoint } from '../api/clinicalAnalysisApi';

interface ThoughtStep {
  title: string;
  description: string;
  status: 'wait' | 'processing' | 'finish' | 'error';
  icon?: React.ReactNode;
}

/**
 * Hook personalizado para manejar streaming de actualizaciones del análisis clínico
 * Utiliza el backend con LangGraph para obtener análisis clínico
 * 
 * @param {string} patientInfo - Información del paciente para analizar
 * @returns {Object} - Estado y funciones para manejar la visualización del ThoughtChain
 */
export const useAnalysisStream = (patientInfo: string) => {
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
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<ClinicalAnalysisResult | null>(null);
  
  // Iniciar el análisis con el backend
  const startAnalysisStream = useCallback(async () => {
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
  
  // Actualizar los pasos del ThoughtChain basado en el análisis y el estado
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
  
  // Actualizar los pasos del ThoughtChain basado en el estado (fallback)
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
  
  // Iniciar el análisis cuando hay información del paciente
  useEffect(() => {
    if (patientInfo) {
      startAnalysisStream();
    }
  }, [patientInfo, startAnalysisStream]);
  
  return {
    thoughtSteps,
    loading,
    error,
    analysisState,
    startAnalysisStream
  };
}; 