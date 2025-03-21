import React from 'react';
import { Typography, Space, Tag, Avatar, Flex, Button, Tooltip } from 'antd';
import { 
  UserOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import { Patient } from '../types/clinical-types'

const { Text, Title } = Typography;

interface PatientHeaderProps {
  currentPatient: Patient | null;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ 
  currentPatient
}) => {
  if (!currentPatient) {
    return (
      <div className="patient-header-placeholder" style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }}>
        <Flex justify="space-between" align="center">
          <Text type="secondary">Seleccione un paciente para ver sus detalles</Text>
        </Flex>
      </div>
    );
  }

  return (
    <div className="patient-header" style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '16px' }}>
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={16}>
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>{currentPatient.name}</Title>
            <Space size={12}>
              <Flex align="center" gap={4}>
                <ClockCircleOutlined />
                <Text type="secondary">
                  {currentPatient.evaluationDate || 'Sin fecha de evaluación'}
                </Text>
              </Flex>
              <Tag color={
                currentPatient.status === 'Activo' ? 'green' : 
                currentPatient.status === 'Inactivo' ? 'default' : 
                'blue'
              }>
                {currentPatient.status}
              </Tag>
            </Space>
            <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
              Motivo de consulta: {currentPatient.consultReason || 'No especificado'}
            </Text>
          </div>
        </Flex>
        <Flex gap={8}>
          <Tooltip title="Editar información del paciente">
            <Button>Editar Información</Button>
          </Tooltip>
          <Tooltip title="Ver historial del paciente">
            <Button>Ver Historial</Button>
          </Tooltip>
        </Flex>
      </Flex>
    </div>
  );
};

export default PatientHeader; 