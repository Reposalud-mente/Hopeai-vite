import React from 'react';
import { Spin, Alert, Result, Button } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, WarningOutlined, ReloadOutlined } from '@ant-design/icons';

interface LoadingFeedbackProps {
  loading: boolean;
  error?: Error | null;
  success?: boolean;
  loadingText?: string;
  errorText?: string;
  successText?: string;
  compact?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  children?: React.ReactNode;
}

/**
 * Componente para mostrar feedback visual de operaciones asíncronas
 */
const LoadingFeedback: React.FC<LoadingFeedbackProps> = ({
  loading,
  error,
  success,
  loadingText = 'Cargando...',
  errorText = 'Ha ocurrido un error',
  successText = 'Operación completada con éxito',
  compact = false,
  showRetry = false,
  onRetry,
  children
}) => {
  // Spinner personalizado
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  // Si no hay estado especial, mostrar hijos
  if (!loading && !error && !success) {
    return <>{children}</>;
  }

  // Versión compacta (útil para botones o elementos pequeños)
  if (compact) {
    if (loading) {
      return <Spin indicator={antIcon} size="small" />;
    }
    
    if (error) {
      return (
        <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <WarningOutlined />
          {errorText}
          {showRetry && onRetry && (
            <Button 
              type="link" 
              onClick={onRetry} 
              size="small" 
              icon={<ReloadOutlined />} 
              style={{ padding: 0 }}
            />
          )}
        </span>
      );
    }
    
    if (success) {
      return (
        <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircleOutlined />
          {successText}
        </span>
      );
    }
  }

  // Versión completa
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <Spin indicator={antIcon} tip={loadingText} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error.message || errorText}
        type="error"
        showIcon
        action={
          showRetry && onRetry ? (
            <Button type="primary" danger onClick={onRetry} icon={<ReloadOutlined />}>
              Reintentar
            </Button>
          ) : null
        }
      />
    );
  }

  if (success) {
    return (
      <Result
        status="success"
        title={successText}
      />
    );
  }

  // Fallback
  return <>{children}</>;
};

export default LoadingFeedback; 