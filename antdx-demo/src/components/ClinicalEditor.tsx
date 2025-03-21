import React from 'react';
import { Input, Button, Flex, Typography, Tooltip } from 'antd';
import { SaveOutlined, SyncOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface ClinicalEditorProps {
  evaluationText: string;
  setEvaluationText: (text: string) => void;
  handleSaveDraft: () => Promise<boolean>;
  loading: boolean;
}

const ClinicalEditor: React.FC<ClinicalEditorProps> = ({
  evaluationText,
  setEvaluationText,
  handleSaveDraft,
  loading
}) => {
  return (
    <div className="clinical-editor" style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
        <Text strong>Notas Clínicas</Text>
        <Flex gap={8}>
          <Tooltip title="Guardar borrador">
            <Button 
              icon={<SaveOutlined />} 
              onClick={handleSaveDraft}
              loading={loading}
              disabled={loading}
            >
              Guardar
            </Button>
          </Tooltip>
          <Tooltip title="Análisis en tiempo real">
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              disabled={loading}
            >
              Analizar
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
      
      <TextArea
        value={evaluationText}
        onChange={(e) => setEvaluationText(e.target.value)}
        placeholder="Ingrese sus notas clínicas aquí..."
        autoSize={{ minRows: 12, maxRows: 20 }}
        style={{ marginBottom: '16px' }}
        disabled={loading}
      />
      
      <Text type="secondary" style={{ fontSize: '12px' }}>
        El análisis de IA se actualiza automáticamente al escribir. Guarde regularmente su trabajo.
      </Text>
    </div>
  );
};

export default ClinicalEditor; 