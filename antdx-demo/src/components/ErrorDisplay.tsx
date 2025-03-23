import React from 'react';
import { Alert, notification, Badge, Drawer, List, Typography, Tag, Space, Button, Descriptions } from 'antd';
import { useError, ErrorSeverity, ErrorData, ErrorSource } from '../context/ErrorContext';
import { 
  CloseCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined, 
  ExclamationCircleOutlined,
  BugOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

// Component for displaying a single inline error
export const InlineError: React.FC<{
  error: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>;
  onClose?: () => void;
}> = ({ error, onClose }) => {
  const alertType = getAlertTypeFromSeverity(error.severity);
  
  return (
    <Alert
      message={getSeverityTitle(error.severity)}
      description={error.message}
      type={alertType}
      showIcon
      closable={!!onClose}
      onClose={onClose}
    />
  );
};

// Componente para mostrar un error con la opción de reintentar
export const RetryableError: React.FC<{
  errorMessage: string;
  onRetry: () => void;
  isRetrying?: boolean;
  retryText?: string;
  severity?: ErrorSeverity;
}> = ({ 
  errorMessage, 
  onRetry, 
  isRetrying = false, 
  retryText = "Reintentar", 
  severity = ErrorSeverity.ERROR 
}) => {
  const alertType = getAlertTypeFromSeverity(severity);
  
  return (
    <Alert
      message={getSeverityTitle(severity)}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{errorMessage}</Text>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={onRetry} 
            loading={isRetrying}
            size="small"
          >
            {isRetrying ? "Reintentando..." : retryText}
          </Button>
        </Space>
      }
      type={alertType}
      showIcon
    />
  );
};

// Function to show a notification for an error
export const showErrorNotification = (error: ErrorData): void => {
  const { severity, message, source } = error;
  const alertType = getAlertTypeFromSeverity(severity);
  
  notification.open({
    message: getSeverityTitle(severity),
    description: (
      <Space direction="vertical">
        <Text>{message}</Text>
        <Text type="secondary">Origen: {getSourceLabel(source)}</Text>
      </Space>
    ),
    icon: getSeverityIcon(severity),
    type: alertType,
    duration: severity === ErrorSeverity.CRITICAL ? 0 : 4.5,
  });
};

// Error log drawer component
export const ErrorLogDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { errors, clearError, clearAllErrors } = useError();
  
  return (
    <Drawer
      title={
        <Space>
          <BugOutlined />
          <span>Registro de errores</span>
          <Badge count={errors.length} />
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={600}
      extra={
        <Button onClick={clearAllErrors} danger>
          Limpiar todos
        </Button>
      }
    >
      {errors.length === 0 ? (
        <Text type="secondary">No hay errores registrados</Text>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={errors}
          renderItem={(error) => (
            <List.Item
              key={error.id}
              actions={[
                <Button key="delete" size="small" onClick={() => clearError(error.id)}>
                  Eliminar
                </Button>
              ]}
              extra={
                <Tag color={getSeverityColor(error.severity)}>
                  {getSeverityTitle(error.severity)}
                </Tag>
              }
            >
              <List.Item.Meta
                title={<Text>{error.message}</Text>}
                description={
                  <Space direction="vertical">
                    <Text type="secondary">
                      {new Date(error.timestamp).toLocaleString()}
                    </Text>
                    <Tag>{getSourceLabel(error.source)}</Tag>
                  </Space>
                }
              />
              
              {process.env.NODE_ENV === 'development' && error.stack && (
                <Descriptions title="Detalles técnicos" column={1} size="small">
                  <Descriptions.Item label="Stack">
                    <Paragraph
                      ellipsis={{ rows: 3, expandable: true, symbol: 'más' }}
                      style={{ maxWidth: '100%' }}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                        {error.stack}
                      </pre>
                    </Paragraph>
                  </Descriptions.Item>
                  
                  {error.context && error.context.componentStack && (
                    <Descriptions.Item label="Componentes">
                      <Paragraph
                        ellipsis={{ rows: 3, expandable: true, symbol: 'más' }}
                        style={{ maxWidth: '100%' }}
                      >
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                          {String(error.context.componentStack)}
                        </pre>
                      </Paragraph>
                    </Descriptions.Item>
                  )}
                  
                  {error.context && Object.keys(error.context).length > 0 && (
                    <Descriptions.Item label="Contexto">
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              )}
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

// ErrorStatus component for the top bar
export const ErrorStatusBadge: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  const { errors } = useError();
  
  // Count errors by severity
  const criticalCount = errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
  const errorCount = errors.filter(e => e.severity === ErrorSeverity.ERROR).length;
  const warningCount = errors.filter(e => e.severity === ErrorSeverity.WARNING).length;
  
  // Determine the icon based on severity
  let icon = <InfoCircleOutlined />;
  
  if (criticalCount > 0) {
    icon = <CloseCircleOutlined />;
  } else if (errorCount > 0) {
    icon = <ExclamationCircleOutlined />;
  } else if (warningCount > 0) {
    icon = <WarningOutlined />;
  }
  
  return (
    <Badge 
      count={errors.length} 
      style={{ backgroundColor: errors.length > 0 ? undefined : '#52c41a' }}
      onClick={onClick}
    >
      <Button 
        icon={icon} 
        type={errors.length > 0 ? "primary" : "text"} 
        danger={criticalCount > 0}
        onClick={onClick}
      >
        {errors.length > 0 ? 'Errores' : 'Sin errores'}
      </Button>
    </Badge>
  );
};

// Helper functions
function getAlertTypeFromSeverity(severity: ErrorSeverity): 'success' | 'info' | 'warning' | 'error' {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'info';
    case ErrorSeverity.WARNING:
      return 'warning';
    case ErrorSeverity.ERROR:
    case ErrorSeverity.CRITICAL:
      return 'error';
    default:
      return 'error';
  }
}

function getSeverityTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'Información';
    case ErrorSeverity.WARNING:
      return 'Advertencia';
    case ErrorSeverity.ERROR:
      return 'Error';
    case ErrorSeverity.CRITICAL:
      return 'Error Crítico';
    default:
      return 'Error';
  }
}

function getSeverityColor(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'blue';
    case ErrorSeverity.WARNING:
      return 'gold';
    case ErrorSeverity.ERROR:
      return 'orange';
    case ErrorSeverity.CRITICAL:
      return 'red';
    default:
      return 'red';
  }
}

function getSeverityIcon(severity: ErrorSeverity): React.ReactNode {
  switch (severity) {
    case ErrorSeverity.INFO:
      return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    case ErrorSeverity.WARNING:
      return <WarningOutlined style={{ color: '#faad14' }} />;
    case ErrorSeverity.ERROR:
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    case ErrorSeverity.CRITICAL:
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    default:
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
  }
}

function getSourceLabel(source: ErrorSource): string {
  switch (source) {
    case ErrorSource.API:
      return 'API';
    case ErrorSource.UI:
      return 'Interfaz de Usuario';
    case ErrorSource.AI:
      return 'IA Clínica';
    case ErrorSource.UNKNOWN:
      return 'Desconocido';
    default:
      return 'Desconocido';
  }
} 