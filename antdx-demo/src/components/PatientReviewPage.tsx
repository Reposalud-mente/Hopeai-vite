import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Typography, 
  Space, 
  Select,
  Avatar,
  Tag,
  Button,
  Flex,
  Layout,
  Drawer,
  Tooltip,
  Spin,
  message
} from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  SyncOutlined,
  DownOutlined,
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  PaperClipOutlined,
  LoadingOutlined
} from '@ant-design/icons';
// Import types properly for Ant Design X components
import { ThoughtChain, Suggestion, Bubble } from '@ant-design/x';
import type { SuggestionItem, ThoughtStep } from '@ant-design/x';
// Importamos nuestro hook personalizado y el contexto
import { useClinicalAI } from '../hooks/useClinicalAI';
import { usePatientContext, Patient } from '../context/PatientContext';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;

// Define correct prop types for the AntDX components
interface ThoughtStepType {
  title: string;
  description: string;
  status: 'wait' | 'processing' | 'finish' | 'error';
  icon?: React.ReactNode;
}

// Convert our diagnosis type to Suggestion items
const mapDiagnosisToSuggestionItems = (diagnoses: any[]): SuggestionItem[] => {
  return diagnoses.map(d => ({
    label: d.name,
    value: d.name,
    description: d.description,
    // Map confidence to severity level
    severity: d.confidence === 'Alta' ? 'success' : 
              d.confidence === 'Media' ? 'warning' : 'error'
  }));
};

const PatientReviewPage = () => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const [evaluationText, setEvaluationText] = useState('');
  
  // Usamos el contexto de pacientes
  const { 
    patients, 
    currentPatient, 
    loading: patientsLoading, 
    loadPatient,
    saveEvaluationDraft
  } = usePatientContext();
  
  // Seleccionamos el primer paciente por defecto
  useEffect(() => {
    if (patients.length > 0 && !currentPatient) {
      loadPatient(patients[0].id);
    }
  }, [patients, currentPatient, loadPatient]);
  
  // Actualizamos el texto del borrador cuando cambia el paciente
  useEffect(() => {
    if (currentPatient) {
      setEvaluationText(currentPatient.evaluationDraft || '');
    }
  }, [currentPatient]);
  
  // Usamos nuestro hook personalizado para la IA clínica
  const { 
    thoughtSteps, 
    suggestedDiagnoses, 
    chatHistory, 
    loading: aiLoading, 
    error, 
    askQuestion 
  } = useClinicalAI(evaluationText);
  
  // Variable para el estado de carga combinado
  const loading = patientsLoading || aiLoading;

  // Efecto para mostrar errores
  useEffect(() => {
    if (error) {
      messageApi.error(error);
    }
  }, [error, messageApi]);

  // Función para manejar el envío de preguntas
  const handleSendQuestion = async () => {
    if (!currentQuestion.trim()) return;
    
    await askQuestion(currentQuestion);
    setCurrentQuestion('');
  };
  
  // Función para guardar el borrador
  const handleSaveDraft = async () => {
    if (!currentPatient) return;
    
    const success = await saveEvaluationDraft(currentPatient.id, evaluationText);
    if (success) {
      messageApi.success('Borrador guardado correctamente');
    }
  };
  
  // Función para seleccionar un paciente
  const handleSelectPatient = (patientId: number) => {
    loadPatient(patientId);
  };

  return (
    <>
      {contextHolder}
      <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Debug Message */}
        <div style={{ 
          padding: '10px', 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          margin: '5px', 
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          Interfaz de HopeAI - Versión Debug
        </div>
        
        {/* Main Header */}
        <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0 16px', height: 48, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
          <Flex align="center" gap={12}>
            <FileTextOutlined style={{ fontSize: 22, color: '#f59e0b' }} />
            <Title level={4} style={{ margin: 0, fontSize: 18 }}>HopeAI</Title>
          </Flex>
          <Flex align="center" gap={8}>
            <Tooltip title="Asistente de IA">
              <Button 
                type="text" 
                icon={<RobotOutlined />} 
                size="small" 
                onClick={() => setShowAIAssistant(true)}
                style={{ color: '#3B82F6' }}
              />
            </Tooltip>
            <Button type="text" icon={<BellOutlined />} size="small" />
            <Avatar style={{ backgroundColor: '#3B82F6' }} size={28}>MT</Avatar>
            <Text strong style={{ fontSize: 13 }}>Ps. Maximiliamo Tapia</Text>
          </Flex>
        </Header>

        <Layout style={{ flex: 1, overflow: 'hidden' }}>
          {/* Side Navigation */}
          <Sider theme="light" width={48} style={{ boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)' }}>
            <Flex vertical align="center" style={{ height: '100%', padding: '12px 0' }}>
              <Button type="text" icon={<DashboardOutlined style={{ fontSize: 18 }} />} style={{ marginBottom: 12, width: 32, height: 32, padding: 0 }} />
              <Button type="text" icon={<TeamOutlined style={{ fontSize: 18 }} />} style={{ marginBottom: 12, width: 32, height: 32, padding: 0, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }} />
              <Button type="text" icon={<CalendarOutlined style={{ fontSize: 18 }} />} style={{ marginBottom: 12, width: 32, height: 32, padding: 0 }} />
              <div style={{ flexGrow: 1 }} />
              <Button type="text" icon={<SettingOutlined style={{ fontSize: 18 }} />} style={{ marginTop: 'auto', width: 32, height: 32, padding: 0 }} />
            </Flex>
          </Sider>

          {/* Main Content */}
          <Layout style={{ padding: 0, background: '#f5f5f5' }}>
            {/* Page Header */}
            <div style={{ padding: '6px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
              <Flex align="center" style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Dashboard / </Text>
                <Text style={{ fontSize: 12 }}>Gestión de Casos</Text>
              </Flex>
              <Flex justify="space-between" align="center">
                <Title level={5} style={{ margin: 0, fontSize: 16 }}>Documentación de Pacientes de Psicología Clínica</Title>
                <Flex gap={16}>
                  <Button type="text" style={{ borderBottom: '2px solid #3B82F6', color: '#3B82F6', fontWeight: 500, padding: '0 8px 4px', height: 28 }}>
                    Revisión Inicial
                  </Button>
                  <Button type="text" style={{ color: '#4B5563', padding: '0 8px 4px', height: 28 }}>
                    Revisión Concurrente
                  </Button>
                </Flex>
              </Flex>
            </div>

            {/* Content Area */}
            <Content style={{ padding: 8, height: 'calc(100% - 70px)', overflow: 'hidden' }}>
              {loading && !currentPatient ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Flex style={{ height: '100%' }} gap={8}>
                  {/* Left sidebar - Patient List */}
                  <div style={{ width: 240, height: '100%', background: '#fff', borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                      <Text strong style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>CLÍNICAS</Text>
                      <Select
                        style={{ width: '100%' }}
                        defaultValue="Centro Salud"
                        suffixIcon={<DownOutlined style={{ fontSize: 12 }} />}
                        size="small"
                      />
                    </div>
                    
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                      <Text strong style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>NOMBRE DEL PACIENTE</Text>
                      <Input 
                        placeholder="Buscar pacientes..." 
                        prefix={<SearchOutlined style={{ color: '#9CA3AF', fontSize: 12 }} />} 
                        size="small"
                      />
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'auto' }}>
                      {patients.map((patient) => (
                        <Button 
                          key={patient.id}
                          type="text"
                          block
                          className={currentPatient && patient.id === currentPatient.id ? "patient-item patient-item-active" : "patient-item"}
                          style={{ 
                            textAlign: 'left', 
                            padding: '6px 12px',
                            height: 'auto',
                            margin: '1px 0',
                            background: currentPatient && patient.id === currentPatient.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                            borderLeft: currentPatient && patient.id === currentPatient.id ? '3px solid #3B82F6' : '3px solid transparent'
                          }}
                          onClick={() => handleSelectPatient(patient.id)}
                        >
                          <Flex align="center" style={{ width: '100%' }}>
                            <Avatar 
                              icon={<UserOutlined />} 
                              size={28} 
                              style={{ 
                                backgroundColor: currentPatient && patient.id === currentPatient.id ? '#3B82F6' : '#e5e7eb', 
                                color: currentPatient && patient.id === currentPatient.id ? 'white' : '#6B7280',
                                marginRight: 8,
                                flexShrink: 0 
                              }} 
                            />
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{patient.name}</div>
                              <Flex justify="space-between" align="center" style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                                <span>ID: {patient.id}</span>
                                <Tag color={
                                  patient.status === 'Nueva Paciente' ? 'blue' : 
                                  patient.status === 'En Espera' ? 'orange' :
                                  patient.status === 'Evaluación Pendiente' ? 'purple' : 
                                  'green'
                                } style={{ fontSize: 10, padding: '0 4px', marginRight: 0, lineHeight: '16px' }}>
                                  {patient.status}
                                </Tag>
                              </Flex>
                            </div>
                          </Flex>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Main content area */}
                  <Flex vertical style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                    {/* Step Indicator - reemplazado con ThoughtChain */}
                    <div style={{ padding: 8, background: '#e6f7ff', borderRadius: 4, marginBottom: 8, border: '1px solid #91caff' }}>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>Pasos de la evaluación:</Text>
                      </div>
                      <ThoughtChain
                        steps={[
                          {
                            title: 'Recopilar Información',
                            description: 'Datos básicos del paciente',
                            status: 'finish',
                            icon: <FileTextOutlined style={{ fontSize: 12, color: '#10B981' }} />
                          },
                          {
                            title: 'Evaluación Inicial',
                            description: 'Análisis de síntomas y resultados',
                            status: 'processing',
                            icon: <SearchOutlined style={{ fontSize: 12, color: '#3B82F6' }} />
                          },
                          {
                            title: 'Generar Informe',
                            description: 'Preparar documentación clínica',
                            status: 'wait',
                            icon: <SyncOutlined style={{ fontSize: 12, color: '#9CA3AF' }} />
                          }
                        ]}
                        style={{ fontSize: 12 }}
                        size="small"
                      />
                    </div>

                    {/* Two columns layout */}
                    <Flex style={{ flex: 1, height: 'calc(100% - 56px)' }} gap={8}>
                      {/* Left column - Patient data */}
                      <div style={{ flex: 1, background: '#fff', borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '6px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Flex align="center">
                            <FileTextOutlined style={{ fontSize: 14, color: '#3B82F6', marginRight: 6 }} />
                            <Text strong style={{ fontSize: 13 }}>Datos del Paciente</Text>
                          </Flex>
                          <Tooltip title="Ayuda con datos del paciente">
                            <QuestionCircleOutlined 
                              style={{ color: '#9CA3AF', fontSize: 12, cursor: 'pointer' }}
                              onClick={() => setShowAIAssistant(true)}
                            />
                          </Tooltip>
                        </div>
                        <div style={{ padding: 12, flex: 1, overflow: 'auto' }}>
                          {currentPatient && (
                            <Space direction="vertical" style={{ width: '100%' }} size={6}>
                              <div>
                                <Text strong style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 2 }}>FECHA DE EVALUACIÓN</Text>
                                <Input 
                                  value={currentPatient.evaluationDate ? new Date(currentPatient.evaluationDate).toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : ''}
                                  readOnly 
                                  size="small" 
                                  style={{ height: 24, fontSize: 12 }} 
                                />
                              </div>
                              <div>
                                <Text strong style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 2 }}>PSICÓLOGO</Text>
                                <Input 
                                  value={currentPatient.psychologist || ''} 
                                  readOnly 
                                  size="small" 
                                  style={{ height: 24, fontSize: 12 }} 
                                />
                              </div>
                              <div>
                                <Text strong style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 2 }}>MOTIVO DE CONSULTA</Text>
                                <Input 
                                  value={currentPatient.consultReason || ''} 
                                  readOnly 
                                  size="small" 
                                  style={{ height: 24, fontSize: 12 }} 
                                />
                              </div>

                              {/* Tests section */}
                              <div>
                                <Text strong style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 2 }}>PRUEBAS PSICOLÓGICAS</Text>
                                <Space direction="vertical" style={{ width: '100%' }} size={3}>
                                  {currentPatient.testResults && currentPatient.testResults.map((test, index) => (
                                    <Button key={index} size="small" block style={{ textAlign: 'left', height: 'auto', padding: '2px 8px', fontSize: 12 }}>
                                      <Flex align="center" gap={4}>
                                        <ClockCircleOutlined style={{ fontSize: 12, color: '#3B82F6' }} />
                                        <span style={{ fontSize: 12 }}>{test.name}</span>
                                      </Flex>
                                    </Button>
                                  ))}
                                </Space>
                              </div>
                            </Space>
                          )}
                        </div>
                      </div>

                      {/* Right column - Draft and Analysis */}
                      <div style={{ flex: 1, background: '#fff', borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '6px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Flex align="center">
                            <FileTextOutlined style={{ fontSize: 14, color: '#3B82F6', marginRight: 6 }} />
                            <Text strong style={{ fontSize: 13 }}>Borrador de Evaluación Inicial</Text>
                          </Flex>
                          <Tooltip title="Sugerencias para redacción">
                            <QuestionCircleOutlined 
                              style={{ color: '#9CA3AF', fontSize: 12, cursor: 'pointer' }}
                              onClick={() => setShowAIAssistant(true)}
                            />
                          </Tooltip>
                        </div>
                        <div style={{ padding: 12, flex: 1, display: 'flex', gap: 8, overflow: 'hidden' }}>
                          {/* Analysis sidebar with ThoughtChain */}
                          <div style={{ width: 180, height: '100%', background: '#f9fafb', borderRadius: 4, overflow: 'auto' }}>
                            {loading && !thoughtSteps.length ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                                <Text style={{ marginTop: 16, fontSize: 12 }}>Analizando datos del paciente...</Text>
                              </div>
                            ) : (
                              <>
                                <ThoughtChain 
                                  steps={thoughtSteps.length ? thoughtSteps : [
                                    {
                                      title: 'Analizando',
                                      description: 'Revisando síntomas y resultados de pruebas',
                                      status: 'processing',
                                      icon: <SearchOutlined style={{ fontSize: 12, color: '#3B82F6' }} />
                                    }
                                  ]}
                                  style={{ fontSize: 12 }}
                                  size="small"
                                />
                                {suggestedDiagnoses.length > 0 && (
                                  <div style={{ padding: '8px 4px 0' }}>
                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Diagnósticos sugeridos:</Text>
                                    <Suggestion
                                      items={mapDiagnosisToSuggestionItems(suggestedDiagnoses)}
                                      style={{ fontSize: 11 }}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Report textarea and buttons */}
                          <Flex vertical style={{ flex: 1, height: '100%' }}>
                            <TextArea
                              value={evaluationText}
                              onChange={(e) => setEvaluationText(e.target.value)}
                              style={{ flex: 1, resize: 'none', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, padding: '8px' }}
                            />
                            <Flex justify="space-between" gap={6} style={{ marginTop: 6 }}>
                              <Flex gap={6}>
                                <Tooltip title="Adjuntar archivo">
                                  <Button 
                                    size="small" 
                                    icon={<PaperClipOutlined />} 
                                    style={{ height: 24, padding: '0 8px' }}
                                  />
                                </Tooltip>
                                <Tooltip title="Sugerir contenido">
                                  <Button 
                                    size="small" 
                                    icon={<RobotOutlined />} 
                                    style={{ height: 24, padding: '0 8px' }}
                                    onClick={() => setShowAIAssistant(true)}
                                  />
                                </Tooltip>
                              </Flex>
                              <Flex gap={6}>
                                <Button 
                                  size="small" 
                                  style={{ height: 24, fontSize: 12, padding: '0 8px' }}
                                  onClick={handleSaveDraft}
                                  loading={loading}
                                >
                                  Guardar
                                </Button>
                                <Button 
                                  type="primary" 
                                  size="small" 
                                  style={{ height: 24, fontSize: 12, padding: '0 8px' }}
                                  disabled={loading}
                                >
                                  Generar Informe
                                </Button>
                              </Flex>
                            </Flex>
                          </Flex>
                        </div>
                      </div>
                    </Flex>
                  </Flex>
                </Flex>
              )}
            </Content>
          </Layout>
        </Layout>

        {/* Drawer para el asistente de IA - Con funcionalidad real */}
        <Drawer 
          title={
            <Flex align="center" gap={8}>
              <RobotOutlined style={{ color: '#3B82F6' }} />
              <span>Asistente Clínico IA</span>
            </Flex>
          }
          placement="right"
          onClose={() => setShowAIAssistant(false)}
          open={showAIAssistant}
          width={320}
          bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Historial de chat */}
            <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
              {chatHistory.length === 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Asistente Clínico IA</Text>
                  <Text style={{ display: 'block', marginTop: 8, color: '#4B5563' }}>
                    Te ayudaré a analizar casos clínicos, formular diagnósticos y sugerir tratamientos basados en protocolos actualizados y criterios del DSM-5.
                  </Text>

                  <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>Puedes preguntarme sobre:</Text>
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Button 
                      block 
                      size="small" 
                      style={{ textAlign: 'left' }}
                      onClick={() => askQuestion('¿Cuáles son los criterios del DSM-5 para TAG?')}
                    >
                      ¿Cuáles son los criterios del DSM-5 para TAG?
                    </Button>
                    <Button 
                      block 
                      size="small" 
                      style={{ textAlign: 'left' }}
                      onClick={() => askQuestion('¿Qué tratamiento recomiendas para ansiedad moderada?')}
                    >
                      ¿Qué tratamiento recomiendas para ansiedad moderada?
                    </Button>
                    <Button 
                      block 
                      size="small" 
                      style={{ textAlign: 'left' }}
                      onClick={() => askQuestion('¿Debería considerar medicación para esta paciente?')}
                    >
                      ¿Debería considerar medicación para esta paciente?
                    </Button>
                  </Space>
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {chatHistory.map((message, index) => (
                    <Bubble
                      key={index}
                      content={message.content}
                      type={message.type}
                    />
                  ))}
                  {loading && (
                    <div style={{ textAlign: 'center' }}>
                      <Spin size="small" />
                    </div>
                  )}
                </Space>
              )}
            </div>

            {/* Input para preguntas */}
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 16px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Input.TextArea
                  placeholder="Pregunta sobre el caso..."
                  rows={2}
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  disabled={loading}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendQuestion();
                    }
                  }}
                />
                <Button 
                  type="primary" 
                  block 
                  onClick={handleSendQuestion}
                  loading={loading}
                  disabled={!currentQuestion.trim()}
                >
                  Enviar consulta
                </Button>
              </Space>
            </div>
          </div>
        </Drawer>
      </Layout>
    </>
  );
};

export default PatientReviewPage; 