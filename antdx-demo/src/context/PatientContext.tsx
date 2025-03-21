import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { getPatients, getPatientById, updateEvaluationDraft } from '../api/patients';
import { Patient } from '../types/clinical-types';
import { useError } from '../hooks/useError';
import { ErrorSource } from './ErrorContext';

// Define the shape of our context
export interface PatientContextType {
  patients: Patient[];
  currentPatient: Patient | null;
  loading: boolean;
  error: string | null;
  loadPatient: (id: number) => Promise<void>;
  saveEvaluationDraft: (id: number, text: string) => Promise<boolean>;
}

// Create context with default values
const PatientContext = createContext<PatientContextType>({
  patients: [],
  currentPatient: null,
  loading: false,
  error: null,
  loadPatient: async () => {},
  saveEvaluationDraft: async () => false
});

// Hook personalizado para usar el contexto
export const usePatientContext = (): PatientContextType => useContext(PatientContext);

// Proveedor del contexto
export const PatientProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Estados
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { withErrorHandling } = useError();

  // Cargar la lista de pacientes
  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    
    const result = await withErrorHandling(
      async () => {
        const data = await getPatients();
        setPatients(data);
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
  };

  // Cargar un paciente específico
  const loadPatient = async (patientId: number) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    const result = await withErrorHandling(
      async () => {
        const data = await getPatientById(patientId);
        setCurrentPatient(data);
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
  };

  // Guardar el borrador de evaluación
  const saveEvaluationDraft = async (patientId: number, draftText: string): Promise<boolean> => {
    if (!patientId) return false;
    
    setLoading(true);
    setError(null);
    
    const result = await withErrorHandling(
      async () => {
        const updatedPatient = await updateEvaluationDraft(patientId, draftText);
        setCurrentPatient(updatedPatient);
        
        // Actualizar también en la lista
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
  
  // Cargar pacientes al montar el componente
  useEffect(() => {
    loadPatients();
  }, []);

  // Valor del contexto
  const contextValue: PatientContextType = {
    patients,
    currentPatient,
    loading,
    error,
    loadPatient,
    saveEvaluationDraft
  };

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
}; 