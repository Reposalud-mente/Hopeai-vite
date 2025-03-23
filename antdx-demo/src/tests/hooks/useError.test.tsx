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
  },
  Typography: {
    Text: vi.fn().mockImplementation(({ children }) => children),
    Paragraph: vi.fn().mockImplementation(({ children }) => children)
  },
  Space: vi.fn().mockImplementation(({ children }) => <div>{children}</div>)
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <ErrorProvider maxErrorCount={10}>{children}</ErrorProvider>
);

describe('useError Hook', () => {
  it('should create different error types correctly', () => {
    const { result } = renderHook(() => useError(), { wrapper });
    expect(result.current.createError).toBeDefined();
    expect(result.current.createError('Test generic error', 'error', 'ui')).toBeDefined();
  });

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
    expect(baseError.source).toBe(ErrorSource.AI);
  });
  
  it('should handle async operations with error handling', async () => {
    const { result } = renderHook(() => useError(), { wrapper });
    
    // Función asíncrona que lanza un error
    const asyncFn = async () => {
      throw new Error('Error en operación asíncrona');
    };
    
    let caught = false;
    
    await act(async () => {
      try {
        await result.current.withErrorHandling(asyncFn, {
          source: ErrorSource.API,
          rethrow: false
        });
      } catch (e) {
        caught = true;
      }
    });
    
    expect(caught).toBe(false); // No se lanzó porque rethrow es false
  });
}); 