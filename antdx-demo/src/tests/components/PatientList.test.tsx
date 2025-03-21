import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import PatientList from '../../components/PatientList';
import { Patient } from '../../types/clinical-types';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('PatientList Component', () => {
  const mockPatients: Patient[] = [
    { 
      id: '1', 
      name: 'Juan Pérez', 
      age: 35, 
      evaluationDate: '2023-03-15', 
      status: 'active'
    },
    { 
      id: '2', 
      name: 'María González', 
      age: 42, 
      evaluationDate: '2023-02-20', 
      status: 'completed'
    },
    { 
      id: '3', 
      name: 'Carlos Rodríguez', 
      age: 28, 
      evaluationDate: '2023-04-01', 
      status: 'pending'
    }
  ];

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <PatientList 
          patients={mockPatients} 
          {...props} 
        />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders patient list with correct data', () => {
    renderComponent();
    
    // Verifica que se muestren todos los pacientes
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Carlos Rodríguez')).toBeInTheDocument();
    
    // Verifica que se muestren las edades
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    
    // Verifica que se muestren las fechas
    expect(screen.getByText('2023-03-15')).toBeInTheDocument();
    expect(screen.getByText('2023-02-20')).toBeInTheDocument();
    expect(screen.getByText('2023-04-01')).toBeInTheDocument();
    
    // Verifica que se muestren los estados con el texto correcto
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  test('filters patients when searching', () => {
    renderComponent();
    
    // Obtener el campo de búsqueda
    const searchInput = screen.getByPlaceholderText('Buscar paciente');
    
    // Buscar por "María"
    fireEvent.change(searchInput, { target: { value: 'María' } });
    
    // Verificar que solo aparece María
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    expect(screen.queryByText('Carlos Rodríguez')).not.toBeInTheDocument();
    
    // Limpiar búsqueda
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Verificar que vuelven a aparecer todos
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Carlos Rodríguez')).toBeInTheDocument();
  });

  test('navigates to patient detail when clicking "Ver Detalle"', () => {
    renderComponent();
    
    // Hacer clic en "Ver Detalle" para el primer paciente
    const viewDetailButtons = screen.getAllByText('Ver Detalle');
    fireEvent.click(viewDetailButtons[0]);
    
    // Verificar que se llama a navigate con la ruta correcta
    expect(mockNavigate).toHaveBeenCalledWith('/pacientes/1');
  });

  test('displays loading state', () => {
    renderComponent({ isLoading: true });
    
    // Verificar que se muestra el indicador de carga
    const loadingIndicator = document.querySelector('.ant-spin');
    expect(loadingIndicator).toBeInTheDocument();
  });
});