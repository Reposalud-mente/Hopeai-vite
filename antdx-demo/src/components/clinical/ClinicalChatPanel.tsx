import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Spin, Tag, Tooltip, Space, Button } from 'antd';
import { 
  StarOutlined, 
  StarFilled, 
  InfoCircleOutlined,
  CopyOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  MailOutlined
} 

from '@ant-design/icons';
import type { ClinicalQuery, ClinicalResponseJson } from '../../types/ClinicalQuery';
import QueryInput from './QueryInput';
import FeedbackForm from './FeedbackForm';
import exportService from '../../services/exportService';

const { Text, Title, Paragraph } = Typography;

interface ClinicalChatPanelProps {
  onSubmitQuery: (question: string) => Promise<ClinicalQuery | undefined>;
  onToggleFavorite?: (queryId: number, isFavorite: boolean) => Promise<void>;
  initialQueries?: ClinicalQuery[];
  loading?: boolean;
  patientId?: string | number;
}

const ClinicalChatPanel: React.FC<ClinicalChatPanelProps> = ({
  onSubmitQuery,
  onToggleFavorite,
  initialQueries = [],
  loading = false,
  patientId,
}) => {
  const [question, setQuestion] = useState('');
  const [queries, setQueries] = useState<ClinicalQuery[]>(initialQueries);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (initialQueries.length > 0) {
      setQueries(initialQueries);
    }
  }, [initialQueries]);

  const handleSubmit = async (submittedQuestion: string) => {
    if (!submittedQuestion.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await onSubmitQuery(submittedQuestion);
      if (response) {
        setQueries(prev => [response, ...prev]);
        setQuestion(''); // Limpiar el input después de enviar
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
        
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <FeedbackForm 
            queryId={query.id} 
            patientId={patientId as string}
            onFeedbackSubmit={() => {
              // notificationService is already used by the export service
            }}
          />
        </div>
        
        <div className="query-actions">
          <Tooltip title="Copiar respuesta">
            <Button 
              icon={<CopyOutlined />} 
              size="small" 
              style={{ marginRight: 8 }}
              onClick={() => exportService.copyToClipboard(query)}
            />
          </Tooltip>
          
          <Tooltip title="Exportar como PDF">
            <Button 
              icon={<FilePdfOutlined />} 
              size="small" 
              style={{ marginRight: 8 }}
              onClick={() => exportService.exportAsPdf(query)}
            />
          </Tooltip>
          
          <Tooltip title="Guardar como texto">
            <Button 
              icon={<FileTextOutlined />} 
              size="small" 
              style={{ marginRight: 8 }}
              onClick={() => exportService.exportAsText(query)}
            />
          </Tooltip>
          
          <Tooltip title="Compartir por email">
            <Button 
              icon={<MailOutlined />} 
              size="small" 
              style={{ marginRight: 8 }}
              onClick={() => exportService.shareByEmail(query)}
            />
          </Tooltip>
          
          <Tooltip title={query.isFavorite ? "Eliminar de favoritos" : "Guardar como favorito"}>
            <Button
              type="text"
              icon={query.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={() => onToggleFavorite(query.id, !query.isFavorite)}
              size="small"
            />
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

      <QueryInput
        onSubmit={handleSubmit}
        loading={isSubmitting}
        initialValue={question}
        placeholder="Escribe tu consulta clínica aquí..."
      />
      
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