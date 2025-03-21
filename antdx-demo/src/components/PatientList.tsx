import React, { useState, useMemo, memo } from 'react';
import { Table, Input, Space, Tag, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types/clinical-types';

interface PatientListProps {
  patients: Patient[];
  isLoading?: boolean;
}

/**
 * Componente que muestra una lista de pacientes con capacidades de búsqueda y clasificación
 */
const PatientList: React.FC<PatientListProps> = ({ patients, isLoading = false }) => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  // Memoizar el filtrado de pacientes para evitar cálculos repetidos
  const filteredPatients = useMemo(() => 
    patients.filter(patient =>
      patient.name.toLowerCase().includes(searchText.toLowerCase())
    ), 
    [patients, searchText]
  );

  // Memoizar la definición de columnas para evitar recreación en cada render
  const columns = useMemo(() => [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Patient, b: Patient) => a.name.localeCompare(b.name),
    },
    {
      title: 'Edad',
      dataIndex: 'age',
      key: 'age',
      sorter: (a: Patient, b: Patient) => (a.age || 0) - (b.age || 0),
      render: (age: number | undefined) => age || '-',
    },
    {
      title: 'Última Evaluación',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      sorter: (a: Patient, b: Patient) => {
        const dateA = a.evaluationDate ? new Date(a.evaluationDate).getTime() : 0;
        const dateB = b.evaluationDate ? new Date(b.evaluationDate).getTime() : 0;
        return dateA - dateB;
      },
      render: (date: string | undefined) => date || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: 'Activo' },
          inactive: { color: 'grey', text: 'Inactivo' },
          pending: { color: 'orange', text: 'Pendiente' },
          completed: { color: 'blue', text: 'Completado' },
        };
        
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: Patient) => (
        <Space size="small">
          <Button type="link" onClick={() => navigate(`/pacientes/${record.id}`)}>
            Ver Detalle
          </Button>
        </Space>
      ),
    },
  ], [navigate]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Buscar paciente"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 240 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredPatients}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={isLoading}
      />
    </div>
  );
};

// Memoizar el componente para evitar renders innecesarios
export default memo(PatientList);
