import React, { useState } from 'react';
import { Result, Button, Space, Typography, Card, Alert } from 'antd';
import { RobotOutlined, ReloadOutlined, BulbOutlined } from '@ant-design/icons';
import { useError } from '../hooks/useError';
import { ErrorSource } from '../context/ErrorContext';

const { Text, Paragraph } = Typography;

interface AIErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
  actionMessage?: string;
  showHelpfulTips?: boolean;
}

/**
 * Componente especializado para mostrar errores relacionados con la IA
 * Integrado con el sistema centralizado de errores
 */
const AIErrorFallback: React.FC<AIErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  actionMessage = 'Reintentar',
  showHelpfulTips = true,
}) => {
  const { captureError } = useError();
  const [errorCaptured, setErrorCaptured] = useState(false);
  
  // Si hay un error, capturarlo en el sistema central
  // pero solo si no se ha hecho todavía
  React.useEffect(() => {
    if (error && !errorCaptured) {
      captureError(error, ErrorSource.AI);
      setErrorCaptured(true);
    }
  }, [error, captureError, errorCaptured]);
  
  const errorMessage = error?.message || 'Error en el procesamiento de IA';
  
  // Detectar tipos comunes de errores de IA
  const isRateLimited = errorMessage.toLowerCase().includes('rate limit') || 
                        errorMessage.toLowerCase().includes('too many requests');
  
  const isContextLength = errorMessage.toLowerCase().includes('context length') || 
                          errorMessage.toLowerCase().includes('token limit');
  
  const isServerError = errorMessage.toLowerCase().includes('server error') || 
                        errorMessage.toLowerCase().includes('internal error');
  
  const getErrorTitle = () => {
    if (isRateLimited) {
      return 'Límite de solicitudes excedido';
    } 
    if (isContextLength) {
      return 'Datos demasiado extensos';
    }
    if (isServerError) {
      return 'Error en el servicio de IA';
    }
    return 'Error en el procesamiento de IA';
  };
  
  const getHelpfulTips = () => {
    const commonTips = [
      'Verifique su conexión a internet',
      'Si el problema persiste, contacte al equipo de soporte técnico'
    ];
    
    if (isRateLimited) {
      return [
        'Espere unos minutos antes de volver a intentarlo',
        'Reduzca la frecuencia de solicitudes',
        ...commonTips
      ];
    }
    
    if (isContextLength) {
      return [
        'Intente reducir la cantidad de información enviada',
        'Divida su consulta en partes más pequeñas',
        ...commonTips
      ];
    }
    
    if (isServerError) {
      return [
        'El servicio de IA puede estar temporalmente no disponible',
        'Intente nuevamente en unos minutos',
        ...commonTips
      ];
    }
    
    return [
      'Intente nuevamente con una consulta más clara o específica',
      ...commonTips
    ];
  };
  
  return (
    <Card style={{ width: '100%', marginBottom: 16 }}>
      <Result
        status="warning"
        title={getErrorTitle()}
        subTitle={errorMessage}
        icon={<RobotOutlined style={{ color: '#ff4d4f' }} />}
        extra={[
          <Button 
            key="retry" 
            type="primary"
            icon={<ReloadOutlined />}
            onClick={resetErrorBoundary}
          >
            {actionMessage}
          </Button>
        ]}
      />
      
      {showHelpfulTips && (
        <Alert
          type="info"
          message={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <Space>
                  <BulbOutlined />
                  <Text strong>Sugerencias para resolver el problema:</Text>
                </Space>
              </Paragraph>
              <ul>
                {getHelpfulTips().map((tip, index) => (
                  <li key={index}>
                    <Text>{tip}</Text>
                  </li>
                ))}
              </ul>
            </Space>
          }
        />
      )}
    </Card>
  );
};

export default AIErrorFallback; 