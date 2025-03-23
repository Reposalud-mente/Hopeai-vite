import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClinicalChatPanel from '../ClinicalChatPanel';
import React from 'react';
import { useClinicalQuery } from '../../../hooks/useClinicalQuery';

// Mock del hook useClinicalQuery
vi.mock('../../../hooks/useClinicalQuery', () => ({
  useClinicalQuery: vi.fn()
}));

// Mock de antd para componentes complejos con tipado adecuado
vi.mock('antd', () => ({
  Input: ({ onChange, onPressEnter, value, disabled }: {
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    value?: string;
    disabled?: boolean;
  }) => (
    <input 
      data-testid="chat-input" 
      onChange={onChange} 
      onKeyDown={(e) => e.key === 'Enter' && onPressEnter?.(e)}
      value={value}
      disabled={disabled}
    />
  ),
  Button: ({ onClick, icon, loading, disabled, children }: {
    onClick?: React.MouseEventHandler;
    icon?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
  }) => (
    <button 
      data-testid="send-button" 
      onClick={onClick}
      disabled={disabled || loading}
    >
      {icon}{children}
    </button>
  ),
  Spin: ({ spinning, children }: {
    spinning?: boolean;
    children?: React.ReactNode;
  }) => (
    <div data-testid="spinner" className={spinning ? 'spinning' : ''}>
      {children}
    </div>
  ),
  Typography: {
    Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Paragraph: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
    Title: ({ children, level }: { children?: React.ReactNode; level?: number }) => 
      React.createElement(`h${level || 1}`, {}, children),
  }
}));

describe('ClinicalChatPanel', () => {
  // Setup mock del hook
  const mockSendQuery = vi.fn();
  const mockReprocessQuery = vi.fn();
  const mockMarkAsFavorite = vi.fn();
  const mockOnSubmitQuery = vi.fn().mockResolvedValue({
    id: 1,
    question: 'Test question',
    answer: 'Test answer',
    responseJson: {
      mainAnswer: 'Test answer',
      reasoning: 'Test reasoning',
      confidenceScore: 0.8,
      references: [] as {source: string, citation: string, link?: string}[]
    },
    confidenceScore: 0.8,
    patientId: '123',
    isFavorite: false,
    createdAt: new Date()
  });
  
  beforeEach(() => {
    // Reset mocks
    mockSendQuery.mockReset();
    mockReprocessQuery.mockReset();
    mockMarkAsFavorite.mockReset();
    mockOnSubmitQuery.mockReset().mockResolvedValue({
      id: 1,
      question: 'Test question',
      answer: 'Test answer',
      responseJson: {
        mainAnswer: 'Test answer',
        reasoning: 'Test reasoning',
        confidenceScore: 0.8,
        references: [] as {source: string, citation: string, link?: string}[]
      },
      confidenceScore: 0.8,
      patientId: '123',
      isFavorite: false,
      createdAt: new Date()
    });
    
    // Configuración por defecto del mock del hook
    (useClinicalQuery as vi.Mock).mockReturnValue({
      loading: false,
      queries: [],
      currentQuery: null,
      error: null,
      sendQuery: mockSendQuery,
      reprocessQuery: mockReprocessQuery,
      markAsFavorite: mockMarkAsFavorite
    });
  });
  
  it('debe renderizar correctamente el panel en estado inicial', () => {
    render(<ClinicalChatPanel patientId="123" onSubmitQuery={mockOnSubmitQuery} />);
    
    // Verificar que los elementos principales estén presentes
    expect(screen.getByPlaceholderText(/consulta clínica/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });
  
  it('debe enviar una consulta cuando el usuario presiona Enviar', async () => {
    render(<ClinicalChatPanel patientId="123" onSubmitQuery={mockOnSubmitQuery} />);
    
    // Simulamos entrada del usuario
    const input = screen.getByPlaceholderText(/consulta clínica/i);
    fireEvent.change(input, { target: { value: '¿Qué síntomas indican depresión?' } });
    
    // Enviar consulta
    const submitButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(submitButton);
    
    // Verificar que se llamó a sendQuery
    await expect(mockSendQuery).toHaveBeenCalledWith(
      '¿Qué síntomas indican depresión?',
      '123',
      expect.any(Array)
    );
  });
  
  it('debe mostrar indicador de carga mientras procesa la consulta', () => {
    // Configurar mock para simular estado de carga
    (useClinicalQuery as vi.Mock).mockReturnValue({
      loading: true,
      queries: [],
      currentQuery: null,
      error: null,
      sendQuery: mockSendQuery
    });
    
    render(<ClinicalChatPanel patientId="123" onSubmitQuery={mockOnSubmitQuery} />);
    
    // Verificar que se muestra el indicador de carga
    expect(screen.getByText(/procesando/i) || screen.getByLabelText(/cargando/i)).toBeInTheDocument();
  });
  
  it('debe mostrar la respuesta cuando se completa el procesamiento', () => {
    // Mock de consulta completada
    const mockCompletedQuery = {
      id: 1,
      question: '¿Qué síntomas indican depresión?',
      answer: 'Los síntomas principales incluyen estado de ánimo deprimido, pérdida de interés en actividades...',
      responseJson: {
        mainAnswer: 'Los síntomas principales incluyen estado de ánimo deprimido...',
        reasoning: 'Según el DSM-5...',
        confidenceScore: 0.85,
        references: [{ source: 'DSM-5', citation: 'Criterios diagnósticos para Trastorno Depresivo Mayor' }] as {source: string, citation: string, link?: string}[]
      },
      confidenceScore: 0.85,
      patientId: '123',
      isFavorite: false,
      createdAt: new Date()
    };
    
    (useClinicalQuery as vi.Mock).mockReturnValue({
      loading: false,
      queries: [mockCompletedQuery],
      currentQuery: mockCompletedQuery,
      error: null,
      sendQuery: mockSendQuery
    });
    
    render(<ClinicalChatPanel patientId="123" onSubmitQuery={mockOnSubmitQuery} />);
    
    // Verificar que se muestra la respuesta
    expect(screen.getByText(/Los síntomas principales incluyen/i)).toBeInTheDocument();
  });
  
  it('debe permitir marcar una consulta como favorita', async () => {
    // Mock de consulta completada
    const mockCompletedQuery = {
      id: 1,
      question: '¿Qué síntomas indican depresión?',
      answer: 'Los síntomas principales incluyen...',
      responseJson: {
        mainAnswer: 'Los síntomas principales incluyen...',
        confidenceScore: 0.85,
        references: [] as {source: string, citation: string, link?: string}[]
      },
      confidenceScore: 0.85,
      patientId: '123',
      isFavorite: false
    };
    
    (useClinicalQuery as vi.Mock).mockReturnValue({
      loading: false,
      queries: [mockCompletedQuery],
      currentQuery: mockCompletedQuery,
      error: null,
      sendQuery: mockSendQuery,
      markAsFavorite: mockMarkAsFavorite
    });
    
    render(<ClinicalChatPanel patientId="123" onSubmitQuery={mockOnSubmitQuery} />);
    
    // Buscar y hacer clic en el botón de favorito
    const favoriteButton = screen.getByLabelText(/marcar como favorito/i);
    fireEvent.click(favoriteButton);
    
    // Verificar que se llamó a markAsFavorite
    expect(mockMarkAsFavorite).toHaveBeenCalledWith(1, true);
  });
}); 