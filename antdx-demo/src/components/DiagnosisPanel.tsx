import React, { useMemo } from 'react';
import { Typography, Flex, Card, Spin } from 'antd';
import { ThoughtChain, Suggestion } from '@ant-design/x';
import type { SuggestionItem, ThoughtStep } from '@ant-design/x';
import { LoadingOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface DiagnosisPanelProps {
  thoughtSteps: ThoughtStep[];
  diagnosisSuggestions: SuggestionItem[];
  loading: boolean;
  error: string | null;
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  thoughtSteps,
  diagnosisSuggestions,
  loading,
  error
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
  
  // Utilizamos useMemo para determinar el contenido a renderizar
  // basado en los estados actuales, evitando recálculos innecesarios
  const panelContent = useMemo(() => {
    // Caso 1: Loading
    if (loading) {
      return (
        <Flex align="center" justify="center" style={{ padding: '20px 0' }}>
          <Spin indicator={antIcon} />
          <Text style={{ marginLeft: '12px' }}>Procesando análisis clínico...</Text>
        </Flex>
      );
    }
    
    // Caso 2: Error
    if (error) {
      return (
        <Card style={{ marginBottom: '16px', borderColor: '#ff4d4f' }}>
          <Text type="danger">{error}</Text>
        </Card>
      );
    }
    
    // Caso 3: Datos disponibles
    const hasDiagnoses = diagnosisSuggestions.length > 0;
    
    return (
      <>
        <Card 
          title="Proceso de Razonamiento Clínico" 
          style={{ marginBottom: '16px' }}
          headStyle={{ backgroundColor: '#f0f5ff', borderBottom: '1px solid #d6e4ff' }}
        >
          <ThoughtChain steps={thoughtSteps} />
        </Card>
        
        <Card 
          title="Diagnósticos Sugeridos" 
          style={{ marginBottom: '16px' }}
          headStyle={{ backgroundColor: '#f6ffed', borderBottom: '1px solid #d9f7be' }}
        >
          <Suggestion items={diagnosisSuggestions} />
          
          {!hasDiagnoses && (
            <Text type="secondary" italic style={{ display: 'block', marginTop: '12px' }}>
              No hay suficiente información para sugerir diagnósticos. 
              Agregue más detalles clínicos a las notas.
            </Text>
          )}
        </Card>
      </>
    );
  }, [loading, error, thoughtSteps, diagnosisSuggestions, antIcon]);

  return (
    <div className="diagnosis-panel" style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px' }}>
      <Title level={5} style={{ marginTop: 0, marginBottom: '16px' }}>
        Análisis Clínico
      </Title>
      
      {panelContent}
    </div>
  );
};

export default React.memo(DiagnosisPanel); 