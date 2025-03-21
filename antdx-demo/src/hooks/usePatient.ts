import { useState, useEffect } from 'react';
import { usePatientContext, Patient } from '../context/PatientContext';
import { message } from 'antd';

interface UsePatientResult {
  currentPatient: Patient | null;
  evaluationText: string;
  loading: boolean;
  setEvaluationText: (text: string) => void;
  handleSaveDraft: () => Promise<boolean>;
  handleSelectPatient: (patientId: number) => void;
}

export const usePatient = (): UsePatientResult => {
  const [evaluationText, setEvaluationText] = useState('');
  
  const {
    currentPatient,
    patients,
    loading,
    loadPatient,
    saveEvaluationDraft
  } = usePatientContext();
  
  // Seleccionamos el primer paciente por defecto
  useEffect(() => {
    if (patients.length > 0 && !currentPatient) {
      loadPatient(patients[0].id);
    }
  }, [patients, currentPatient, loadPatient]);
  
  // Actualizamos el texto del borrador cuando cambia el paciente
  useEffect(() => {
    if (currentPatient) {
      setEvaluationText(currentPatient.evaluationDraft || '');
    }
  }, [currentPatient]);
  
  // Función para guardar el borrador
  const handleSaveDraft = async (): Promise<boolean> => {
    if (!currentPatient) return false;
    
    const success = await saveEvaluationDraft(currentPatient.id, evaluationText);
    if (success) {
      message.success('Borrador guardado correctamente');
    }
    return success;
  };
  
  // Función para seleccionar un paciente
  const handleSelectPatient = (patientId: number) => {
    loadPatient(patientId);
  };

  return {
    currentPatient,
    evaluationText,
    loading,
    setEvaluationText,
    handleSaveDraft,
    handleSelectPatient
  };
}; 