import { describe, it, expect, vi, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { PatientProvider } from '../../context/PatientContext';
import PatientList from '../../components/PatientList';
import PatientForm from '../../components/PatientForm';
import { Patient } from '../../types/clinical-types';
import { updatePatient, createPatient } from '../../api/patientApi';

// Mock de los servicios y APIs
vi.mock('../../api/patientApi', () => ({
  getPatients: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Juan Pérez',
      birthDate: '1980-05-15',
      gender: 'M',
      contactInfo: { phone: '555-1234', email: 'juan@example.com' },
      lastVisit: '2023-06-10'
    },
    {
      id: '2',
      name: 'María López',
      birthDate: '1992-11-23',
      gender: 'F',
      contactInfo: { phone: '555-5678', email: 'maria@example.com' },
      lastVisit: '2023-07-05'
    }
  ]),
  getPatientById: vi.fn().mockImplementation((id) => {
    if (id === '1') {
      return Promise.resolve({
        id: '1',
        name: 'Juan Pérez',
        birthDate: '1980-05-15',
        gender: 'M',
        contactInfo: { phone: '555-1234', email: 'juan@example.com' },
        medicalHistory: 'Hipertensión, diabetes tipo 2',
        currentMedication: 'Metformina, Lisinopril',
        notes: 'Paciente con buen cumplimiento del tratamiento',
        lastVisit: '2023-06-10',
        nextAppointment: '2023-09-15'
      });
    }
    return Promise.reject(new Error('Patient not found'));
  })
}));

vi.mock('../../api/clinicalApi', () => ({
  getClinicalTests: vi.fn().mockResolvedValue([
    { id: 'test1', name: 'Test de Beck', date: '2023-05-05', score: 15, category: 'Depresión' },
    { id: 'test2', name: 'STAI', date: '2023-05-05', score: 45, category: 'Ansiedad' }
  ]),
  getClinicalNotes: vi.fn().mockResolvedValue([
    { id: 'note1', date: '2023-06-10', content: 'El paciente reporta mejoría en su estado de ánimo.' },
    { id: 'note2', date: '2023-05-01', content: 'Inicio de terapia cognitivo-conductual.' }
  ])
}));

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Patient Workflow Integration Tests', () => {
  // Prueba del flujo completo de pacientes
  test('complete patient workflow: listing, viewing, and editing', async () => {
    // Renderizar el componente PatientList
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <BrowserRouter>
        <PatientProvider>
          <PatientList patients={[
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
            }
          ]} />
        </PatientProvider>
      </BrowserRouter>
    );
    
    // Verificar que se muestran todos los pacientes
    expect(getByText('Juan Pérez')).toBeInTheDocument();
    expect(getByText('María González')).toBeInTheDocument();
    
    // Buscar un paciente específico
    fireEvent.change(getByPlaceholderText('Buscar paciente'), { target: { value: 'María' } });
    expect(getByText('María González')).toBeInTheDocument();
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    
    // Hacer clic en "Ver Detalle" para el paciente filtrado
    const viewDetailButtons = getAllByText('Ver Detalle');
    fireEvent.click(viewDetailButtons[0]);
    
    // Verificar que se navega a la página de detalle
    expect(mockNavigate).toHaveBeenCalledWith('/pacientes/2');
    
    // Simular la renderización de la página de detalle de paciente
    const mockPatient: Patient = { 
      id: '2', 
      name: 'María González', 
      age: 42, 
      evaluationDate: '2023-02-20', 
      status: 'completed',
      gender: 'female',
      occupation: 'Médico',
      contactInfo: {
        phone: '987654321',
        email: 'maria@example.com'
      }
    };
    
    // Limpiamos para la siguiente parte del test
    vi.clearAllMocks();
    
    // Renderizar el formulario en modo de edición
    const { getByLabelText, getByRole } = render(
      <BrowserRouter>
        <PatientProvider>
          <PatientForm 
            patient={mockPatient} 
            mode="edit"
            onSave={vi.fn()}
            onCancel={vi.fn()}
          />
        </PatientProvider>
      </BrowserRouter>
    );
    
    // Modificar algunos campos
    fireEvent.change(getByLabelText('Nombre'), { target: { value: 'María Luisa González' } });
    fireEvent.change(getByLabelText('Edad'), { target: { value: 43 } });
    
    // Guardar cambios
    fireEvent.click(getByRole('button', { name: /guardar/i }));
    
    // Verificar que se llama a la función de actualización
    await waitFor(() => {
      expect(updatePatient).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '2',
          name: 'María Luisa González',
          age: 43
        })
      );
    });
  });

  // Flujo para crear un nuevo paciente
  test('new patient creation flow', async () => {
    const onSave = vi.fn();
    
    // Renderizar formulario de nuevo paciente
    const { getByLabelText, getByRole } = render(
      <BrowserRouter>
        <PatientProvider>
          <PatientForm 
            mode="create"
            onSave={onSave}
            onCancel={vi.fn()}
          />
        </PatientProvider>
      </BrowserRouter>
    );
    
    // Rellenar formulario
    fireEvent.change(getByLabelText('Nombre'), { target: { value: 'Carlos Rodríguez' } });
    fireEvent.change(getByLabelText('Edad'), { target: { value: 28 } });
    // Otros campos según el formulario...
    
    // Guardar nuevo paciente
    fireEvent.click(getByRole('button', { name: /guardar/i }));
    
    // Verificar que se llama a la API para crear el paciente
    await waitFor(() => {
      expect(createPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Carlos Rodríguez',
          age: 28
        })
      );
    });
    
    // Verificar callback
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});