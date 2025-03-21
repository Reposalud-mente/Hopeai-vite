import { renderHook, act } from '@testing-library/react-hooks';
import useLoadingState from '../../hooks/useLoadingState';
import notificationService from '../../utils/notificationService';

// Mock del servicio de notificaciones
jest.mock('../../utils/notificationService', () => ({
  loadingToast: jest.fn(),
  updateToast: jest.fn(),
  success: jest.fn(),
  error: jest.fn()
}));

describe('useLoadingState Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial state is idle', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.state).toBe('idle');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('startLoading changes state to loading and shows notification', () => {
    const { result } = renderHook(() => useLoadingState({
      operation: 'fetch',
      entity: 'patient'
    }));
    
    act(() => {
      result.current.startLoading();
    });
    
    expect(result.current.state).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    expect(notificationService.loadingToast).toHaveBeenCalledWith(
      'Cargando paciente...',
      'fetch-patient'
    );
  });

  test('setSuccess changes state to success and shows success notification', () => {
    const { result } = renderHook(() => useLoadingState({
      operation: 'create',
      entity: 'patient'
    }));
    
    act(() => {
      result.current.startLoading();
      result.current.setSuccess();
    });
    
    expect(result.current.state).toBe('success');
    expect(result.current.isSuccess).toBe(true);
    expect(notificationService.updateToast).toHaveBeenCalledWith(
      'success',
      'paciente creado con éxito',
      'create-patient',
      2
    );
  });

  test('setFailed changes state to error and shows error notification', () => {
    const { result } = renderHook(() => useLoadingState({
      operation: 'update',
      entity: 'patient'
    }));
    
    const testError = new Error('Test error message');
    
    act(() => {
      result.current.startLoading();
      result.current.setFailed(testError);
    });
    
    expect(result.current.state).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(testError);
    expect(notificationService.updateToast).toHaveBeenCalledWith(
      'error',
      'Error al actualizar paciente',
      'update-patient',
      3
    );
  });

  test('runWithLoading manages the complete async flow with success', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLoadingState({
      operation: 'process',
      entity: 'analysis'
    }));
    
    const mockSuccessFn = jest.fn().mockResolvedValue('success result');
    
    let asyncResult;
    act(() => {
      asyncResult = result.current.runWithLoading(mockSuccessFn);
    });
    
    // Verificar que el estado se actualizó inmediatamente a loading
    expect(result.current.isLoading).toBe(true);
    
    // Esperar a que la promesa se resuelva
    await waitForNextUpdate();
    
    // Verificar que el estado es success después de la resolución
    expect(result.current.isSuccess).toBe(true);
    
    // Verificar que la función se llamó y devolvió el resultado esperado
    expect(mockSuccessFn).toHaveBeenCalledTimes(1);
    expect(await asyncResult).toBe('success result');
  });

  test('runWithLoading manages the complete async flow with error', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLoadingState({
      operation: 'delete',
      entity: 'evaluation'
    }));
    
    const testError = new Error('Delete operation failed');
    const mockErrorFn = jest.fn().mockRejectedValue(testError);
    
    let rejectedPromise;
    act(() => {
      rejectedPromise = result.current.runWithLoading(mockErrorFn);
    });
    
    // Verificar que el estado se actualizó inmediatamente a loading
    expect(result.current.isLoading).toBe(true);
    
    // Esperar a que la promesa se rechace
    await waitForNextUpdate();
    
    // Verificar que el estado es error después del rechazo
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(testError);
    
    // Verificar que la función se llamó y la promesa fue rechazada
    expect(mockErrorFn).toHaveBeenCalledTimes(1);
    await expect(rejectedPromise).rejects.toThrow('Delete operation failed');
  });

  test('reset returns state to idle', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.startLoading();
    });
    
    expect(result.current.isLoading).toBe(true);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.state).toBe('idle');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('custom messages are used when provided', () => {
    const { result } = renderHook(() => useLoadingState({
      operation: 'fetch',
      entity: 'patient',
      messageLoading: 'Cargando datos de paciente...',
      messageSuccess: 'Datos de paciente cargados correctamente',
      messageError: 'No se pudieron cargar los datos del paciente'
    }));
    
    act(() => {
      result.current.startLoading();
    });
    
    expect(notificationService.loadingToast).toHaveBeenCalledWith(
      'Cargando datos de paciente...',
      'fetch-patient'
    );
    
    act(() => {
      result.current.setSuccess();
    });
    
    expect(notificationService.updateToast).toHaveBeenCalledWith(
      'success',
      'Datos de paciente cargados correctamente',
      'fetch-patient',
      2
    );
  });
});