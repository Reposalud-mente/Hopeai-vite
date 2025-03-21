import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * DashboardPage muestra un resumen de la actividad y métricas clave
 * para el profesional de salud mental.
 */
const DashboardPage: React.FC = () => {
  return (
    <div>
      <Typography>
        <Title level={2}>Dashboard</Title>
        <Paragraph>Bienvenido al sistema de asistencia clínica HopeAI.</Paragraph>
      </Typography>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pacientes Activos"
              value={12}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Evaluaciones Pendientes"
              value={5}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tratamientos Activos"
              value={8}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Typography>
          <Title level={4}>Actividad Reciente</Title>
          <Paragraph>
            No hay actividad reciente para mostrar.
          </Paragraph>
        </Typography>
      </Card>
    </div>
  );
};

export default DashboardPage; 