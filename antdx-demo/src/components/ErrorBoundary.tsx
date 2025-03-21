import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card, Typography, Space, Divider } from 'antd';
import { useError } from '../hooks/useError';
import { ErrorSeverity, ErrorSource } from '../context/ErrorContext';
import { UIError } from '../utils/errorHandler';

const { Title, Text, Paragraph } = Typography;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Higher-order component to connect ErrorBoundaryClass with ErrorContext
export const ErrorBoundary = ({ 
  children, 
  fallback, 
  onReset,
  componentName = 'Componente'
}: ErrorBoundaryProps) => {
  const { captureError } = useError();

  return (
    <ErrorBoundaryClass 
      captureError={captureError} 
      fallback={fallback} 
      onReset={onReset}
      componentName={componentName}
    >
      {children}
    </ErrorBoundaryClass>
  );
};

// Class component is needed for error boundaries since hooks cannot be used for error boundaries
interface ErrorBoundaryClassProps extends ErrorBoundaryProps {
  captureError: (error: unknown, source?: ErrorSource, context?: Record<string, unknown>) => string;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryClassProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryClassProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Crear un UIError a partir del error capturado
    const uiError = new UIError(
      `Error en ${this.props.componentName}: ${error.message}`,
      this.props.componentName,
      ErrorSeverity.ERROR,
      {
        componentStack: errorInfo.componentStack,
        originalError: error
      }
    );

    // Capturar el error usando el sistema unificado
    this.props.captureError(uiError);

    this.setState({
      errorInfo
    });

    // También registrar en consola para desarrollo
    console.error('Error capturado por ErrorBoundary:', error);
    console.error('Árbol de componentes:', errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    // Default fallback UI
    return (
      <Card style={{ margin: '24px 0' }}>
        <Alert
          type="error"
          message="Ha ocurrido un error en la aplicación"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <Text strong>Mensaje:</Text> {error?.message || 'Error desconocido'}
              </Paragraph>
              
              <Divider />
              
              <Paragraph>
                <Text type="secondary">Este error ha sido registrado automáticamente para ayudar a mejorar la aplicación.</Text>
              </Paragraph>
              
              <Button type="primary" onClick={this.handleReset}>
                Reintentar
              </Button>
            </Space>
          }
          showIcon
        />
        
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: 16, overflow: 'auto' }}>
            <Title level={5}>Detalles del error (solo desarrollo)</Title>
            <Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {error?.stack || 'No stack trace available'}
              </pre>
            </Paragraph>
            <Title level={5}>Árbol de componentes</Title>
            <Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {errorInfo?.componentStack || 'No component stack available'}
              </pre>
            </Paragraph>
          </div>
        )}
      </Card>
    );
  }
} 