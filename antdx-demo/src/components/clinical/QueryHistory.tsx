import React, { useState, useEffect } from 'react';
import { 
  List, Card, Input, Tag, Typography, Space, Button, 
  Dropdown, Menu, DatePicker, Empty, Spin 
} from 'antd';
import { 
  SearchOutlined, StarOutlined, StarFilled, 
  HistoryOutlined, CalendarOutlined, TagOutlined, DeleteOutlined 
} from '@ant-design/icons';
import { ClinicalQuery } from '../../types/ClinicalQuery';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const { Text } = Typography;
const { Search } = Input;

interface QueryHistoryProps {
  queries: ClinicalQuery[];
  loading?: boolean;
  onToggleFavorite?: (queryId: number, isFavorite: boolean) => Promise<void>;
  onDeleteQuery?: (queryId: number) => Promise<void>;
  onSelectQuery?: (query: ClinicalQuery) => void;
  onSearchChange?: (searchTerm: string) => void;
  title?: string;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({
  queries = [],
  loading = false,
  onToggleFavorite,
  onDeleteQuery,
  onSelectQuery,
  onSearchChange,
  title = "Historial de Consultas"
}) => {
  const [filteredQueries, setFilteredQueries] = useState<ClinicalQuery[]>(queries);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  
  // Extraer todas las etiquetas únicas de las consultas
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    queries.forEach(query => {
      if (query.tags && query.tags.length > 0) {
        query.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [queries]);
  
  // Aplicar filtros y búsqueda cuando cambian las consultas o los filtros
  useEffect(() => {
    let result = [...queries];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(q => 
        q.question.toLowerCase().includes(term) || 
        (q.answer && q.answer.toLowerCase().includes(term))
      );
    }
    
    // Filtrar por etiquetas seleccionadas
    if (selectedTags.length > 0) {
      result = result.filter(q => {
        if (!q.tags || q.tags.length === 0) return false;
        return selectedTags.some(tag => q.tags!.includes(tag));
      });
    }
    
    // Filtrar por favoritos
    if (showOnlyFavorites) {
      result = result.filter(q => q.isFavorite);
    }
    
    // Filtrar por rango de fechas
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      result = result.filter(q => {
        if (!q.createdAt) return false;
        const queryDate = dayjs(q.createdAt);
        return queryDate.isAfter(startDate) && queryDate.isBefore(endDate);
      });
    }
    
    setFilteredQueries(result);
  }, [queries, searchTerm, selectedTags, showOnlyFavorites, dateRange]);
  
  // Manejar búsqueda
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };
  
  // Manejar selección de etiquetas
  const handleTagSelect: MenuProps['onClick'] = ({ key }) => {
    if (selectedTags.includes(key as string)) {
      setSelectedTags(selectedTags.filter(tag => tag !== key));
    } else {
      setSelectedTags([...selectedTags, key as string]);
    }
  };
  
  // Manejar cambio en rango de fechas
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setDateRange(dates);
  };
  
  // Resetear todos los filtros
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setShowOnlyFavorites(false);
    setDateRange(null);
    if (onSearchChange) {
      onSearchChange('');
    }
  };
  
  // Menú para selección de etiquetas
  const tagMenu = (
    <Menu onClick={handleTagSelect}>
      {allTags.map(tag => (
        <Menu.Item key={tag}>
          <Space>
            {selectedTags.includes(tag) && '✓'}
            <Tag color="blue">{tag}</Tag>
          </Space>
        </Menu.Item>
      ))}
      {allTags.length === 0 && (
        <Menu.Item disabled>No hay etiquetas disponibles</Menu.Item>
      )}
    </Menu>
  );
  
  return (
    <Card 
      title={
        <Space>
          <HistoryOutlined />
          <span>{title}</span>
          {loading && <Spin size="small" />}
        </Space>
      }
      style={{ width: '100%' }}
      extra={
        <Space>
          <Button 
            type={showOnlyFavorites ? "primary" : "text"} 
            icon={<StarOutlined />}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            Favoritos
          </Button>
          
          <Dropdown overlay={tagMenu} trigger={['click']}>
            <Button icon={<TagOutlined />}>
              Etiquetas {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
          </Dropdown>
          
          <DatePicker.RangePicker 
            allowClear
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder={['Desde', 'Hasta']}
          />
          
          {(searchTerm || selectedTags.length > 0 || showOnlyFavorites || dateRange) && (
            <Button onClick={resetFilters}>Limpiar filtros</Button>
          )}
        </Space>
      }
    >
      <Search
        placeholder="Buscar en consultas..."
        allowClear
        enterButton={<SearchOutlined />}
        onSearch={handleSearch}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      
      <List
        dataSource={filteredQueries}
        renderItem={(query) => (
          <List.Item
            key={query.id}
            actions={[
              onToggleFavorite && query.id ? (
                <Button 
                  type="text" 
                  icon={query.isFavorite ? <StarFilled /> : <StarOutlined />} 
                  onClick={() => onToggleFavorite(query.id!, query.isFavorite)}
                />
              ) : null,
              onDeleteQuery && query.id ? (
                <Button 
                  type="text" 
                  danger
                  icon={<DeleteOutlined />} 
                  onClick={() => onDeleteQuery(query.id!)}
                />
              ) : null
            ].filter(Boolean)}
            style={{ cursor: onSelectQuery ? 'pointer' : 'default' }}
            onClick={() => onSelectQuery && onSelectQuery(query)}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{query.question}</Text>
                  {query.tags && query.tags.map((tag, index) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </Space>
              }
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  {query.answer && (
                    <Text 
                      type="secondary"
                      style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {query.answer}
                    </Text>
                  )}
                  <Space>
                    {query.createdAt && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {dayjs(query.createdAt).format('DD/MM/YYYY HH:mm')}
                      </Text>
                    )}
                    {query.responseJson?.confidenceScore && (
                      <Tag color={
                        query.responseJson.confidenceScore > 0.7 ? 'green' : 
                        query.responseJson.confidenceScore > 0.4 ? 'orange' : 
                        'red'
                      }>
                        Confianza: {Math.round(query.responseJson.confidenceScore * 100)}%
                      </Tag>
                    )}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
        locale={{ 
          emptyText: searchTerm || selectedTags.length > 0 || showOnlyFavorites || dateRange ? 
            <Empty description="No hay resultados con los filtros aplicados" /> : 
            <Empty description="No hay consultas guardadas" />
        }}
        style={{ 
          maxHeight: '500px', 
          overflow: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
          padding: '8px'
        }}
        pagination={{
          pageSize: 10,
          size: 'small',
          showTotal: (total) => `${total} consultas`,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50']
        }}
      />
    </Card>
  );
};

export default QueryHistory; 