import React, { useEffect, useMemo, useCallback } from 'react';
import { Form, Input, DatePicker, Select, Button, Space, Row, Col, Typography } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Patient } from '../types/clinical-types';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface PatientFormProps {
  patient?: Patient;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

interface PatientFormValues {
  name: string;
  birthDate?: dayjs.Dayjs;
  gender?: string;
  status: string;
  evaluationDate?: dayjs.Dayjs;
  psychologist?: string;
  consultReason?: string;
}

/**
 * Componente de formulario para creación y edición de pacientes
 */
const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSave,
  onCancel,
  isLoading = false,
  disabled = false,
  mode = 'create',
}) => {
  const [form] = Form.useForm();
  const isEditing = mode === 'edit';

  // Reiniciar el formulario cuando cambia el paciente (memoizado)
  useEffect(() => {
    if (patient) {
      // Diferimos la actualización del formulario para evitar bloquear el hilo principal
      const timer = setTimeout(() => {
        form.setFieldsValue({
          ...patient,
          birthDate: patient.birthDate ? dayjs(patient.birthDate) : undefined,
          evaluationDate: patient.evaluationDate ? dayjs(patient.evaluationDate) : undefined,
        });
      }, 0);
      
      return () => clearTimeout(timer);
    } else {
      form.resetFields();
    }
  }, [patient, form]);

  // Memoizamos los valores iniciales para evitar recálculos
  const initialValues = useMemo(() => ({
    status: 'active',
    gender: '',
  }), []);

  const handleSubmit = useCallback((values: PatientFormValues) => {
    const formattedValues = {
      ...values,
      birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : undefined,
      evaluationDate: values.evaluationDate ? values.evaluationDate.format('YYYY-MM-DD') : undefined,
      id: patient?.id || Math.floor(Math.random() * 1000), // Temporal para demo (debería venir del backend)
    };

    onSave(formattedValues as Patient);
  }, [patient?.id, onSave]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues}
      disabled={disabled || isLoading || mode === 'view'}
    >
      <Title level={3}>
        {mode === 'edit' ? 'Editar Paciente' : mode === 'create' ? 'Nuevo Paciente' : 'Detalles del Paciente'}
      </Title>
      
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="name"
            label="Nombre completo"
            rules={[{ required: true, message: 'Por favor ingrese el nombre del paciente' }]}
          >
            <Input placeholder="Nombre completo del paciente" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="birthDate"
            label="Fecha de nacimiento"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Seleccione fecha" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="gender"
            label="Género"
          >
            <Select placeholder="Seleccione género">
              <Option value="masculino">Masculino</Option>
              <Option value="femenino">Femenino</Option>
              <Option value="otro">Otro</Option>
              <Option value="prefiero_no_decir">Prefiero no decir</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="status"
            label="Estado"
            rules={[{ required: true, message: 'Por favor seleccione un estado' }]}
          >
            <Select placeholder="Seleccione estado">
              <Option value="active">Activo</Option>
              <Option value="inactive">Inactivo</Option>
              <Option value="pending">Pendiente</Option>
              <Option value="completed">Completado</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="evaluationDate"
            label="Fecha de última evaluación"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Seleccione fecha" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="psychologist"
            label="Psicólogo/a asignado/a"
          >
            <Input placeholder="Nombre del psicólogo" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="consultReason"
            label="Motivo de consulta"
          >
            <TextArea rows={4} placeholder="Describa el motivo de consulta" />
          </Form.Item>
        </Col>
      </Row>

      {mode !== 'view' && (
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isLoading}
            >
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
            <Button 
              icon={<CloseOutlined />} 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </Space>
        </Form.Item>
      )}
    </Form>
  );
};

export default PatientForm;
