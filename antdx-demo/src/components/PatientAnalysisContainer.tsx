import React, { Suspense } from 'react';
import { Flex, Spin } from 'antd';
import type { SuggestionItem } from '@ant-design/x';

// Importamos nuestros componentes refactorizados usando lazy loading
const DiagnosisPanel = React.lazy(() => import('./DiagnosisPanel'));
const RecommendationList = React.lazy(() => import('./RecommendationList'));

interface PatientAnalysisContainerProps {
  thoughtSteps: Array<{
    title: string;
    description: string;
    status: 'wait' | 'processing' | 'finish' | 'error';
    icon?: React.ReactNode | null;
  }>;
  diagnosisSuggestions: SuggestionItem[];
  loading: boolean;
  error: string | null;
  treatmentSuggestions?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
  }>;
}

/**
 * Componente contenedor para la visualización del análisis del paciente
 * Muestra el panel de diagnóstico y las recomendaciones de tratamiento
 */
const PatientAnalysisContainer: React.FC<PatientAnalysisContainerProps> = ({
  thoughtSteps,
  diagnosisSuggestions,
  loading,
  error,
  treatmentSuggestions = []
}) => {
  const hasAnalysisResults = thoughtSteps.length > 0 || diagnosisSuggestions.length > 0;
  const hasTreatmentResults = thoughtSteps.length > 0 && treatmentSuggestions.length > 0;

  if (!hasAnalysisResults) {
    return null;
  }

  return (
    <Flex vertical gap={24} data-testid="patient-analysis-container">
      {/* Panel de diagnóstico */}
      {hasAnalysisResults && (
        <Suspense fallback={<Spin tip="Cargando análisis..." />}>
          <DiagnosisPanel 
            thoughtSteps={thoughtSteps}
            diagnosisSuggestions={diagnosisSuggestions}
            loading={loading}
            error={error}
          />
        </Suspense>
      )}
      
      {/* Lista de recomendaciones */}
      {hasTreatmentResults && (
        <Suspense fallback={<Spin tip="Cargando recomendaciones..." />}>
          <RecommendationList 
            recommendations={treatmentSuggestions}
            loading={loading}
          />
        </Suspense>
      )}
    </Flex>
  );
};

export default React.memo(PatientAnalysisContainer); 