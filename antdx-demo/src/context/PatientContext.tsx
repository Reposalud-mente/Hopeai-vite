import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { getPatients, getPatientById, updateEvaluationDraft } from '../api/patients';
import { Patient } from '../types/clinical-types';
import { useError } from '../hooks/useError';
import { ErrorSource } from './ErrorContext';
import { usePatientCache } from '../hooks/usePatientCache';

// Define la nueva forma del contexto
export interface PatientContextType {
  // Data
  patients: Patient[];
  currentPatient: Patient | null;
  selectedPatientId: number | null;
  
  // Estado 
  loading: boolean;
  error: string | null;
  
  // Acciones
  loadPatients: () => Promise<Patient[] | null>;
  loadPatient: (id: number) => Promise<Patient | null>;
  selectPatient: (id: number | null) => void;
  saveEvaluationDraft: (id: number, text: string) => Promise<boolean>;
  refreshPatientData: (id?: number) => Promise<void>;
}

// Crear contexto con valores por defecto
const PatientContext = createContext<PatientContextType>({
  patients: [],
  currentPatient: null,
  selectedPatientId: null,
  loading: false,
  error: null,
  loadPatients: async () => null,
  loadPatient: async () => null,
  selectPatient: () => {},
  saveEvaluationDraft: async () => false,
  refreshPatientData: async () => {}
});

// Hook personalizado para usar el contexto
export const usePatientContext = (): PatientContextType => useContext(PatientContext);

// Proveedor del contexto
export const PatientProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Estados
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const { withErrorHandling } = useError();
  const { 
    getCachedPatients, 
    getCachedPatient, 
    cachePatients, 
    cachePatient, 
    isPatientsListCached, 
    isPatientCached 
  } = usePatientCache();

  // Seleccionar un paciente (no carga datos, solo establece el ID)
  const selectPatient = (patientId: number | null) => {
    setSelectedPatientId(patientId);
    
    // Si el paciente está en caché, establecerlo como actual
    if (patientId !== null) {
      const cachedPatient = getCachedPatient(patientId);
      if (cachedPatient) {
        setCurrentPatient(cachedPatient);
      }
    } else {
      setCurrentPatient(null);
    }
  };

  // Cargar la lista de pacientes
  const loadPatients = async (): Promise<Patient[] | null> => {
    // Verificar caché primero
    if (isPatientsListCached()) {
      const cachedData = getCachedPatients();
      if (cachedData) {
        setPatients(cachedData);
        return cachedData;
      }
    }
    
    setLoading(true);
    setError(null);
    
    const result = await withErrorHandling(
      async () => {
        const data = await getPatients();
        setPatients(data);
        cachePatients(data); // Almacenar en caché
        return data;
      },
      'Error al cargar la lista de pacientes',
      ErrorSource.API,
      { component: 'PatientProvider' }
    );

    if (!result) {
      setError('No se pudieron cargar los pacientes');
      message.error('No se pudieron cargar los pacientes');
    }
    
    setLoading(false);
    return result;
  };

  // Cargar un paciente específico
  const loadPatient = async (patientId: number): Promise<Patient | null> => {
    if (!patientId) return null;
    
    // Verificar caché primero
    if (isPatientCached(patientId)) {
      const cachedData = getCachedPatient(patientId);
      if (cachedData) {
        // Solo actualizar el paciente actual si el ID seleccionado coincide
        if (selectedPatientId === patientId) {
          setCurrentPatient(cachedData);
        }
        return cachedData;
      }
    }
    
    setLoading(true);
    setError(null);
    
    const result = await withErrorHandling(
      async () => {
        const data = await getPatientById(patientId);
        
        // Almacenar en caché
        cachePatient(data);
        
        // Solo actualizar el paciente actual si el ID seleccionado coincide
        if (selectedPatientId === patientId) {
          setCurrentPatient(data);
        }
        
        return data;
      },
      `Error al cargar el paciente ${patientId}`,
      ErrorSource.API,
      { 
        component: 'PatientProvider', 
        patientId 
      }
    );

    if (!result) {
      setError(`No se pudo cargar la información del paciente ${patientId}`);
      message.error('No se pudo cargar la información del paciente');
    }
    
    setLoading(false);
    return result;
  };

  // Guardar el borrador de evaluación
  const saveEvaluationDraft = async (patientId: number, draftText: string): Promise<boolean> => {
    if (!patientId) return false;
    
    setLoading(true);
    setError(null);
    
    const result = await withErrorHandling(
      async () => {
        const updatedPatient = await updateEvaluationDraft(patientId, draftText);
        
        // Actualizar caché
        cachePatient(updatedPatient);
        
        // Actualizar estado si es el paciente actual
        if (selectedPatientId === patientId) {
          setCurrentPatient(updatedPatient);
        }
        
        // Actualizar también en la lista de pacientes
        setPatients(prev => 
          prev.map(p => p.id === patientId ? updatedPatient : p)
        );
        
        message.success('Borrador guardado correctamente');
        return true;
      },
      'Error al guardar el borrador de evaluación',
      ErrorSource.API,
      { 
        component: 'PatientProvider', 
        patientId,
        draftLength: draftText?.length 
      }
    );
    
    setLoading(false);
    return result === true;
  };
  
  // Actualizar datos de pacientes forzando recarga desde la API
  const refreshPatientData = async (patientId?: number) => {
    if (patientId) {
      // Recargar un paciente específico
      await loadPatient(patientId);
    } else {
      // Recargar la lista completa
      await loadPatients();
      
      // Si hay un paciente seleccionado, recargarlo también
      if (selectedPatientId) {
        await loadPatient(selectedPatientId);
      }
    }
  };
  
  // Cargar pacientes al montar el componente
  useEffect(() => {
    loadPatients();
  }, []);

  // Cargar paciente cuando cambia el ID seleccionado
  useEffect(() => {
    if (selectedPatientId) {
      loadPatient(selectedPatientId);
    } else {
      setCurrentPatient(null);
    }
  }, [selectedPatientId]);

  // Valor del contexto
  const contextValue: PatientContextType = {
    patients,
    currentPatient,
    selectedPatientId,
    loading,
    error,
    loadPatients,
    loadPatient,
    selectPatient,
    saveEvaluationDraft,
    refreshPatientData
  };

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
}; 