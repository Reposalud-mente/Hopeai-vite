import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useLoadingState from '../../hooks/useLoadingState';
import notificationService from '../../utils/notificationService';

// Mock del servicio de notificaciones
vi.mock('../../utils/notificationService', () => ({
  default: {
    loadingToast: vi.fn().mockReturnValue('toast-id'),
    updateToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('useLoadingState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state is idle', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.state).toBe('idle');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('startLoading sets state to loading', async () => {
    const { result } = renderHook(() => useLoadingState());
    
    await act(async () => {
      result.current.startLoading();
    });

    expect(result.current.state).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    expect(notificationService.loadingToast).toHaveBeenCalled();
  });

  it('setSuccess changes state to success', async () => {
    const { result } = renderHook(() => useLoadingState());
    
    await act(async () => {
      result.current.startLoading();
      result.current.setSuccess();
    });

    expect(result.current.state).toBe('success');
    expect(result.current.isSuccess).toBe(true);
  });

  it('setError changes state to error', async () => {
    const { result } = renderHook(() => useLoadingState());
    const testError = new Error('Test error');
    
    await act(async () => {
      result.current.startLoading();
      result.current.setError(testError);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe(testError);
    expect(result.current.isError).toBe(true);
  });

  it('handles async operations with runWithLoading', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockAsyncFn = vi.fn().mockResolvedValue('success');

    await act(async () => {
      await result.current.runWithLoading(mockAsyncFn);
    });

    expect(mockAsyncFn).toHaveBeenCalled();
    expect(result.current.state).toBe('success');
    expect(notificationService.loadingToast).toHaveBeenCalled();
    expect(notificationService.updateToast).toHaveBeenCalled();
  });

  it('handles errors in async operations', async () => {
    const { result } = renderHook(() => useLoadingState());
    const testError = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(testError);

    await act(async () => {
      try {
        await result.current.runWithLoading(mockAsyncFn);
      } catch (error) {
        // Error esperado
      }
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe(testError);
    expect(notificationService.loadingToast).toHaveBeenCalled();
    expect(notificationService.updateToast).toHaveBeenCalled();
  });
});