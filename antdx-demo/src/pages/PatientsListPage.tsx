import React, { useEffect, useState } from 'react';
import { Typography, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PatientList from '../components/PatientList';
import { usePatientCache } from '../hooks/usePatientCache';
import useLoadingState from '../hooks/useLoadingState';
import { Patient } from '../types/clinical-types';

const { Title } = Typography;

// Datos mock para desarrollo (serán reemplazados por datos reales de la API)
const mockPatients: Patient[] = [
  {
    id: 1,
    name: 'Ana María González',
    age: 34,
    status: 'active',
    evaluationDate: '2023-03-15',
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    age: 45,
    status: 'inactive',
    evaluationDate: '2023-03-10',
  },
  {
    id: 3,
    name: 'Laura Sánchez',
    age: 28,
    status: 'active',
    evaluationDate: '2023-03-18',
  },
  {
    id: 4,
    name: 'Javier Mendoza',
    age: 52,
    status: 'pending',
    evaluationDate: '2023-02-25',
  },
];

/**
 * PatientsListPage muestra la lista de pacientes con opciones de búsqueda y filtrado.
 * Permite acceder a los detalles de cada paciente y crear nuevos pacientes.
 */
const PatientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const {
    getCachedPatients,
    cachePatients,
    isPatientsListCached,
  } = usePatientCache();

  // Estado de carga para lista de pacientes
  const patientsLoadingState = useLoadingState({
    operation: 'fetch',
    entity: 'patient',
    messageLoading: 'Cargando lista de pacientes...',
    messageSuccess: 'Lista de pacientes cargada',
    messageError: 'Error al cargar la lista de pacientes'
  });

  // Cargar pacientes (desde caché o API)
  useEffect(() => {
    const loadPatients = async () => {
      try {
        await patientsLoadingState.runWithLoading(async () => {
          // Verificar si tenemos datos en caché
          if (isPatientsListCached()) {
            const cachedData = getCachedPatients();
            if (cachedData) {
              setPatients(cachedData);
              return;
            }
          }
          
          // En un entorno real, aquí haríamos una llamada a la API
          // Por ahora usamos datos mock
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              setPatients(mockPatients);
              cachePatients(mockPatients);
              resolve();
            }, 500); // Simulamos un pequeño retraso para mostrar el estado de carga
          });
        });
      } catch (error) {
        console.error('Error cargando pacientes:', error);
      }
    };
    
    loadPatients();
  }, [getCachedPatients, cachePatients, isPatientsListCached, patientsLoadingState]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Pacientes</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/pacientes/nuevo')}
          >
            Nuevo Paciente
          </Button>
        </Space>
      </div>
      <PatientList patients={patients} isLoading={patientsLoadingState.isLoading} />
    </div>
  );
};

export default PatientsListPage;