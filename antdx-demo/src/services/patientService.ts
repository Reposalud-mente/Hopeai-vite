/**
 * Servicio para gestión de pacientes con soporte de caché
 * 
 * Este servicio proporciona métodos optimizados para trabajar con
 * datos de pacientes, implementando caché para reducir llamadas a la API.
 */

import { Patient, TestResult } from '../types/clinical-types';
import { getPatients, getPatientById, updatePatient, updateEvaluationDraft, addTestResult } from '../api/patients';
import { MemoryCache } from '../utils/cacheUtils';
import { useError } from '../hooks/useError';
import { ErrorSource } from '../context/ErrorContext';

// TTL para datos de caché (10 minutos)
const PATIENT_CACHE_TTL = 10 * 60 * 1000;
const PATIENTS_LIST_KEY = 'patients_list';

// Caché específico para pacientes
const patientCache = new MemoryCache<Patient>(PATIENT_CACHE_TTL);
const patientsListCache = new MemoryCache<Patient[]>(PATIENT_CACHE_TTL);

/**
 * Obtiene la lista de pacientes, con soporte de caché
 * @param forceRefresh Forzar recarga desde API
 * @returns Lista de pacientes
 */
export async function getPatientsList(forceRefresh = false): Promise<Patient[]> {
  // Si no se fuerza recarga y existe en caché, devolver desde caché
  if (!forceRefresh) {
    const cachedPatients = patientsListCache.get(PATIENTS_LIST_KEY);
    if (cachedPatients) {
      return cachedPatients;
    }
  }
  
  // Obtener desde API
  const patients = await getPatients();
  
  // Guardar en caché
  patientsListCache.set(PATIENTS_LIST_KEY, patients);
  
  // Actualizar también caché individual de cada paciente
  patients.forEach(patient => {
    patientCache.set(`patient_${patient.id}`, patient);
  });
  
  return patients;
}

/**
 * Obtiene un paciente específico, con soporte de caché
 * @param id ID del paciente
 * @param forceRefresh Forzar recarga desde API
 * @returns Datos del paciente
 */
export async function getPatient(id: number, forceRefresh = false): Promise<Patient> {
  const cacheKey = `patient_${id}`;
  
  // Si no se fuerza recarga y existe en caché, devolver desde caché
  if (!forceRefresh) {
    const cachedPatient = patientCache.get(cacheKey);
    if (cachedPatient) {
      return cachedPatient;
    }
  }
  
  // Obtener desde API
  const patient = await getPatientById(id);
  
  // Guardar en caché
  patientCache.set(cacheKey, patient);
  
  // Actualizar también la lista si está en caché
  const cachedList = patientsListCache.get(PATIENTS_LIST_KEY);
  if (cachedList) {
    const updatedList = cachedList.map(p => p.id === id ? patient : p);
    patientsListCache.set(PATIENTS_LIST_KEY, updatedList);
  }
  
  return patient;
}

/**
 * Actualiza un paciente y refresca la caché
 * @param id ID del paciente
 * @param data Datos a actualizar
 * @returns Paciente actualizado
 */
export async function updatePatientData(id: number, data: Partial<Patient>): Promise<Patient> {
  // Actualizar en API
  const updatedPatient = await updatePatient(id, data);
  
  // Actualizar caché
  const cacheKey = `patient_${id}`;
  patientCache.set(cacheKey, updatedPatient);
  
  // Actualizar también la lista si está en caché
  const cachedList = patientsListCache.get(PATIENTS_LIST_KEY);
  if (cachedList) {
    const updatedList = cachedList.map(p => p.id === id ? updatedPatient : p);
    patientsListCache.set(PATIENTS_LIST_KEY, updatedList);
  }
  
  return updatedPatient;
}

/**
 * Actualiza el borrador de evaluación y refresca la caché
 * @param id ID del paciente
 * @param draft Texto del borrador
 * @returns Paciente actualizado
 */
export async function saveEvaluationDraftData(id: number, draft: string): Promise<Patient> {
  // Actualizar en API
  const updatedPatient = await updateEvaluationDraft(id, draft);
  
  // Actualizar caché
  const cacheKey = `patient_${id}`;
  patientCache.set(cacheKey, updatedPatient);
  
  // Actualizar también la lista si está en caché
  const cachedList = patientsListCache.get(PATIENTS_LIST_KEY);
  if (cachedList) {
    const updatedList = cachedList.map(p => p.id === id ? updatedPatient : p);
    patientsListCache.set(PATIENTS_LIST_KEY, updatedList);
  }
  
  return updatedPatient;
}

/**
 * Agrega un resultado de prueba psicológica y refresca la caché
 * @param patientId ID del paciente
 * @param testResult Resultado de la prueba
 * @returns Resultado de prueba creado
 */
export async function addTestResultData(patientId: number, testResult: TestResult): Promise<TestResult> {
  // Agregar en API
  const result = await addTestResult(patientId, testResult);
  
  // Refrescar caché del paciente para incluir el nuevo test
  await getPatient(patientId, true);
  
  return result;
}

/**
 * Borra la caché de un paciente específico
 * @param id ID del paciente
 */
export function invalidatePatientCache(id: number): void {
  const cacheKey = `patient_${id}`;
  patientCache.delete(cacheKey);
}

/**
 * Borra toda la caché de pacientes
 */
export function invalidateAllPatientCache(): void {
  patientCache.clear();
  patientsListCache.clear();
}

/**
 * Hook personalizado para usar el servicio de pacientes con manejo de errores
 */
export function usePatientService() {
  const { withErrorHandling } = useError();
  
  return {
    /**
     * Obtiene la lista de pacientes con manejo de errores
     */
    getPatients: async (forceRefresh = false) => {
      return withErrorHandling(
        async () => getPatientsList(forceRefresh),
        'Error al obtener la lista de pacientes',
        ErrorSource.API
      );
    },
    
    /**
     * Obtiene un paciente específico con manejo de errores
     */
    getPatient: async (id: number, forceRefresh = false) => {
      return withErrorHandling(
        async () => getPatient(id, forceRefresh),
        `Error al obtener la información del paciente ${id}`,
        ErrorSource.API,
        { patientId: id }
      );
    },
    
    /**
     * Actualiza un paciente con manejo de errores
     */
    updatePatient: async (id: number, data: Partial<Patient>) => {
      return withErrorHandling(
        async () => updatePatientData(id, data),
        'Error al actualizar los datos del paciente',
        ErrorSource.API,
        { patientId: id }
      );
    },
    
    /**
     * Actualiza el borrador de evaluación con manejo de errores
     */
    saveEvaluationDraft: async (id: number, draft: string) => {
      return withErrorHandling(
        async () => saveEvaluationDraftData(id, draft),
        'Error al guardar el borrador de evaluación',
        ErrorSource.API,
        { patientId: id, draftLength: draft?.length }
      );
    },
    
    /**
     * Agrega un resultado de prueba con manejo de errores
     */
    addTestResult: async (patientId: number, testResult: TestResult) => {
      return withErrorHandling(
        async () => addTestResultData(patientId, testResult),
        'Error al guardar el resultado de la prueba',
        ErrorSource.API,
        { patientId, testName: testResult.name }
      );
    },
    
    invalidatePatientCache,
    invalidateAllPatientCache
  };
} 