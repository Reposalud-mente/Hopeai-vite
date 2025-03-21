import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, Typography, Spin, Tag, Tooltip, Space } from 'antd';
import { SendOutlined, StarOutlined, StarFilled, InfoCircleOutlined } from '@ant-design/icons';
import type { ClinicalQuery, ClinicalResponseJson } from '../../types/ClinicalQuery';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface ClinicalChatPanelProps {
  onSubmitQuery: (question: string) => Promise<ClinicalQuery | undefined>;
  onToggleFavorite?: (queryId: number, isFavorite: boolean) => Promise<void>;
  initialQueries?: ClinicalQuery[];
  loading?: boolean;
}

const ClinicalChatPanel: React.FC<ClinicalChatPanelProps> = ({
  onSubmitQuery,
  onToggleFavorite,
  initialQueries = [],
  loading = false,
}) => {
  const [question, setQuestion] = useState('');
  const [queries, setQueries] = useState<ClinicalQuery[]>(initialQueries);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialQueries.length > 0) {
      setQueries(initialQueries);
    }
  }, [initialQueries]);

  const handleSubmit = async () => {
    if (!question.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await onSubmitQuery(question);
      if (response) {
        setQueries(prev => [response, ...prev]);
        setQuestion('');
      }
    } catch (error) {
      console.error('Error al enviar consulta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async (queryId: number, currentValue: boolean) => {
    if (onToggleFavorite) {
      try {
        await onToggleFavorite(queryId, !currentValue);
        setQueries(prev => 
          prev.map(q => q.id === queryId ? { ...q, isFavorite: !currentValue } : q)
        );
      } catch (error) {
        console.error('Error al cambiar favorito:', error);
      }
    }
  };

  const renderResponseContent = (query: ClinicalQuery) => {
    if (!query.responseJson) {
      return <Paragraph>{query.answer || 'Sin respuesta'}</Paragraph>;
    }

    const response = query.responseJson as ClinicalResponseJson;
    
    return (
      <>
        <Paragraph>{response.mainAnswer}</Paragraph>
        
        <Title level={5}>Razonamiento Clínico</Title>
        <Paragraph>{response.reasoning}</Paragraph>
        
        {response.diagnosticConsiderations && response.diagnosticConsiderations.length > 0 && (
          <>
            <Title level={5}>Consideraciones Diagnósticas</Title>
            <ul>
              {response.diagnosticConsiderations.map((item, index) => (
                <li key={index}><Text>{item}</Text></li>
              ))}
            </ul>
          </>
        )}

        {response.treatmentSuggestions && response.treatmentSuggestions.length > 0 && (
          <>
            <Title level={5}>Sugerencias de Tratamiento</Title>
            <ul>
              {response.treatmentSuggestions.map((item, index) => (
                <li key={index}><Text>{item}</Text></li>
              ))}
            </ul>
          </>
        )}
        
        {response.references && response.references.length > 0 && (
          <>
            <Title level={5}>Referencias</Title>
            <ul>
              {response.references.map((ref, index) => (
                <li key={index}>
                  <Text>
                    <strong>{ref.source}:</strong> {ref.citation}
                    {ref.link && (
                      <a href={ref.link} target="_blank" rel="noopener noreferrer"> [Enlace]</a>
                    )}
                  </Text>
                </li>
              ))}
            </ul>
          </>
        )}

        {response.suggestedQuestions && response.suggestedQuestions.length > 0 && (
          <>
            <Title level={5}>Preguntas Sugeridas</Title>
            <Space wrap>
              {response.suggestedQuestions.map((q, index) => (
                <Tag 
                  key={index} 
                  color="blue" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </Tag>
              ))}
            </Space>
          </>
        )}
        
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Tooltip title={`Nivel de confianza: ${(response.confidenceScore * 100).toFixed(0)}%`}>
            <Tag color={response.confidenceScore > 0.7 ? 'green' : response.confidenceScore > 0.4 ? 'orange' : 'red'}>
              Confianza: {(response.confidenceScore * 100).toFixed(0)}%
            </Tag>
          </Tooltip>
        </div>
      </>
    );
  };

  return (
    <Card 
      title="Análisis Clínico Interactivo" 
      style={{ width: '100%' }}
      extra={loading && <Spin size="small" />}
    >
      <List
        dataSource={queries}
        renderItem={(query) => (
          <List.Item
            key={query.id}
            actions={[
              <Button 
                type="text" 
                icon={query.isFavorite ? <StarFilled /> : <StarOutlined />} 
                onClick={() => query.id && handleToggleFavorite(query.id, query.isFavorite)}
              />
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>Consulta: {query.question}</Text>
                  {query.tags && query.tags.map((tag, index) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </Space>
              }
              description={
                <Card style={{ marginTop: 8 }}>
                  {renderResponseContent(query)}
                </Card>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No hay consultas. Comienza haciendo una pregunta.' }}
        style={{ maxHeight: '400px', overflow: 'auto', marginBottom: 16 }}
      />

      <div style={{ display: 'flex', marginTop: 16 }}>
        <TextArea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribe tu consulta clínica aquí..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          style={{ flex: 1, marginRight: 8 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          Enviar
        </Button>
      </div>
      
      <div style={{ marginTop: 8 }}>
        <Text type="secondary">
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          Las respuestas son orientativas y no reemplazan el juicio clínico profesional.
        </Text>
      </div>
    </Card>
  );
};

export default ClinicalChatPanel; 