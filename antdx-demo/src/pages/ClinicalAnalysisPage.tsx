import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Alert, Row, Col, Spin, Divider } from 'antd';
import { ArrowLeftOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import ClinicalChatPanel from '../components/clinical/ClinicalChatPanel';
import { useClinicalQuery } from '../hooks/useClinicalQuery';

const { Title, Paragraph, Text } = Typography;

/**
 * Página de análisis clínico interactivo que permite realizar consultas
 * sobre un paciente específico utilizando IA
 */
const ClinicalAnalysisPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utilizar el hook personalizado para gestionar consultas clínicas
  const { 
    queries, 
    totalQueries,
    loading: queriesLoading, 
    submitting,
    error: queryError,
    submitQuery, 
    toggleFavorite
  } = useClinicalQuery({
    patientId: patientId || '',
    autoFetch: true
  });

  // Cargar datos del paciente
  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/patients/${patientId}`);
        setPatient(response.data);
      } catch (err) {
        console.error('Error al cargar datos del paciente:', err);
        setError('No se pudo cargar la información del paciente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  // Manejar el envío de una consulta clínica
  const handleSubmitQuery = async (question: string) => {
    if (!patientId) return;
    
    try {
      const response = await submitQuery(question);
      return response;
    } catch (err) {
      console.error('Error al enviar consulta clínica:', err);
      return undefined;
    }
  };

  // Renderizar vista de carga
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>Cargando información del paciente...</Paragraph>
      </div>
    );
  }

  // Renderizar vista de error
  if (error || !patient) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Error"
          description={error || "No se pudo encontrar el paciente especificado."}
          type="error"
          showIcon
        />
        <Button 
          type="primary" 
          onClick={() => navigate('/patients')} 
          style={{ marginTop: 16 }}
        >
          Volver a la lista de pacientes
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(`/patients/${patientId}`)}
            style={{ marginBottom: 16 }}
          >
            Volver al perfil del paciente
          </Button>
          
          <Title level={2}>Análisis Interactivo</Title>
          
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card type="inner" title={<><UserOutlined /> Paciente</>}>
                  <p><strong>Nombre:</strong> {patient.name}</p>
                  <p><strong>Edad:</strong> {patient.age} años</p>
                  <p><strong>Estado:</strong> {patient.status}</p>
                </Card>
              </Col>
              <Col span={16}>
                <Card type="inner" title={<><FileTextOutlined /> Motivo de Consulta</>}>
                  <Paragraph>{patient.consultReason || 'No especificado'}</Paragraph>
                  
                  <Divider />
                  
                  <Text type="secondary">
                    El análisis interactivo permite realizar consultas específicas sobre este caso
                    utilizando inteligencia artificial para brindar asistencia clínica.
                  </Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col span={24}>
          {queryError && (
            <Alert
              message="Error en las consultas"
              description={queryError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <ClinicalChatPanel
            patientId={patientId || ''}
            onSubmitQuery={handleSubmitQuery}
            onToggleFavorite={toggleFavorite}
            initialQueries={queries}
            loading={queriesLoading || submitting}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ClinicalAnalysisPage; 