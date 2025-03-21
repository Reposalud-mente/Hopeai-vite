import React, { useMemo } from 'react';
import { Typography, List, Tag, Empty, Flex } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// Define the type for recommendations
interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'tratamiento' | 'evaluación' | 'seguimiento';
  priority: 'alta' | 'media' | 'baja';
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  loading: boolean;
}

// Funciones auxiliares estáticas para evitar recreaciones en cada render
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'tratamiento': return 'green';
    case 'evaluación': return 'blue';
    case 'seguimiento': return 'orange';
    default: return 'default';
  }
};

const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  loading
}) => {
  // Memoizamos la función para el renderizado de prioridades
  // para evitar recrearla en cada render
  const getPriorityDisplay = useMemo(() => (priority: string) => {
    switch (priority) {
      case 'alta': 
        return <Tag color="red" icon={<InfoCircleOutlined />}>Prioridad Alta</Tag>;
      case 'media': 
        return <Tag color="orange">Prioridad Media</Tag>;
      case 'baja': 
        return <Tag color="default">Prioridad Baja</Tag>;
      default: 
        return null;
    }
  }, []);

  // Memoizamos el contenido principal para prevenir renderizados innecesarios
  const listContent = useMemo(() => {
    if (recommendations.length === 0) {
      return (
        <Empty 
          description="No hay recomendaciones disponibles" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    return (
      <List
        itemLayout="vertical"
        dataSource={recommendations}
        loading={loading}
        renderItem={item => (
          <List.Item
            key={item.id}
            extra={getPriorityDisplay(item.priority)}
          >
            <List.Item.Meta
              title={
                <Flex align="center" gap={8}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text strong>{item.title}</Text>
                  <Tag color={getTypeColor(item.type)}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Tag>
                </Flex>
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
    );
  }, [recommendations, loading, getPriorityDisplay]);

  return (
    <div className="recommendation-list" style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px' }}>
      <Title level={5} style={{ marginTop: 0, marginBottom: '16px' }}>
        Recomendaciones Clínicas
      </Title>
      
      {listContent}
    </div>
  );
};

export default React.memo(RecommendationList); 