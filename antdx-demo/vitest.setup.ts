import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { configure } from '@testing-library/react';

// Configuración de Testing Library
configure({ testIdAttribute: 'data-testid' });

// Mock de window.matchMedia para Ant Design
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

// Mock de ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de notificationService
vi.mock('../src/utils/notificationService', () => ({
  default: {
    loadingToast: vi.fn(),
    updateToast: vi.fn(),
    successToast: vi.fn(),
    errorToast: vi.fn(),
  },
}));

// Mock de antd
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Card: vi.fn(({ children }) => children),
    Button: vi.fn(({ children }) => children),
    Input: vi.fn(({ children }) => children),
    notification: {
      open: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
}); 