import React from 'react';
import { Form, Input, Select, Checkbox, Radio, DatePicker, TimePicker, InputNumber, Switch, Slider, Rate, Upload, Button, Space, Divider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { FormInstance, FormItemProps, Rule } from 'antd/es/form';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Group: RadioGroup } = Radio;
const { Group: CheckboxGroup } = Checkbox;

export type FieldType = 
  | 'text' 
  | 'password' 
  | 'textarea' 
  | 'number' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'checkboxgroup' 
  | 'radio' 
  | 'date' 
  | 'daterange' 
  | 'time' 
  | 'switch' 
  | 'slider' 
  | 'rate' 
  | 'upload' 
  | 'custom';

export interface FormItem {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  tooltip?: string;
  rules?: Rule[];
  initialValue?: unknown;
  options?: Array<{ label: string; value: unknown; disabled?: boolean }>;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  hidden?: boolean;
  extra?: string;
  width?: string | number;
  dependencies?: string[];
  formItemProps?: FormItemProps;
  fieldProps?: Record<string, unknown>;
  render?: (props: RenderProps) => React.ReactNode;
}

export interface RenderProps {
  disabled?: boolean;
  placeholder?: string;
  field: FormItem;
  form: FormInstance;
  [key: string]: unknown;
}

export interface FormSection {
  title?: string;
  description?: string;
  fields: FormItem[];
}

interface DynamicFormProps {
  /** Definición de secciones y campos del formulario */
  sections: FormSection[];
  /** Referencia al formulario para control externo */
  form?: FormInstance;
  /** Callback para envío del formulario */
  onFinish?: (values: Record<string, unknown>) => void;
  /** Callback para cambios en el formulario */
  onValuesChange?: (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => void;
  /** Texto del botón de envío */
  submitText?: string;
  /** Texto del botón de cancelación */
  cancelText?: string;
  /** Callback para cancelar */
  onCancel?: () => void;
  /** Si el formulario es de solo lectura */
  readOnly?: boolean;
  /** Si los botones de acción deben aparecer al final */
  showActions?: boolean;
  /** Si debe haber una separación entre secciones */
  dividerBetweenSections?: boolean;
  /** Si los campos deben organizarse en línea (horizontal) */
  inline?: boolean;
  /** Disposición del formulario */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** Tamaño de los elementos del formulario */
  size?: 'small' | 'middle' | 'large';
  /** Si debe mostrarse un botón de reseteo */
  showReset?: boolean;
  /** Componente personalizado a renderizar antes de las acciones */
  preActions?: React.ReactNode;
  /** Estilo adicional */
  style?: React.CSSProperties;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente para crear formularios dinámicos a partir de una configuración declarativa
 */
const FormBuilder: React.FC<DynamicFormProps> = ({
  sections = [],
  form,
  onFinish,
  onValuesChange,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onCancel,
  readOnly = false,
  showActions = true,
  dividerBetweenSections = true,
  inline = false,
  layout = 'horizontal',
  size = 'middle',
  showReset = false,
  preActions,
  style,
  className,
}) => {
  const [formInstance] = Form.useForm();
  const formRef = form || formInstance;

  // Función para resetear el formulario
  const handleReset = () => {
    formRef.resetFields();
  };

  // Función para renderizar cada tipo de campo
  const renderField = (field: FormItem) => {
    const { type, options, min, max, step, rows, fieldProps = {}, render } = field;

    // Propiedades comunes para todos los campos
    const commonProps = {
      disabled: readOnly || field.disabled,
      placeholder: field.placeholder,
      ...fieldProps,
    };

    // Si el campo tiene una función de renderizado personalizada
    if (type === 'custom' && render) {
      return render({ 
        ...commonProps,
        field,
        form: formRef
      });
    }

    // Switch para cada tipo de campo
    switch (type) {
      case 'text':
        return <Input {...commonProps} />;

      case 'password':
        return <Input.Password {...commonProps} />;

      case 'textarea':
        return <TextArea rows={rows || 4} {...commonProps} />;

      case 'number':
        return <InputNumber min={min} max={max} step={step || 1} style={{ width: '100%' }} {...commonProps} />;

      case 'select':
        return (
          <Select {...commonProps}>
            {options?.map((option) => (
              <Option key={String(option.value)} value={option.value} disabled={option.disabled}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <Select mode="multiple" {...commonProps}>
            {options?.map((option) => (
              <Option key={String(option.value)} value={option.value} disabled={option.disabled}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'checkbox':
        return <Checkbox {...commonProps}>{field.label}</Checkbox>;

      case 'checkboxgroup':
        return <CheckboxGroup options={options} {...commonProps} />;

      case 'radio':
        return <RadioGroup options={options} {...commonProps} />;

      case 'date':
        return <DatePicker style={{ width: '100%' }} {...commonProps} />;

      case 'daterange':
        return <RangePicker style={{ width: '100%' }} {...commonProps} />;

      case 'time':
        return <TimePicker style={{ width: '100%' }} {...commonProps} />;

      case 'switch':
        return <Switch {...commonProps} />;

      case 'slider':
        return <Slider min={min} max={max} step={step} {...commonProps} />;

      case 'rate':
        return <Rate {...commonProps} />;

      case 'upload':
        return (
          <Upload {...commonProps}>
            <Button icon={<UploadOutlined />}>Seleccionar archivo</Button>
          </Upload>
        );

      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <Form
      form={formRef}
      layout={layout}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      size={size}
      className={`dynamic-form ${className || ''}`}
      style={style}
    >
      {sections.map((section, sectionIndex) => (
        <React.Fragment key={`section-${sectionIndex}`}>
          {section.title && (
            <div className="form-section-header">
              <h4>{section.title}</h4>
              {section.description && <p className="section-description">{section.description}</p>}
            </div>
          )}

          <div className={`form-section-content ${inline ? 'inline-fields' : ''}`}>
            {section.fields.map((field) => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.type !== 'checkbox' ? field.label : ''}
                tooltip={field.tooltip}
                rules={field.required ? [{ required: true, message: `${field.label} es requerido` }, ...(field.rules || [])] : field.rules}
                initialValue={field.initialValue}
                hidden={field.hidden}
                dependencies={field.dependencies}
                extra={field.extra}
                style={{ width: field.width ? field.width : (inline ? 'auto' : '100%'), marginRight: inline ? '16px' : undefined }}
                {...field.formItemProps}
                valuePropName={field.type === 'checkbox' || field.type === 'switch' ? 'checked' : 'value'}
              >
                {renderField(field)}
              </Form.Item>
            ))}
          </div>

          {dividerBetweenSections && sectionIndex < sections.length - 1 && <Divider />}
        </React.Fragment>
      ))}

      {showActions && (
        <Form.Item className="form-actions">
          {preActions}
          <Space>
            {showReset && (
              <Button onClick={handleReset}>Resetear</Button>
            )}
            {onCancel && (
              <Button onClick={onCancel}>{cancelText}</Button>
            )}
            <Button type="primary" htmlType="submit">
              {submitText}
            </Button>
          </Space>
        </Form.Item>
      )}
    </Form>
  );
};

export default FormBuilder; 