import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ErrorProvider } from '../../context/ErrorContext';

// Componente que lanza un error intencionalmente
const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Error intencional para pruebas');
  }
  return <div>Componente sin errores</div>;
};

// Silenciar errors de consola para pruebas
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorProvider>
        <ErrorBoundary>
          <div data-testid="test-child">Contenido normal</div>
        </ErrorBoundary>
      </ErrorProvider>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });
  
  it('should render error UI when a child component throws', () => {
    // Suprimir errores de consola durante la prueba
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorProvider>
        <ErrorBoundary componentName="ComponentePrueba">
          <ErrorThrowingComponent />
        </ErrorBoundary>
      </ErrorProvider>
    );
    
    // Verificar que muestra la UI de error
    expect(screen.getByText('Ha ocurrido un error en la aplicación')).toBeInTheDocument();
    expect(screen.getByText(/Error intencional para pruebas/i)).toBeInTheDocument();
    
    // Limpiar
    spy.mockRestore();
  });
  
  it('should render custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Fallback personalizado</div>;
    
    // Suprimir errores de consola durante la prueba
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorProvider>
        <ErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      </ErrorProvider>
    );
    
    // Verificar que muestra el fallback personalizado
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Fallback personalizado')).toBeInTheDocument();
    
    // Limpiar
    spy.mockRestore();
  });
}); 