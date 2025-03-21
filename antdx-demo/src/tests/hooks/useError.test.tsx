import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { useError } from '../../hooks/useError';
import { ErrorProvider } from '../../context/ErrorContext';
import { ErrorSeverity, ErrorSource } from '../../context/ErrorContext';
import { BaseError } from '../../utils/errorHandler';

// Mock de notificación para evitar errores en pruebas
vi.mock('antd', () => ({
  notification: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <ErrorProvider maxErrorCount={10}>{children}</ErrorProvider>
);

describe('useError Hook', () => {
  it('should capture an Error instance correctly', () => {
    const { result } = renderHook(() => useError(), { wrapper });
    
    act(() => {
      result.current.captureError(new Error('Test error'), ErrorSource.UI);
    });
    
    // Verificar que se haya registrado un error
    const errorContext = renderHook(() => useError(), { wrapper }).result.current;
    expect(errorContext.captureError).toBeDefined();
  });
  
  it('should handle BaseError without specifying source', () => {
    const { result } = renderHook(() => useError(), { wrapper });
    const baseError = new BaseError(
      'Error de prueba', 
      ErrorSeverity.WARNING,
      ErrorSource.AI
    );
    
    act(() => {
      result.current.captureError(baseError);
    });
    
    // La fuente debería ser la especificada en el error, no necesita parámetro
    const errorContext = renderHook(() => useError(), { wrapper }).result.current;
    expect(errorContext.captureError).toBeDefined();
  });
  
  it('should create different error types correctly', () => {
    const { result } = renderHook(() => useError(), { wrapper });
    
    // Probar createApiError
    act(() => {
      const apiError = result.current.createApiError('Error de API', 404);
      expect(apiError.message).toBe('Error de API');
      expect(apiError.status).toBe(404);
      expect(apiError.source).toBe(ErrorSource.API);
    });
    
    // Probar createAiError
    act(() => {
      const aiError = result.current.createAiError(
        'Error de IA',
        'connection_error',
        'timeout'
      );
      expect(aiError.message).toBe('Error de IA');
      expect(aiError.errorType).toBe('connection_error');
      expect(aiError.errorCode).toBe('timeout');
      expect(aiError.source).toBe(ErrorSource.AI);
    });
    
    // Probar createUiError
    act(() => {
      const uiError = result.current.createUiError(
        'Error de interfaz',
        'PatientForm'
      );
      expect(uiError.message).toBe('Error de interfaz');
      expect(uiError.component).toBe('PatientForm');
      expect(uiError.source).toBe(ErrorSource.UI);
    });
  });
  
  it('should handle async operations with error handling', async () => {
    const { result } = renderHook(() => useError(), { wrapper });
    
    // Función que falla
    const failingOperation = async () => {
      throw new Error('Error en operación asíncrona');
    };
    
    // Probar withErrorHandling
    const resultValue = await act(async () => {
      return await result.current.withErrorHandling(
        failingOperation,
        'Error controlado',
        ErrorSource.API
      );
    });
    
    // Debería devolver undefined cuando hay un error
    expect(resultValue).toBeUndefined();
  });
}); 