import React from 'react';
import { Typography, Timeline, Card, Tabs, Empty, Tag, Descriptions, List } from 'antd';
import { CalendarOutlined, FileTextOutlined, ExperimentOutlined } from '@ant-design/icons';
import { Patient, TestResult, ClinicalEvaluation } from '../types/clinical-types';
import LoadingFeedback from './LoadingFeedback';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface PatientHistoryProps {
  patient: Patient;
  evaluations?: ClinicalEvaluation[];
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Componente para visualizar el historial completo del paciente
 */
const PatientHistory: React.FC<PatientHistoryProps> = ({
  patient,
  evaluations = [],
  isLoading = false,
  error = null,
}) => {
  // Renderizar resultados de tests
  const renderTestResults = () => {
    if (!patient.testResults || patient.testResults.length === 0) {
      return <Empty description="No hay resultados de tests disponibles" />;
    }

    return (
      <List
        dataSource={patient.testResults}
        renderItem={(test: TestResult) => (
          <List.Item>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{test.name}</span>
                  {test.date && <Tag color="blue">{test.date}</Tag>}
                </div>
              }
              style={{ width: '100%', marginBottom: 16 }}
            >
              <List
                size="small"
                dataSource={test.results}
                renderItem={score => (
                  <List.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Text strong>{score.scale}</Text>
                      <div>
                        <Tag color="purple">{score.score}</Tag>
                        {score.percentile && <Tag color="cyan">P{score.percentile}</Tag>}
                      </div>
                    </div>
                    {score.interpretation && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">{score.interpretation}</Text>
                      </div>
                    )}
                  </List.Item>
                )}
              />
            </Card>
          </List.Item>
        )}
      />
    );
  };

  // Renderizar historial clínico
  const renderClinicalHistory = () => {
    if (!patient.clinicalHistory && !patient.medicalHistory && !patient.familyHistory) {
      return <Empty description="No hay información de historial clínico disponible" />;
    }

    return (
      <>
        {patient.clinicalHistory && (
          <Card title="Historial Clínico" style={{ marginBottom: 16 }}>
            <Paragraph>{patient.clinicalHistory}</Paragraph>
          </Card>
        )}

        {patient.medicalHistory && (
          <Card title="Historial Médico" style={{ marginBottom: 16 }}>
            <Paragraph>{patient.medicalHistory}</Paragraph>
          </Card>
        )}

        {patient.familyHistory && (
          <Card title="Historial Familiar" style={{ marginBottom: 16 }}>
            <Paragraph>{patient.familyHistory}</Paragraph>
          </Card>
        )}
      </>
    );
  };

  // Renderizar evaluaciones previas
  const renderEvaluations = () => {
    if (evaluations.length === 0) {
      return <Empty description="No hay evaluaciones previas registradas" />;
    }

    return (
      <Timeline mode="left">
        {evaluations.map((evaluation) => (
          <Timeline.Item 
            key={evaluation.id} 
            label={evaluation.date}
            dot={<FileTextOutlined style={{ fontSize: '16px' }} />}
          >
            <Card style={{ marginBottom: 16 }}>
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Psicólogo/a">{evaluation.psychologist}</Descriptions.Item>
                <Descriptions.Item label="Contenido">
                  <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'más' }}>
                    {evaluation.content}
                  </Paragraph>
                </Descriptions.Item>
                {evaluation.diagnoses && evaluation.diagnoses.length > 0 && (
                  <Descriptions.Item label="Diagnósticos">
                    {evaluation.diagnoses.map((diagnosis, idx) => (
                      <Tag key={idx} color="red">{diagnosis.name}</Tag>
                    ))}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  // Si está cargando, mostrar spinner usando LoadingFeedback
  if (isLoading) {
    return (
      <LoadingFeedback
        loading={true}
        loadingText="Cargando historial del paciente..."
      />
    );
  }

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <LoadingFeedback
        loading={false}
        error={error}
        errorText="Error al cargar el historial del paciente"
      />
    );
  }

  return (
    <div>
      <Title level={3}>Historial del Paciente</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="Información General" bordered size="small">
          <Descriptions.Item label="Nombre" span={3}>{patient.name}</Descriptions.Item>
          <Descriptions.Item label="Fecha de Nacimiento">{patient.birthDate || 'No disponible'}</Descriptions.Item>
          <Descriptions.Item label="Edad">{patient.age || 'No disponible'}</Descriptions.Item>
          <Descriptions.Item label="Género">{patient.gender || 'No especificado'}</Descriptions.Item>
          <Descriptions.Item label="Profesional Asignado" span={3}>{patient.psychologist || 'No asignado'}</Descriptions.Item>
          <Descriptions.Item label="Motivo de Consulta" span={3}>{patient.consultReason || 'No especificado'}</Descriptions.Item>
        </Descriptions>
      </Card>
      
      <Tabs defaultActiveKey="evaluations">
        <TabPane 
          tab={<span><CalendarOutlined /> Evaluaciones Previas</span>} 
          key="evaluations"
        >
          {renderEvaluations()}
        </TabPane>
        <TabPane 
          tab={<span><FileTextOutlined /> Historial Clínico</span>} 
          key="clinicalHistory"
        >
          {renderClinicalHistory()}
        </TabPane>
        <TabPane 
          tab={<span><ExperimentOutlined /> Resultados de Tests</span>} 
          key="testResults"
        >
          {renderTestResults()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PatientHistory; 