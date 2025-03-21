/**
 * Hook personalizado para gestionar datos clínicos compartidos entre componentes
 */

import { useState, useEffect, useCallback } from 'react';
import { usePatientContext } from '../context/PatientContext';
import { usePatientService } from '../services/patientService';
import { Patient, Diagnosis, Recommendation, TestResult } from '../types/clinical-types';
import { ThoughtStep } from '../types/ai-types';
import { globalCache } from '../utils/cacheUtils';

// Clave para almacenar en caché diagnósticos temporales
const TMP_DIAGNOSES_KEY = 'tmp_diagnoses';
const TMP_RECOMMENDATIONS_KEY = 'tmp_recommendations';
const TMP_THOUGHT_CHAIN_KEY = 'tmp_thought_chain';

/**
 * Hook para gestionar todos los datos clínicos de un paciente
 * @param patientId ID del paciente a gestionar
 * @returns Datos clínicos y funciones para manipularlos
 */
export function useClinicalData(patientId?: number) {
  // Contexto y servicios
  const { currentPatient } = usePatientContext();
  const patientService = usePatientService();
  
  // Estados locales
  const [patient, setPatient] = useState<Patient | null>(currentPatient);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [thoughtChain, setThoughtChain] = useState<ThoughtStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Funciones
  
  /**
   * Carga datos del paciente
   */
  const loadPatientData = useCallback(async (id?: number) => {
    if (!id && !patientId) return;
    
    setLoading(true);
    
    try {
      const targetId = id || patientId;
      if (!targetId) return;
      
      const patientData = await patientService.getPatient(targetId);
      
      if (patientData) {
        setPatient(patientData);
        
        // Inicializar diagnósticos si existen
        if (patientData.diagnoses && patientData.diagnoses.length > 0) {
          setDiagnoses(patientData.diagnoses);
        } else {
          // Intentar obtener diagnósticos temporales de caché
          const cachedDiagnoses = globalCache.get(`${TMP_DIAGNOSES_KEY}_${targetId}`) as Diagnosis[] | undefined;
          if (cachedDiagnoses) {
            setDiagnoses(cachedDiagnoses);
          }
        }
        
        // Inicializar cadena de pensamiento desde caché
        const cachedThoughtChain = globalCache.get(`${TMP_THOUGHT_CHAIN_KEY}_${targetId}`) as ThoughtStep[] | undefined;
        if (cachedThoughtChain) {
          setThoughtChain(cachedThoughtChain);
        }
        
        // Inicializar recomendaciones desde caché
        const cachedRecommendations = globalCache.get(`${TMP_RECOMMENDATIONS_KEY}_${targetId}`) as Recommendation[] | undefined;
        if (cachedRecommendations) {
          setRecommendations(cachedRecommendations);
        }
        
        setInitialized(true);
      }
    } catch (error) {
      console.error('Error al cargar datos clínicos:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId, patientService]);
  
  /**
   * Actualiza los diagnósticos
   */
  const updateDiagnoses = useCallback((newDiagnoses: Diagnosis[]) => {
    setDiagnoses(newDiagnoses);
    
    // Almacenar en caché temporal
    if (patient?.id) {
      globalCache.set(`${TMP_DIAGNOSES_KEY}_${patient.id}`, newDiagnoses);
    }
  }, [patient?.id]);
  
  /**
   * Actualiza las recomendaciones
   */
  const updateRecommendations = useCallback((newRecommendations: Recommendation[]) => {
    setRecommendations(newRecommendations);
    
    // Almacenar en caché temporal
    if (patient?.id) {
      globalCache.set(`${TMP_RECOMMENDATIONS_KEY}_${patient.id}`, newRecommendations);
    }
  }, [patient?.id]);
  
  /**
   * Actualiza la cadena de pensamiento
   */
  const updateThoughtChain = useCallback((newThoughtChain: ThoughtStep[]) => {
    setThoughtChain(newThoughtChain);
    
    // Almacenar en caché temporal
    if (patient?.id) {
      globalCache.set(`${TMP_THOUGHT_CHAIN_KEY}_${patient.id}`, newThoughtChain);
    }
  }, [patient?.id]);
  
  /**
   * Guarda los diagnósticos de forma persistente
   */
  const saveDiagnoses = useCallback(async () => {
    if (!patient?.id || diagnoses.length === 0) return false;
    
    setLoading(true);
    
    try {
      // Actualizar paciente con diagnósticos
      const updatedPatient = await patientService.updatePatient(patient.id, {
        diagnoses
      });
      
      if (updatedPatient) {
        setPatient(updatedPatient);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al guardar diagnósticos:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [patient?.id, diagnoses, patientService]);
  
  /**
   * Agregar un resultado de test
   */
  const addTestResult = useCallback(async (testResult: TestResult) => {
    if (!patient?.id) return false;
    
    setLoading(true);
    
    try {
      const result = await patientService.addTestResult(patient.id, testResult);
      
      if (result) {
        // Recargar datos del paciente para obtener el test actualizado
        await loadPatientData(patient.id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al agregar resultado de test:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [patient?.id, patientService, loadPatientData]);
  
  /**
   * Actualizar borrador de evaluación
   */
  const updateEvaluationDraft = useCallback(async (text: string) => {
    if (!patient?.id) return false;
    
    setLoading(true);
    
    try {
      const updatedPatient = await patientService.saveEvaluationDraft(patient.id, text);
      
      if (updatedPatient) {
        setPatient(updatedPatient);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al actualizar borrador:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [patient?.id, patientService]);
  
  // Cargar datos iniciales
  useEffect(() => {
    if ((patientId || currentPatient?.id) && !initialized) {
      loadPatientData(patientId || currentPatient?.id);
    } else if (currentPatient && currentPatient !== patient) {
      setPatient(currentPatient);
    }
  }, [patientId, currentPatient, initialized, loadPatientData, patient]);
  
  return {
    patient,
    diagnoses,
    recommendations,
    thoughtChain,
    loading,
    updateDiagnoses,
    updateRecommendations,
    updateThoughtChain,
    saveDiagnoses,
    addTestResult,
    updateEvaluationDraft,
    loadPatientData
  };
} 