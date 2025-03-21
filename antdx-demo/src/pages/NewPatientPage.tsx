import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PatientForm from '../components/PatientForm';
import { Patient } from '../types/clinical-types';
import { usePatientCache } from '../hooks/usePatientCache';
import useLoadingState from '../hooks/useLoadingState';

const { Title } = Typography;

/**
 * Página para crear un nuevo paciente
 */
const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { cachePatient } = usePatientCache();
  
  // Estado de carga para creación de paciente
  const patientCreateState = useLoadingState({
    operation: 'create',
    entity: 'patient',
    showNotification: true
  });

  // Guardar nuevo paciente
  const handleSavePatient = async (patient: Patient) => {
    try {
      await patientCreateState.runWithLoading(async () => {
        // En un entorno real, aquí haríamos una llamada a la API
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // Simular creación en la API (generando un ID único)
            const newPatient = {
              ...patient,
              id: Date.now(), // ID único basado en timestamp
            };
            
            // Guardar en caché
            cachePatient(newPatient);
            
            // Redirigir a la página de detalles del paciente
            navigate(`/pacientes/${newPatient.id}`);
            
            resolve();
          }, 800);
        });
      });
    } catch (error) {
      console.error('Error creando paciente:', error);
    }
  };

  // Cancelar creación
  const handleCancel = () => {
    navigate('/pacientes');
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
            Volver
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Nuevo Paciente
          </Title>
        </Space>
      </div>
      
      <Card>
        <PatientForm 
          onSave={handleSavePatient} 
          onCancel={handleCancel}
          isLoading={patientCreateState.isLoading}
        />
      </Card>
    </div>
  );
};

export default NewPatientPage; 