import React, { useMemo } from 'react';
import { Card, Button, Space, Typography, Tooltip } from 'antd';
import { 
  CommentOutlined, 
  RollbackOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types/clinical-types';

const { Text } = Typography;

interface UserFlowOptimizerProps {
  currentView: 'details' | 'analysis';
  patient: Patient;
  previousPath?: string;
}

/**
 * Componente que facilita la navegación entre diferentes vistas relacionadas con un paciente
 * Muestra las opciones disponibles en función del contexto actual
 */
const UserFlowOptimizer: React.FC<UserFlowOptimizerProps> = ({ 
  currentView, 
  patient, 
  previousPath 
}) => {
  const navigate = useNavigate();
  
  const patientId = patient?.id;
  
  // Determinar qué acciones mostrar basado en la vista actual
  const actions = useMemo(() => {
    const allActions = [
      {
        key: 'details',
        icon: <UserOutlined />,
        title: 'Detalles',
        description: 'Ver información del paciente',
        onClick: () => navigate(`/pacientes/${patientId}`),
        disabled: currentView === 'details'
      },
      {
        key: 'analysis',
        icon: <CommentOutlined />,
        title: 'Análisis Interactivo',
        description: 'Consultas clínicas con IA',
        onClick: () => navigate(`/pacientes/${patientId}/analisis-interactivo`),
        disabled: currentView === 'analysis'
      },
      {
        key: 'back',
        icon: <RollbackOutlined />,
        title: 'Volver',
        description: 'Volver a la lista de pacientes',
        onClick: () => previousPath ? navigate(previousPath) : navigate('/pacientes'),
        disabled: false
      }
    ];
    
    // Filtrar las acciones que no deberían mostrarse en la vista actual
    // Por ejemplo, no mostrar "Detalles" cuando ya estamos en la vista de detalles
    return allActions.filter(action => !action.disabled);
  }, [currentView, patientId, navigate, previousPath]);
  
  // Renderizar el componente solo si hay un paciente
  if (!patient) return null;
  
  return (
    <Card 
      title="Navegación Rápida" 
      size="small" 
      className="user-flow-optimizer"
      style={{ marginBottom: '16px' }}
    >
      <Space wrap>
        {actions.map(action => (
          <Tooltip key={action.key} title={action.description}>
            <Button 
              icon={action.icon} 
              onClick={action.onClick}
              type={action.key === 'back' ? 'default' : 'primary'}
              ghost={action.key !== 'back'}
            >
              <Text>{action.title}</Text>
            </Button>
          </Tooltip>
        ))}
      </Space>
    </Card>
  );
};

export default UserFlowOptimizer; 