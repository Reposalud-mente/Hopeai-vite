import React from 'react';
import { Typography, Card, Empty, Tabs, Button } from 'antd';
import { LineChartOutlined, FileTextOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * AnalysisPage presenta el panel de análisis clínicos y diagnósticos
 * generados por la IA con gráficos y tendencias.
 */
const AnalysisPage: React.FC = () => {
  return (
    <div>
      <Typography>
        <Title level={2}>Análisis Clínicos</Title>
        <Paragraph>Visualización de tendencias y diagnósticos generados por HopeAI.</Paragraph>
      </Typography>

      <Tabs defaultActiveKey="1" style={{ marginTop: 24 }}>
        <TabPane 
          tab={
            <span>
              <LineChartOutlined />
              Tendencias
            </span>
          } 
          key="1"
        >
          <Card>
            <Empty 
              description="No hay datos de tendencias disponibles" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary">Generar Análisis</Button>
            </Empty>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              Informes
            </span>
          } 
          key="2"
        >
          <Card>
            <Empty 
              description="No hay informes disponibles" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary">Crear Informe</Button>
            </Empty>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <BulbOutlined />
              Diagnósticos IA
            </span>
          } 
          key="3"
        >
          <Card>
            <Empty 
              description="No hay diagnósticos generados" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary">Solicitar Diagnóstico</Button>
            </Empty>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AnalysisPage; 