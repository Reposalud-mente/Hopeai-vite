import React, { useState, lazy, Suspense } from 'react';
import { Flex, Layout, Spin, message } from 'antd';

// Importamos nuestro nuevo hook consolidado
import { useClinicalAnalysis } from '../hooks/useClinicalAnalysis';
import { usePatient } from '../hooks/usePatient';
import { useDiagnosisSuggestions } from '../hooks/useDiagnosisSuggestions';

// Importamos nuestros componentes refactorizados
import PatientAnalysisContainer from './PatientAnalysisContainer';
import ClinicalAssistantDrawer from './ClinicalAssistantDrawer';

// Componentes con carga diferida
const PatientHeader = lazy(() => import('./PatientHeader'));
const ClinicalEditor = lazy(() => import('./ClinicalEditor'));

const { Header, Content } = Layout;

// Helper function para convertir diagnósticos a SuggestionItems
const mapDiagnosisToSuggestionItems = (diagnoses: { 
  name: string; 
  description: string; 
  confidence: string 
}[]) => {
  return diagnoses.map(d => ({
    label: d.name,
    value: d.name,
    description: d.description,
    // Map confidence to severity level
    severity: d.confidence === 'Alta' ? 'success' : 
              d.confidence === 'Media' ? 'warning' : 'error'
  }));
};

/**
 * PatientReviewPage implementa el flujo clínico principal:
 * 1. Recolección - Captura de datos del paciente
 * 2. Procesamiento - Análisis clínico de la información
 * 3. Presentación - Visualización de resultados y recomendaciones
 */
const PatientReviewPage = () => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [useEnhancedAnalysis] = useState(true);
  
  // PASO 1: RECOLECCIÓN - Gestión de datos del paciente
  const {
    currentPatient,
    evaluationText,
    loading: patientLoading,
    setEvaluationText,
    handleSaveDraft
  } = usePatient();
  
  // PASO 2: PROCESAMIENTO - Análisis clínico unificado
  const { 
    thoughtSteps,
    suggestedDiagnoses,
    chatHistory,
    loading: analysisLoading,
    error: analysisError,
    analysisState,
    askQuestion
  } = useClinicalAnalysis(evaluationText, useEnhancedAnalysis);
  
  // Preparar datos para la visualización
  const displayedSuggestions = useEnhancedAnalysis 
    ? useDiagnosisSuggestions(analysisState).diagnosisSuggestions
    : mapDiagnosisToSuggestionItems(suggestedDiagnoses);
  
  // Estado de carga combinado
  const loading = patientLoading || analysisLoading;
  
  // Manejo de errores centralizado
  React.useEffect(() => {
    if (analysisError) {
      messageApi.error(analysisError);
    }
  }, [analysisError, messageApi]);

  // Renderizamos un indicador de carga si los datos aún no están disponibles
  if (patientLoading || !currentPatient) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh' }}>
        <Spin size="large" tip="Cargando información del paciente..." />
      </Flex>
    );
  }

  // Preparar recomendaciones de tratamiento desde el análisis
  const treatmentSuggestions = analysisState?.treatmentSuggestions?.map((treatment, index) => ({
    id: String(index + 1),
    title: treatment.split(': ')[0] || treatment,
    description: treatment.split(': ')[1] || '',
    type: 'tratamiento',
    priority: 'media'
  })) || [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      
      <Layout>
        {/* PASO 1: RECOLECCIÓN - Header con información del paciente */}
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <Suspense fallback={<Spin size="small" />}>
            <PatientHeader 
              currentPatient={currentPatient}
              onOpenAssistant={() => setShowAIAssistant(true)} 
            />
          </Suspense>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Flex vertical gap={24}>
            {/* PASO 1: RECOLECCIÓN - Editor para captura de datos clínicos */}
            <Suspense fallback={<Spin tip="Cargando editor clínico..." />}>
              <ClinicalEditor 
                evaluationText={evaluationText} 
                setEvaluationText={setEvaluationText} 
                handleSaveDraft={handleSaveDraft}
                loading={loading}
              />
            </Suspense>
            
            {/* PASO 3: PRESENTACIÓN - Análisis y recomendaciones */}
            <PatientAnalysisContainer
              thoughtSteps={thoughtSteps}
              diagnosisSuggestions={displayedSuggestions}
              loading={loading}
              error={analysisError}
              treatmentSuggestions={treatmentSuggestions}
            />
          </Flex>
        </Content>
      </Layout>
      
      {/* Asistente IA - Complemento a los 3 pasos principales */}
      <ClinicalAssistantDrawer
        visible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        chatHistory={chatHistory}
        onSendQuestion={askQuestion}
        loading={analysisLoading}
      />
    </Layout>
  );
};

export default React.memo(PatientReviewPage); 