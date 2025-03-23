import React, { useEffect, useState } from 'react';
import { Typography, Button, Space, Alert, Select, Row, Col, Card } from 'antd';
import { PlusOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PatientList from '../components/PatientList';
import { usePatientCache } from '../hooks/usePatientCache';
import useLoadingState from '../hooks/useLoadingState';
import { Patient } from '../types/clinical-types';
import { getPatients } from '../api/patients';
import { useError } from '../context/ErrorContext';
import { ErrorSource } from '../context/ErrorContext';

const { Title } = Typography;
const { Option } = Select;

// Definir opciones de estado para el filtro
const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completado' }
];

/**
 * PatientsListPage muestra la lista de pacientes con opciones de búsqueda y filtrado.
 * Permite acceder a los detalles de cada paciente y crear nuevos pacientes.
 */
const PatientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    getCachedPatients,
    cachePatients,
    isPatientsListCached,
    invalidateCache,
  } = usePatientCache();
  
  // Usar el contexto de errores
  const { withErrorHandling } = useError();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado de carga para lista de pacientes
  const patientsLoadingState = useLoadingState({
    operation: 'fetch',
    entity: 'patient',
    messageLoading: 'Cargando lista de pacientes...',
    messageSuccess: 'Lista de pacientes cargada',
    messageError: 'Error al cargar la lista de pacientes',
    showNotification: false // Desactivar completamente las notificaciones
  });

  // Aplicar filtros a la lista de pacientes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(patients.filter(patient => patient.status === statusFilter));
    }
  }, [patients, statusFilter]);

  // Cargar pacientes (desde caché o API)
  const loadPatients = async (forceRefresh: boolean = false) => {
    setErrorMessage(null);
    
    try {
      await patientsLoadingState.runWithLoading(async () => {
        // Verificar si tenemos datos en caché y no se está forzando refresh
        if (!forceRefresh && isPatientsListCached()) {
          const cachedData = getCachedPatients();
          if (cachedData) {
            setPatients(cachedData);
            return;
          }
        }
        
        // Si llegamos aquí, necesitamos cargar desde la API
        const result = await withErrorHandling(
          async () => await getPatients(),
          'Error al cargar pacientes',
          ErrorSource.API,
          { component: 'PatientsListPage' }
        );
        
        if (result) {
          setPatients(result);
          cachePatients(result);
        }
      });
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      setErrorMessage('No se pudo cargar la lista de pacientes. Intente de nuevo más tarde.');
    }
  };

  // Efecto para cargar los datos iniciales
  useEffect(() => {
    loadPatients();
  }, []);

  const handleRefresh = () => {
    invalidateCache();
    loadPatients(true);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Pacientes</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={patientsLoadingState.isLoading}
          >
            Actualizar
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/pacientes/nuevo')}
          >
            Nuevo Paciente
          </Button>
        </Space>
      </div>
      
      {errorMessage && (
        <Alert
          message="Error"
          description={errorMessage}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setErrorMessage(null)}
        />
      )}
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <FilterOutlined />
              <span>Filtros:</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <span>Estado:</span>
              <Select 
                defaultValue="all" 
                style={{ width: 120 }} 
                onChange={handleStatusFilterChange}
                value={statusFilter}
              >
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>
      
      <PatientList patients={filteredPatients} isLoading={patientsLoadingState.isLoading} />
    </div>
  );
};

export default PatientsListPage;