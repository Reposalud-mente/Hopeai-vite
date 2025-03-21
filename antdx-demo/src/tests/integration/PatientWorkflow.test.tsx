import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { PatientProvider } from '../../context/PatientContext';
import PatientList from '../../components/PatientList';
import PatientForm from '../../components/PatientForm';
import { Patient } from '../../types/clinical-types';

// Mock de los servicios y APIs
jest.mock('../../api/patientApi', () => ({
  getPatients: jest.fn().mockResolvedValue([
    { 
      id: '1', 
      name: 'Juan Pérez', 
      age: 35, 
      evaluationDate: '2023-03-15', 
      status: 'active',
      gender: 'male',
      occupation: 'Ingeniero',
      contactInfo: {
        phone: '123456789',
        email: 'juan@example.com'
      }
    },
    { 
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
    }
  ]),
  getPatientById: jest.fn().mockImplementation((id) => {
    const patients = [
      { 
        id: '1', 
        name: 'Juan Pérez', 
        age: 35, 
        evaluationDate: '2023-03-15', 
        status: 'active',
        gender: 'male',
        occupation: 'Ingeniero',
        contactInfo: {
          phone: '123456789',
          email: 'juan@example.com'
        }
      },
      { 
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
      }
    ];
    return Promise.resolve(patients.find(p => p.id === id) || null);
  }),
  updatePatient: jest.fn().mockImplementation((patient) => Promise.resolve(patient)),
  createPatient: jest.fn().mockImplementation((patient) => Promise.resolve({
    ...patient,
    id: 'new-id'
  }))
}));

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

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
    jest.clearAllMocks();
    
    // Renderizar el formulario en modo de edición
    const { getByLabelText, getByRole } = render(
      <BrowserRouter>
        <PatientProvider>
          <PatientForm 
            patient={mockPatient} 
            mode="edit"
            onSave={jest.fn()}
            onCancel={jest.fn()}
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
      expect(require('../../api/patientApi').updatePatient).toHaveBeenCalledWith(
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
    const onSave = jest.fn();
    
    // Renderizar formulario de nuevo paciente
    const { getByLabelText, getByRole } = render(
      <BrowserRouter>
        <PatientProvider>
          <PatientForm 
            mode="create"
            onSave={onSave}
            onCancel={jest.fn()}
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
      expect(require('../../api/patientApi').createPatient).toHaveBeenCalledWith(
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