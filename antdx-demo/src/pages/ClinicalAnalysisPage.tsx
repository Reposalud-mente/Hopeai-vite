import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Card, Space, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ClinicalChatPanel from '../components/clinical/ClinicalChatPanel';
import { usePatientContext } from '../context/PatientContext';
import useLoadingState from '../hooks/useLoadingState';
import LoadingFeedback from '../components/LoadingFeedback';
import UserFlowOptimizer from '../components/UserFlowOptimizer';
import type { ClinicalQuery } from '../types/ClinicalQuery';
import { createClinicalQuery, toggleFavoriteQuery, getPatientQueries } from '../api/clinicalQueries';
import { useError } from '../context/ErrorContext';
import { ErrorSource } from '../context/ErrorContext';

const { Title } = Typography;

/**
 * Página para análisis clínico interactivo con IA
 */
const ClinicalAnalysisPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { loadPatient, currentPatient, selectPatient } = usePatientContext();
  const [patientLoaded, setPatientLoaded] = useState(false);
  const [queries, setQueries] = useState<ClinicalQuery[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Usar el contexto de errores
  const { withErrorHandling } = useError();
  
  // Estado para la carga del paciente
  const patientLoadingState = useLoadingState({
    operation: 'fetch',
    entity: 'patient',
    messageLoading: 'Cargando datos del paciente...',
    messageSuccess: 'Datos del paciente cargados',
    messageError: 'Error al cargar datos del paciente'
  });
  
  // Estado para la carga de consultas previas
  const queriesLoadingState = useLoadingState({
    operation: 'fetch',
    entity: 'data',
    messageLoading: 'Cargando consultas previas...',
    messageSuccess: 'Consultas cargadas',
    messageError: 'Error al cargar consultas previas',
    showNotification: false
  });
  
  // Cargar datos del paciente
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) {
        setErrorMessage('ID de paciente no proporcionado');
        return;
      }
      
      try {
        await patientLoadingState.runWithLoading(async () => {
          // Intentar convertir a número si es posible
          const numericId = Number(patientId);
          const isNumericId = !isNaN(numericId);
          
          if (isNumericId) {
            // Si es un ID numérico, usamos las funciones del contexto que esperan números
            selectPatient(numericId);
            const patientData = await loadPatient(numericId);
            if (patientData) {
              setPatientLoaded(true);
            }
          } else {
            // Si el ID no es numérico, manejamos el error apropiadamente
            console.error('ID de paciente no numérico:', patientId);
            setErrorMessage('Formato de ID de paciente no válido. Se espera un ID numérico.');
          }
        });
      } catch (error) {
        console.error('Error al cargar el paciente:', error);
        setErrorMessage('Error al cargar los datos del paciente');
      }
    };
    
    loadPatientData();
    
    // Limpiar al desmontar
    return () => {
      selectPatient(null);
    };
  }, [patientId]);
  
  // Cargar consultas previas
  useEffect(() => {
    const loadQueries = async () => {
      if (!patientId) return;
      
      try {
        await queriesLoadingState.runWithLoading(async () => {
          const response = await withErrorHandling(
            async () => await getPatientQueries(patientId, { limit: 10 }),
            'Error al cargar consultas previas',
            ErrorSource.API,
            { component: 'ClinicalAnalysisPage' }
          );
          
          if (response.success && response.data) {
            setQueries(response.data.queries);
          }
        });
      } catch (error) {
        console.error('Error al cargar consultas previas:', error);
      }
    };
    
    if (patientLoaded) {
      loadQueries();
    }
  }, [patientId, patientLoaded]);
  
  // Manejar navegación de regreso
  const handleBack = () => {
    navigate(`/pacientes/${patientId}`);
  };
  
  // Manejar envío de consulta
  const handleSubmitQuery = async (question: string): Promise<ClinicalQuery | undefined> => {
    if (!question.trim() || !patientId) return undefined;
    
    try {
      const response = await withErrorHandling(
        async () => await createClinicalQuery(patientId, question),
        'Error al procesar la consulta',
        ErrorSource.API,
        { component: 'ClinicalAnalysisPage' }
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setErrorMessage(response.error || 'Error al procesar la consulta');
        return undefined;
      }
    } catch (error) {
      console.error('Error al enviar consulta:', error);
      setErrorMessage('No se pudo procesar la consulta. Intente de nuevo más tarde.');
      return undefined;
    }
  };
  
  // Manejar favoritos
  const handleToggleFavorite = async (queryId: number, isFavorite: boolean): Promise<void> => {
    try {
      const response = await withErrorHandling(
        async () => await toggleFavoriteQuery(queryId, isFavorite),
        'Error al actualizar favorito',
        ErrorSource.API,
        { component: 'ClinicalAnalysisPage' }
      );
      
      if (!response.success) {
        setErrorMessage(response.error || 'Error al actualizar favorito');
      }
    } catch (error) {
      console.error('Error al cambiar favorito:', error);
      setErrorMessage('No se pudo actualizar el estado de favorito');
    }
  };
  
  // Si está cargando, mostrar spinner
  if (patientLoadingState.isLoading && !patientLoaded) {
    return (
      <LoadingFeedback 
        loading={true} 
        loadingText="Cargando información del paciente..." 
      />
    );
  }
  
  // Si hay error al cargar, mostrar mensaje
  if (patientLoadingState.isError) {
    return (
      <LoadingFeedback 
        loading={false} 
        error={patientLoadingState.error}
        errorText="No se pudo cargar la información del paciente" 
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // Si no hay paciente, mostrar mensaje
  if (!currentPatient) {
    return (
      <div style={{ padding: '20px' }}>
        <Title level={4}>Paciente no encontrado</Title>
        <Button onClick={() => navigate('/pacientes')}>Volver a la lista</Button>
      </div>
    );
  }
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Volver
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Análisis Clínico: {currentPatient.name}
          </Title>
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
      
      {/* Añadir UserFlowOptimizer */}
      {currentPatient && (
        <UserFlowOptimizer 
          currentView="analysis" 
          patient={currentPatient} 
          previousPath={`/pacientes/${patientId}`}
        />
      )}
      
      <Card>
        <ClinicalChatPanel 
          patientId={patientId || '0'}
          onSubmitQuery={handleSubmitQuery}
          onToggleFavorite={handleToggleFavorite}
          initialQueries={queries}
          loading={queriesLoadingState.isLoading}
        />
      </Card>
    </div>
  );
};

export default ClinicalAnalysisPage; 