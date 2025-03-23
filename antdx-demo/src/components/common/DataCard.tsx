import React from 'react';
import { Card, Typography, Space, Tag, List, Button, Tooltip, Divider } from 'antd';
import { ExportOutlined, EditOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export interface DataCardAction {
  key: string;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

export interface DataItem {
  key: string;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
}

interface DataCardProps {
  /** Título del card */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Descripción del contenido */
  description?: string;
  /** Lista de etiquetas */
  tags?: { text: string; color?: string }[];
  /** Datos estructurados para mostrar */
  data?: DataItem[];
  /** Acciones principales disponibles */
  actions?: DataCardAction[];
  /** Acción secundaria */
  extraAction?: DataCardAction;
  /** Si la tarjeta está marcada como favorita */
  favorite?: boolean;
  /** Función para alternar favorito */
  onToggleFavorite?: () => void;
  /** Si se debe mostrar el botón de edición */
  editable?: boolean;
  /** Callback al hacer clic en editar */
  onEdit?: () => void;
  /** Si se debe mostrar el botón de eliminación */
  deletable?: boolean;
  /** Callback al hacer clic en eliminar */
  onDelete?: () => void;
  /** Si se debe mostrar el botón de exportación */
  exportable?: boolean;
  /** Callback al hacer clic en exportar */
  onExport?: () => void;
  /** Contenido personalizado */
  children?: React.ReactNode;
  /** Tamaño del card */
  size?: 'default' | 'small';
  /** Estilo CSS adicional */
  style?: React.CSSProperties;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente reutilizable para mostrar datos estructurados en un card
 * con acciones comunes como favorito, editar, eliminar y exportar.
 */
const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  description,
  tags = [],
  data = [],
  actions = [],
  extraAction,
  favorite = false,
  onToggleFavorite,
  editable = false,
  onEdit,
  deletable = false,
  onDelete,
  exportable = false,
  onExport,
  children,
  size = 'default',
  style,
  className,
}) => {
  // Construir la lista completa de acciones
  const cardActions: React.ReactNode[] = [];
  
  // Acciones predefinidas primero
  if (onToggleFavorite) {
    cardActions.push(
      <Tooltip title={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
        <Button 
          type="text" 
          icon={favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
          onClick={onToggleFavorite} 
        />
      </Tooltip>
    );
  }
  
  if (editable && onEdit) {
    cardActions.push(
      <Tooltip title="Editar">
        <Button type="text" icon={<EditOutlined />} onClick={onEdit} />
      </Tooltip>
    );
  }
  
  if (exportable && onExport) {
    cardActions.push(
      <Tooltip title="Exportar">
        <Button type="text" icon={<ExportOutlined />} onClick={onExport} />
      </Tooltip>
    );
  }
  
  if (deletable && onDelete) {
    cardActions.push(
      <Tooltip title="Eliminar">
        <Button type="text" icon={<DeleteOutlined />} onClick={onDelete} danger />
      </Tooltip>
    );
  }
  
  // Añadir acciones personalizadas
  actions.forEach(action => {
    cardActions.push(
      <Tooltip title={action.title}>
        <Button type="text" icon={action.icon} onClick={action.onClick} />
      </Tooltip>
    );
  });

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{title}</Title>
            {subtitle && <Text type="secondary">{subtitle}</Text>}
          </div>
          {extraAction && (
            <Tooltip title={extraAction.title}>
              <Button 
                type="primary" 
                icon={extraAction.icon} 
                onClick={extraAction.onClick}
              >
                {extraAction.title}
              </Button>
            </Tooltip>
          )}
        </div>
      }
      size={size}
      actions={cardActions.length > 0 ? [<Space>{cardActions}</Space>] : undefined}
      style={style}
      className={`data-card ${className || ''}`}
    >
      {description && <Paragraph>{description}</Paragraph>}
      
      {tags.length > 0 && (
        <Space style={{ marginBottom: 16 }}>
          {tags.map(tag => (
            <Tag color={tag.color} key={tag.text}>
              {tag.text}
            </Tag>
          ))}
        </Space>
      )}
      
      {data.length > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <List
            size="small"
            dataSource={data}
            renderItem={item => (
              <List.Item key={item.key} style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', width: '100%' }}>
                  <Text type="secondary" style={{ marginRight: 8, minWidth: '120px' }}>
                    {item.label}:
                  </Text>
                  <div style={{ flex: 1 }}>
                    {item.tooltip ? (
                      <Tooltip title={item.tooltip}>
                        <Text>{item.value}</Text>
                      </Tooltip>
                    ) : (
                      <Text>{item.value}</Text>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </>
      )}
      
      {children}
    </Card>
  );
};

export default DataCard; 