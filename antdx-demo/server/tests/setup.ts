import { vi } from 'vitest';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Mock de servicios externos
vi.mock('../services/DeepSeekService', () => ({
  default: {
    generateResponse: vi.fn().mockResolvedValue({
      response: 'Respuesta de prueba',
      tokens: 100
    }),
    analyzeCase: vi.fn().mockResolvedValue({
      analysis: 'Análisis de prueba',
      recommendations: ['Recomendación 1', 'Recomendación 2']
    })
  }
}));

// Mock de modelos de base de datos
vi.mock('../models', () => ({
  Patient: {
    findByPk: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  },
  ClinicalQuery: {
    findByPk: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }
})); 