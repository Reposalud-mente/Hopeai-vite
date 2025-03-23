import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configuración de testing-library
configure({
  testIdAttribute: 'data-testid',
});

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de antd
vi.mock('antd', () => ({
  Card: vi.fn(({ children }) => children),
  notification: {
    open: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  message: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));

// Mock del servicio de notificaciones
vi.mock('../utils/notificationService', () => ({
  default: {
    loadingToast: vi.fn().mockReturnValue('toast-id'),
    updateToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    notify: vi.fn(),
    toast: vi.fn()
  }
})); 