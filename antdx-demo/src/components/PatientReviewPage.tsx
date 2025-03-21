import React, { useState, lazy, Suspense } from 'react';
import { 
  Input, 
  Button,
  Flex,
  Layout,
  Drawer,
  message,
  Spin
} from 'antd';

import { Bubble } from '@ant-design/x';
import type { SuggestionItem } from '@ant-design/x';

// Importamos nuestros hooks personalizados
import { useClinicalAI } from '../hooks/useClinicalAI';
import { useAnalysisStream } from '../hooks/useAnalysisStream';
import { useDiagnosisSuggestions } from '../hooks/useDiagnosisSuggestions';
import { usePatient } from '../hooks/usePatient';

// Importamos nuestros componentes refactorizados usando lazy loading
const PatientHeader = lazy(() => import('./PatientHeader'));
const ClinicalEditor = lazy(() => import('./ClinicalEditor'));
const DiagnosisPanel = lazy(() => import('./DiagnosisPanel'));
const RecommendationList = lazy(() => import('./RecommendationList'));

const { Header, Content } = Layout;

// Helper function para convertir diagnósticos a SuggestionItems
const mapDiagnosisToSuggestionItems = (diagnoses: { 
  name: string; 
  description: string; 
  confidence: string 
}[]): SuggestionItem[] => {
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
  const [currentQuestion, setCurrentQuestion] = useState('');
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
  
  // PASO 2: PROCESAMIENTO - Análisis clínico de los datos
  // Elegir la implementación de análisis adecuada según la configuración
  const { 
    thoughtSteps: enhancedThoughtSteps, 
    loading: enhancedAnalysisLoading, 
    error: enhancedAnalysisError,
    analysisState
  } = useAnalysisStream(useEnhancedAnalysis ? evaluationText : '');
  
  const { 
    thoughtSteps: legacyThoughtSteps, 
    suggestedDiagnoses, 
    chatHistory, 
    loading: aiLoading, 
    error: aiError, 
    askQuestion 
  } = useClinicalAI(!useEnhancedAnalysis ? evaluationText : '');
  
  // Determinar los datos a presentar según la implementación utilizada
  const thoughtSteps = useEnhancedAnalysis ? enhancedThoughtSteps : legacyThoughtSteps;
  const displayedSuggestions = useEnhancedAnalysis 
    ? useDiagnosisSuggestions(analysisState).diagnosisSuggestions
    : mapDiagnosisToSuggestionItems(suggestedDiagnoses);
  
  // Estado de carga combinado
  const loading = patientLoading || (useEnhancedAnalysis ? enhancedAnalysisLoading : aiLoading);
  
  // Manejo de errores centralizado
  React.useEffect(() => {
    const error = useEnhancedAnalysis ? enhancedAnalysisError : aiError;
    if (error) {
      messageApi.error(error);
    }
  }, [enhancedAnalysisError, aiError, messageApi, useEnhancedAnalysis]);

  // Función para manejar las consultas al asistente
  const handleSendQuestion = async () => {
    if (!currentQuestion.trim()) return;
    await askQuestion(currentQuestion);
    setCurrentQuestion('');
  };

  // Renderizamos un indicador de carga si los datos aún no están disponibles
  if (patientLoading || !currentPatient) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh' }}>
        <Spin size="large" tip="Cargando información del paciente..." />
      </Flex>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      
      <Layout>
        {/* PASO 1: RECOLECCIÓN - Header con información del paciente */}
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <Suspense fallback={<Spin size="small" />}>
            <PatientHeader currentPatient={currentPatient} />
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
            
            {/* PASO 3: PRESENTACIÓN - Panel de diagnóstico */}
            {(thoughtSteps.length > 0 || displayedSuggestions.length > 0) && (
              <Suspense fallback={<Spin tip="Cargando análisis..." />}>
                <DiagnosisPanel 
                  thoughtSteps={thoughtSteps}
                  diagnosisSuggestions={displayedSuggestions}
                  loading={loading}
                  error={enhancedAnalysisError || aiError}
                />
              </Suspense>
            )}
            
            {/* PASO 3: PRESENTACIÓN - Lista de recomendaciones */}
            {thoughtSteps.length > 0 && (
              <Suspense fallback={<Spin tip="Cargando recomendaciones..." />}>
                <RecommendationList 
                  recommendations={analysisState?.treatmentSuggestions?.map((treatment, index) => ({
                    id: String(index + 1),
                    title: treatment.split(': ')[0] || treatment,
                    description: treatment.split(': ')[1] || '',
                    type: 'tratamiento',
                    priority: 'media'
                  })) || []}
                  loading={loading}
                />
              </Suspense>
            )}
          </Flex>
        </Content>
      </Layout>
      
      {/* Asistente IA - Complemento a los 3 pasos principales */}
      <Drawer
        title="Asistente Clínico IA"
        placement="right"
        width={500}
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
          {/* Área de visualización del chat */}
          <div style={{ flex: 1, overflow: 'auto', marginBottom: 16, padding: 8 }}>
            {chatHistory.map((msg, idx) => (
              <Bubble 
                key={idx}
                type={msg.type === 'user' ? 'primary' : 'default'}
                content={msg.content}
              />
            ))}
          </div>
          
          {/* Área de entrada de preguntas */}
          <div style={{ display: 'flex', marginTop: 'auto' }}>
            <Input 
              placeholder="Haz una pregunta sobre este paciente..." 
              value={currentQuestion}
              onChange={e => setCurrentQuestion(e.target.value)}
              onPressEnter={handleSendQuestion}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button 
              type="primary"
              onClick={handleSendQuestion}
            >
              Enviar
            </Button>
          </div>
        </div>
      </Drawer>
    </Layout>
  );
};

export default React.memo(PatientReviewPage); 