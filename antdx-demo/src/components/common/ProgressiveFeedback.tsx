import React from 'react';
import { Steps, Progress, Card, Typography, Spin, Alert, Badge } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  percentage: number;
  status?: 'pending' | 'active' | 'completed' | 'error';
}

interface ProgressiveFeedbackProps {
  /** Título principal del proceso */
  title?: string;
  /** Descripción general del proceso */
  description?: string;
  /** Pasos del proceso en orden de ejecución */
  steps: ProgressStep[];
  /** ID del paso actual */
  currentStepId?: string | null;
  /** Progreso general (0-100) */
  progress?: number;
  /** Mensaje de error si hay alguno */
  error?: string | null;
  /** Tiempo estimado restante en segundos */
  estimatedTimeRemaining?: number | null;
  /** Estilo visual */
  type?: 'horizontal' | 'vertical' | 'compact';
  /** Si se debe mostrar información detallada */
  showDetails?: boolean;
}

/**
 * Componente para mostrar feedback visual sobre operaciones progresivas
 * Especialmente útil para procesos de IA de larga duración
 */
const ProgressiveFeedback: React.FC<ProgressiveFeedbackProps> = ({
  title = 'Procesando datos',
  description,
  steps = [],
  currentStepId = null,
  progress = 0,
  error = null,
  estimatedTimeRemaining = null,
  type = 'vertical',
  showDetails = true,
}) => {
  // Encuentra el índice del paso actual
  const currentStepIndex = currentStepId 
    ? steps.findIndex(step => step.id === currentStepId)
    : steps.findIndex(step => step.status === 'active');

  // Mapea los estados de los pasos al formato que espera el componente Steps de Ant Design
  const getStepStatus = (step: ProgressStep): "wait" | "process" | "finish" | "error" => {
    if (step.status === 'error') return 'error';
    if (step.status === 'completed') return 'finish';
    if (step.status === 'active') return 'process';
    return 'wait';
  };

  // Genera el icono adecuado según el estado
  const getStepIcon = (step: ProgressStep) => {
    if (step.status === 'error') return <CloseCircleOutlined />;
    if (step.status === 'completed') return <CheckCircleOutlined />;
    if (step.status === 'active') return <LoadingOutlined />;
    return <ClockCircleOutlined />;
  };

  // Formatea el tiempo restante estimado
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds} segundos`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} seg`;
  };

  // Renderización según el tipo
  if (type === 'compact') {
    // Versión compacta para espacios reducidos
    return (
      <Card size="small" className="progressive-feedback-compact">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Spin spinning={progress < 100 && !error} />
          <div style={{ flexGrow: 1 }}>
            <Text strong>{title}</Text>
            {currentStepIndex >= 0 && currentStepIndex < steps.length && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {steps[currentStepIndex].title}
              </Text>
            )}
            <Progress
              percent={Math.round(progress)}
              status={error ? "exception" : progress >= 100 ? "success" : "active"}
              size="small"
            />
          </div>
        </div>
        {error && <Alert message={error} type="error" showIcon size="small" style={{ marginTop: 8 }} />}
      </Card>
    );
  }

  // Versión horizontal o vertical (completa)
  return (
    <Card className={`progressive-feedback ${type}`}>
      <Title level={4}>
        {title}
        {estimatedTimeRemaining !== null && progress > 0 && progress < 100 && !error && (
          <Badge 
            count={formatTimeRemaining(estimatedTimeRemaining)} 
            style={{ backgroundColor: '#52c41a', marginLeft: 16 }} 
          />
        )}
      </Title>
      {description && <Text type="secondary">{description}</Text>}

      <Progress
        percent={Math.round(progress)}
        status={error ? "exception" : progress >= 100 ? "success" : "active"}
        style={{ marginTop: 16, marginBottom: 16 }}
        strokeWidth={8}
      />

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      {steps.length > 0 && (
        <Steps 
          direction={type === 'horizontal' ? 'horizontal' : 'vertical'} 
          current={currentStepIndex}
          status={error ? 'error' : 'process'}
        >
          {steps.map((step) => (
            <Step
              key={step.id}
              title={step.title}
              description={showDetails && step.description}
              status={getStepStatus(step)}
              icon={showDetails ? getStepIcon(step) : undefined}
              percent={step.status === 'active' ? step.percentage : undefined}
            />
          ))}
        </Steps>
      )}
    </Card>
  );
};

export default ProgressiveFeedback; 