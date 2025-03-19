import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { getPatients, getPatientById, updateEvaluationDraft } from '../api/patients';

// Crear el contexto
const PatientContext = createContext();

// Hook personalizado para usar el contexto
export const usePatientContext = () => useContext(PatientContext);

// Proveedor del contexto
export const PatientProvider = ({ children }) => {
  // Estados
  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  const loadPatient = async (patientId) => {
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
  const saveEvaluationDraft = async (patientId, draftText) => {
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
  const contextValue = {
    patients,
    currentPatient,
    loading,
    error,
    loadPatients,
    loadPatient,
    saveEvaluationDraft
  };

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
}; 