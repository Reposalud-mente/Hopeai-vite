import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Tabs, Space, Typography, Modal, Tooltip } from 'antd';
import { EditOutlined, ArrowLeftOutlined, HistoryOutlined, CommentOutlined } from '@ant-design/icons';
import { usePatientCache } from '../hooks/usePatientCache';
import useLoadingState from '../hooks/useLoadingState';
import PatientForm from '../components/PatientForm';
import PatientHistory from '../components/PatientHistory';
import LoadingFeedback from '../components/LoadingFeedback';
import UserFlowOptimizer from '../components/UserFlowOptimizer';
import { Patient, ClinicalEvaluation } from '../types/clinical-types';

const { Title } = Typography;

// Datos mock para pruebas (serán reemplazados por datos reales de la API)
const mockEvaluations: ClinicalEvaluation[] = [
  {
    id: 101,
    patientId: 1,
    date: '2023-04-10',
    psychologist: 'Dr. Martínez',
    content: 'Paciente presenta síntomas de ansiedad moderada. Se recomienda terapia cognitivo-conductual.',
    diagnoses: [{ 
      name: 'Trastorno de ansiedad', 
      description: 'Trastorno caracterizado por ansiedad y preocupación excesivas',
      confidence: 'alta' 
    }],
    recommendations: [{ 
      text: 'Terapia cognitivo-conductual semanal', 
      priority: 'alta' 
    }],
  },
  {
    id: 102,
    patientId: 1,
    date: '2023-03-15',
    psychologist: 'Dr. Martínez',
    content: 'Evaluación inicial. Paciente refiere dificultades para dormir y preocupaciones constantes.',
    diagnoses: [{ 
      name: 'Insomnio', 
      description: 'Trastorno del sueño caracterizado por dificultad para dormir',
      confidence: 'media'
    }],
    recommendations: [{ 
      text: 'Higiene del sueño', 
      priority: 'media' 
    }],
  },
];

/**
 * Página de detalles del paciente con capacidad de ver y editar información
 */
const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [evaluations, setEvaluations] = useState<ClinicalEvaluation[]>([]);
  
  const {
    getCachedPatient,
    cachePatient,
    isPatientCached,
  } = usePatientCache();

  // Estado de carga para cargar los datos del paciente
  const patientLoadingState = useLoadingState({
    operation: 'fetch',
    entity: 'patient',
    messageLoading: 'Cargando información del paciente...',
    messageSuccess: 'Información del paciente cargada',
    messageError: 'Error al cargar la información del paciente',
    showNotification: false // Desactivar completamente las notificaciones
  });

  // Estado de carga para guardar los datos del paciente
  const patientSaveState = useLoadingState({
    operation: 'update',
    entity: 'patient',
    showNotification: true
  });

  // Cargar paciente y evaluaciones de forma memoizada
  const loadPatient = useCallback(async () => {
    if (!id) return;
    
    const patientId = parseInt(id);
    
    try {
      await patientLoadingState.runWithLoading(async () => {
        // Verificar si tenemos datos en caché
        if (isPatientCached(patientId)) {
          const cachedData = getCachedPatient(patientId);
          if (cachedData) {
            setPatient(cachedData);
            
            // En un entorno real, cargariamos las evaluaciones desde la API
            setEvaluations(mockEvaluations.filter(e => e.patientId === patientId));
            return;
          }
        }
        
        // En un entorno real, aquí haríamos una llamada a la API
        // Por ahora usamos datos mock
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // Simulación de datos de paciente desde API
            const mockPatient: Patient = {
              id: patientId,
              name: 'Ana María González',
              status: 'active',
              age: 34,
              gender: 'femenino',
              birthDate: '1989-05-12',
              evaluationDate: '2023-03-15',
              psychologist: 'Dr. Martínez',
              consultReason: 'Paciente refiere sentirse ansiosa y con dificultades para dormir.',
              clinicalHistory: 'Historial de tratamiento previo para ansiedad hace 2 años con buena respuesta.',
              medicalHistory: 'Sin condiciones médicas significativas. No toma medicación regular.',
              familyHistory: 'Madre con historial de depresión.',
              testResults: [
                {
                  name: 'Inventario de Ansiedad de Beck (BAI)',
                  date: '2023-04-05',
                  results: [
                    { scale: 'Puntuación Total', score: 22, interpretation: 'Ansiedad moderada' }
                  ]
                },
                {
                  name: 'Escala de Depresión de Hamilton',
                  date: '2023-04-05',
                  results: [
                    { scale: 'Puntuación Total', score: 8, interpretation: 'Depresión leve' }
                  ]
                }
              ]
            };
            
            setPatient(mockPatient);
            cachePatient(mockPatient);
            
            // Cargar evaluaciones
            setEvaluations(mockEvaluations.filter(e => e.patientId === patientId));
            
            resolve();
          }, 800);
        });
      });
    } catch (error) {
      console.error('Error cargando datos del paciente:', error);
    }
  }, [id, isPatientCached, getCachedPatient, cachePatient]);

  // Cargar datos solo una vez al montar el componente o cuando cambie el ID
  useEffect(() => {
    loadPatient();
  }, [id, loadPatient]);

  // Guardar cambios del paciente
  const handleSavePatient = useCallback(async (updatedPatient: Patient) => {
    try {
      await patientSaveState.runWithLoading(async () => {
        // En un entorno real, aquí haríamos una llamada a la API
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            setPatient(updatedPatient);
            cachePatient(updatedPatient);
            setEditMode(false);
            resolve();
          }, 800);
        });
      });
    } catch (error) {
      console.error('Error guardando datos del paciente:', error);
    }
  }, [cachePatient, patientSaveState]);

  // Cancelar edición
  const handleCancelEdit = useCallback(() => {
    Modal.confirm({
      title: '¿Cancelar cambios?',
      content: 'Los cambios no guardados se perderán',
      okText: 'Sí, cancelar',
      cancelText: 'No, continuar editando',
      onOk: () => setEditMode(false),
    });
  }, []);

  // Volver a la lista de pacientes
  const handleBack = useCallback(() => {
    navigate('/pacientes');
  }, [navigate]);

  // Navegar a la página de análisis interactivo
  const handleNavigateToInteractiveAnalysis = useCallback(() => {
    if (id) {
      navigate(`/pacientes/${id}/analisis-interactivo`);
    }
  }, [navigate, id]);

  // Si está cargando, mostrar spinner
  if (patientLoadingState.isLoading && !patient) {
    return (
      <LoadingFeedback 
        loading={true} 
        loadingText="Cargando información del paciente..." 
      />
    );
  }

  // Si hay error, mostrar mensaje de error con botón para reintentar
  if (patientLoadingState.isError && !patient) {
    return (
      <LoadingFeedback 
        loading={false}
        error={patientLoadingState.error} 
        errorText="No se pudo cargar la información del paciente" 
        showRetry={true}
        onRetry={loadPatient}
      />
    );
  }

  // Si no hay paciente, mostrar mensaje
  if (!patient) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Title level={3}>Paciente no encontrado</Title>
        <Button type="primary" onClick={handleBack}>Volver a la lista</Button>
      </div>
    );
  }

  return (
    <div className="patient-details-page">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Volver
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {patient?.name || 'Detalles del Paciente'}
          </Title>
        </Space>
        
        <Space>
          <Tooltip title="Análisis Clínico Interactivo">
            <Button 
              type="primary"
              icon={<CommentOutlined />}
              onClick={handleNavigateToInteractiveAnalysis}
            >
              Análisis Interactivo
            </Button>
          </Tooltip>
          
          {!editMode ? (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setEditMode(true)}
              loading={patientSaveState.isLoading}
            >
              Editar
            </Button>
          ) : (
            <Space>
              <Button onClick={handleCancelEdit}>Cancelar</Button>
              <Button 
                type="primary" 
                htmlType="submit"
                form="patient-form" 
                loading={patientSaveState.isLoading}
              >
                Guardar
              </Button>
            </Space>
          )}
        </Space>
      </div>

      {/* Añadir UserFlowOptimizer */}
      {patient && (
        <UserFlowOptimizer 
          currentView="details" 
          patient={patient} 
          previousPath="/pacientes"
        />
      )}

      {editMode ? (
        <Card>
          <PatientForm 
            patient={patient} 
            onSave={handleSavePatient} 
            onCancel={handleCancelEdit}
            isLoading={patientSaveState.isLoading}
          />
        </Card>
      ) : (
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          style={{ marginTop: 16 }}
          items={[
            {
              key: 'info',
              label: <span><EditOutlined /> Información</span>,
              children: (
                <Card>
                  <PatientForm 
                    patient={patient} 
                    onSave={() => {}} 
                    onCancel={() => {}}
                    isLoading={false}
                    disabled={true}
                  />
                </Card>
              )
            },
            {
              key: 'history',
              label: <span><HistoryOutlined /> Historial Completo</span>,
              children: (
                <PatientHistory 
                  patient={patient} 
                  evaluations={evaluations}
                  isLoading={patientLoadingState.isLoading}
                />
              )
            }
          ]}
        />
      )}
    </div>
  );
};

export default PatientDetailsPage; 