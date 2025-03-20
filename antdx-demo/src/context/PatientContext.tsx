import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { getPatients, getPatientById, updateEvaluationDraft } from '../api/patients';

// Define interfaces for our types
export interface Patient {
  id: number;
  name: string;
  status: string;
  evaluationDate?: string;
  psychologist?: string;
  consultReason?: string;
  evaluationDraft?: string;
  testResults?: {
    name: string;
    date?: string;
    results?: any;
  }[];
}

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

  // Cargar la lista de pacientes
  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (_err) {
      setError('Error al cargar la lista de pacientes');
      message.error('No se pudieron cargar los pacientes');
    } finally {
      setLoading(false);
    }
  };

  // Cargar un paciente específico
  const loadPatient = async (patientId: number) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getPatientById(patientId);
      setCurrentPatient(data);
    } catch (_err) {
      setError(`Error al cargar el paciente ${patientId}`);
      message.error('No se pudo cargar la información del paciente');
    } finally {
      setLoading(false);
    }
  };

  // Guardar el borrador de evaluación
  const saveEvaluationDraft = async (patientId: number, draftText: string) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const updatedPatient = await updateEvaluationDraft(patientId, draftText);
      setCurrentPatient(updatedPatient);
      
      // Actualizar también en la lista
      setPatients(prev => 
        prev.map(p => p.id === patientId ? updatedPatient : p)
      );
      
      message.success('Borrador guardado correctamente');
      return true;
    } catch (_err) {
      setError('Error al guardar el borrador');
      message.error('No se pudo guardar el borrador');
      return false;
    } finally {
      setLoading(false);
    }
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