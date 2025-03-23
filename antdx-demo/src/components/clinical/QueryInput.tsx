import React, { useState, useEffect, useMemo } from 'react';
import { Input, AutoComplete, Button, Space, Tag } from 'antd';
import { SendOutlined, TagOutlined } from '@ant-design/icons';
import { ClinicalTerm, filterClinicalTerms } from '../../utils/clinicalTerms';

const { TextArea } = Input;

interface QueryInputProps {
  onSubmit: (question: string) => Promise<void>;
  loading?: boolean;
  initialValue?: string;
  placeholder?: string;
}

// Opciones para el componente AutoComplete
interface AutoCompleteOption {
  value: string;
  label: React.ReactNode;
}

const QueryInput: React.FC<QueryInputProps> = ({
  onSubmit,
  loading = false,
  initialValue = '',
  placeholder = 'Escribe tu consulta clínica aquí...'
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<ClinicalTerm[]>([]);
  const [lastText, setLastText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    // Actualizar cuando cambia el initialValue (ej: al hacer clic en sugerencias)
    if (initialValue !== query && initialValue !== '') {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Extraer la palabra actual en la posición del cursor para autocompletado
  const getCurrentWord = (text: string, position: number): string => {
    if (!text || position === 0) return '';
    
    // Buscar el inicio de la palabra actual (desde la posición del cursor hacia atrás)
    let start = position;
    while (start > 0 && text[start - 1] !== ' ' && text[start - 1] !== '\n') {
      start--;
    }
    
    // Extraer la palabra actual hasta la posición del cursor
    const currentWord = text.substring(start, position);
    return currentWord.trim();
  };

  // Actualizar sugerencias cuando cambia el texto
  const updateSuggestions = (text: string, position: number) => {
    const currentWord = getCurrentWord(text, position);
    
    if (currentWord.length >= 2) {
      // Solo buscar términos si la palabra actual tiene al menos 2 caracteres
      const terms = filterClinicalTerms(currentWord);
      setSuggestions(terms);
    } else {
      setSuggestions([]);
    }
    
    setLastText(text);
    setCursorPosition(position);
  };

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Obtener posición actual del cursor
    const cursorPos = e.target.selectionStart || 0;
    updateSuggestions(value, cursorPos);
  };

  // Manejar selección de una sugerencia
  const handleSelect = (value: string) => {
    // Reemplazar la palabra actual con el término seleccionado
    const beforeCursor = lastText.substring(0, cursorPosition - getCurrentWord(lastText, cursorPosition).length);
    const afterCursor = lastText.substring(cursorPosition);
    
    const newText = `${beforeCursor}${value} ${afterCursor}`;
    setQuery(newText);
    
    // Limpiar sugerencias después de seleccionar
    setSuggestions([]);
  };

  // Formatear opciones para AutoComplete
  const autoCompleteOptions = useMemo(() => {
    return suggestions.map(term => ({
      value: term.value,
      label: (
        <div>
          <Space>
            <span>{term.label}</span>
            <Tag color={
              term.category === 'trastorno' ? 'red' : 
              term.category === 'síntoma' ? 'blue' : 
              term.category === 'tratamiento' ? 'green' : 
              'orange'
            }>
              {term.category}
            </Tag>
            {term.code && <Tag color="purple">{term.code}</Tag>}
          </Space>
        </div>
      )
    }));
  }, [suggestions]);

  // Manejar envío de consulta
  const handleSubmit = async () => {
    if (!query.trim() || loading) return;
    await onSubmit(query.trim());
    // No limpiamos el query aquí, eso lo hará el componente padre si es necesario
  };

  // Manejar tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="clinical-autocomplete-container" style={{ position: 'relative' }}>
        <AutoComplete<string, AutoCompleteOption>
          style={{ width: '100%' }}
          options={autoCompleteOptions}
          onSelect={handleSelect}
          open={suggestions.length > 0}
          value={query}
          notFoundContent={null}
        >
          <TextArea
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            autoSize={{ minRows: 2, maxRows: 4 }}
            onKeyDown={handleKeyDown}
            className="clinical-query-input"
          />
        </AutoComplete>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div>
          <TagOutlined style={{ marginRight: 8 }} />
          <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
            Escriba 2+ caracteres para ver términos clínicos sugeridos
          </span>
        </div>
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSubmit}
          loading={loading}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
};

export default QueryInput; 