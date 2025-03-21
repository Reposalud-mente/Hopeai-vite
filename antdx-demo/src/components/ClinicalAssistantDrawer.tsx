import React, { useState } from 'react';
import { Input, Button, Drawer } from 'antd';
import { Bubble } from '@ant-design/x';

export interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
}

interface ClinicalAssistantDrawerProps {
  visible: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onSendQuestion: (question: string) => Promise<string | null>;
  loading?: boolean;
}

/**
 * Componente de drawer para el asistente clínico IA
 * Permite conversaciones con el asistente IA sobre el paciente actual
 */
const ClinicalAssistantDrawer: React.FC<ClinicalAssistantDrawerProps> = ({
  visible,
  onClose,
  chatHistory,
  onSendQuestion,
  loading = false
}) => {
  const [currentQuestion, setCurrentQuestion] = useState('');

  const handleSendQuestion = async () => {
    if (!currentQuestion.trim()) return;
    await onSendQuestion(currentQuestion);
    setCurrentQuestion('');
  };

  return (
    <Drawer
      title="Asistente Clínico IA"
      placement="right"
      width={500}
      open={visible}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
        {/* Área de visualización del chat */}
        <div style={{ flex: 1, overflow: 'auto', marginBottom: 16, padding: 8 }}>
          {chatHistory.map((msg, idx) => (
            <Bubble 
              key={idx}
              type={msg.type === 'user' ? 'primary' : 'default'}
              content={msg.content}
            />
          ))}
        </div>
        
        {/* Área de entrada de preguntas */}
        <div style={{ display: 'flex', marginTop: 'auto' }}>
          <Input 
            placeholder="Haz una pregunta sobre este paciente..." 
            value={currentQuestion}
            onChange={e => setCurrentQuestion(e.target.value)}
            onPressEnter={handleSendQuestion}
            style={{ flex: 1, marginRight: 8 }}
            disabled={loading}
          />
          <Button 
            type="primary"
            onClick={handleSendQuestion}
            loading={loading}
          >
            Enviar
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default React.memo(ClinicalAssistantDrawer); 