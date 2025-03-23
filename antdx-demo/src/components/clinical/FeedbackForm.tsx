import React, { useState } from 'react';
import { Form, Rate, Input, Checkbox, Button, Card, Typography, Space, message } from 'antd';
import { SmileOutlined, MehOutlined, FrownOutlined } from '@ant-design/icons';
import { useClinicalQuery } from '../../hooks/useClinicalQuery';

const { TextArea } = Input;
const { Title } = Typography;

// Componente personalizado para mostrar iconos en el Rate
const customIcons: Record<number, React.ReactNode> = {
  1: <FrownOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />,
  2: <FrownOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
  3: <MehOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
  4: <SmileOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
  5: <SmileOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
};

interface FeedbackFormProps {
  queryId: number;
  patientId: string;
  onFeedbackSubmit?: () => void;
}

interface FeedbackFormValues {
  rating: number;
  feedback?: string;
  tags?: string[];
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ queryId, patientId, onFeedbackSubmit }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { provideFeedback } = useClinicalQuery({ patientId });
  
  const handleSubmit = async (values: FeedbackFormValues) => {
    setSubmitting(true);
    try {
      await provideFeedback(queryId, {
        rating: values.rating,
        comment: values.feedback,
        tags: values.tags || []
      });
      
      message.success('¡Gracias por tu retroalimentación!');
      form.resetFields();
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error al enviar retroalimentación:', error);
      message.error('No se pudo enviar la retroalimentación, por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card
      className="feedback-form"
      style={{ marginTop: 16, marginBottom: 16 }}
      title={<Title level={5}>¿Fue útil esta respuesta?</Title>}
      size="small"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ rating: 3 }}
      >
        <Form.Item 
          name="rating"
          label="Calificación"
          rules={[{ required: true, message: 'Por favor califica la respuesta' }]}
        >
          <Rate 
            character={({ index }) => customIcons[index! + 1]}
            allowHalf={false}
          />
        </Form.Item>
        
        <Form.Item 
          name="tags"
          label="¿Qué características tenía la respuesta?"
        >
          <Checkbox.Group>
            <Space direction="vertical">
              <Checkbox value="helpful">Útil para mi trabajo clínico</Checkbox>
              <Checkbox value="accurate">Precisa y basada en evidencia</Checkbox>
              <Checkbox value="detailed">Suficientemente detallada</Checkbox>
            </Space>
          </Checkbox.Group>
        </Form.Item>
        
        <Form.Item
          name="feedback"
          label="Comentarios adicionales"
        >
          <TextArea
            placeholder="¿Cómo podemos mejorar esta respuesta?"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={submitting}
          >
            Enviar retroalimentación
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FeedbackForm; 