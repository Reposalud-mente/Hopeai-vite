import { expect, describe, beforeEach, it, vi, afterEach } from 'vitest';
import sinon from 'sinon';
import { ClinicalQueryService } from '../../services/ClinicalQueryService';
import { ClinicalQuery } from '../../models/clinicalQuery';
import { Patient } from '../../models/patient';
import * as contextBuilder from '../../ai/contextBuilder';
import { DeepSeekAdapter } from '../../services/DeepSeekAdapter';

interface MockQuery {
  id: number;
  question: string;
  patientId: string;
  update: sinon.SinonStub;
  getDataValue: (key: string) => string | number | undefined;
}

interface MockPatient {
  id: string;
  name?: string;
  age?: number;
  getDataValue: (key: string) => string | number | undefined;
}

interface MockValues {
  [key: string]: string | number | undefined;
}

describe('ClinicalQueryService', () => {
  let clinicalQueryService: ClinicalQueryService;
  let findByPkStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  let patientFindByPkStub: sinon.SinonStub;
  let buildEnrichedPatientContextStub: sinon.SinonStub;
  let generateStructuredResponseStub: sinon.SinonStub;
  let deepSeekAdapter: DeepSeekAdapter;
  
  beforeEach(() => {
    // Setup stubs
    findByPkStub = sinon.stub(ClinicalQuery, 'findByPk');
    updateStub = sinon.stub(ClinicalQuery.prototype, 'update');
    patientFindByPkStub = sinon.stub(Patient, 'findByPk');
    buildEnrichedPatientContextStub = sinon.stub(contextBuilder, 'buildEnrichedPatientContext');
    deepSeekAdapter = new DeepSeekAdapter();
    generateStructuredResponseStub = sinon.stub(deepSeekAdapter, 'generateStructuredResponse');
    
    // Create service instance with mocked DeepSeek adapter
    clinicalQueryService = new ClinicalQueryService();
    Object.assign(clinicalQueryService, { deepSeekAdapter });
  });
  
  afterEach(() => {
    sinon.restore();
    vi.clearAllMocks();
  });
  
  describe('processQuery', () => {
    it('should process a query successfully', async () => {
      // Mock data
      const mockQuery: MockQuery = {
        id: 1,
        question: '¿Qué síntomas indican depresión según los criterios del DSM-5?',
        patientId: '123',
        update: updateStub,
        getDataValue: (key: string) => {
          const values: MockValues = {
            patientId: '123',
            question: '¿Qué síntomas indican depresión según los criterios del DSM-5?'
          };
          return values[key];
        }
      };
      
      const mockPatient: MockPatient = {
        id: '123',
        name: 'Juan Pérez',
        age: 35,
        getDataValue: (key: string) => {
          const values: MockValues = {
            name: 'Juan Pérez',
            age: 35,
            consultReason: 'Problemas de sueño y estado de ánimo bajo'
          };
          return values[key];
        }
      };
      
      const mockContext = {
        demographics: {
          name: 'Juan Pérez',
          age: 35
        },
        clinicalInfo: {
          consultReason: 'Problemas de sueño y estado de ánimo bajo'
        }
      };
      
      const mockAIResponse = {
        mainAnswer: 'Según el DSM-5, los síntomas de depresión incluyen...',
        reasoning: 'El DSM-5 establece los siguientes criterios...',
        confidenceScore: 0.85,
        references: [
          { source: 'DSM-5', citation: 'Criterios diagnósticos para Trastorno Depresivo Mayor' }
        ],
        suggestedQuestions: ['¿Cuánto tiempo deben persistir los síntomas?'],
        diagnosticConsiderations: ['Trastorno Depresivo Mayor', 'Distimia'],
        treatmentSuggestions: ['Terapia cognitivo-conductual', 'Evaluación para medicación']
      };
      
      // Configure stubs
      findByPkStub.resolves(mockQuery);
      patientFindByPkStub.resolves(mockPatient);
      buildEnrichedPatientContextStub.resolves(mockContext);
      generateStructuredResponseStub.resolves(mockAIResponse);
      updateStub.resolves({ ...mockQuery, ...mockAIResponse });
      
      await clinicalQueryService.processQuery(1);
      
      // Verify interactions
      expect(findByPkStub.calledWith(1)).toBe(true);
      expect(patientFindByPkStub.calledWith('123')).toBe(true);
      expect(buildEnrichedPatientContextStub.called).toBe(true);
      expect(generateStructuredResponseStub.called).toBe(true);
      expect(updateStub.called).toBe(true);
      
      // Verify update was called with correct params
      const updateCallArg = updateStub.getCall(0).args[0];
      expect(updateCallArg).toHaveProperty('answer');
      expect(updateCallArg).toHaveProperty('responseJson');
      expect(updateCallArg).toHaveProperty('confidenceScore', 0.85);
    });

    it('should handle query not found', async () => {
      findByPkStub.resolves(null);
      
      await expect(clinicalQueryService.processQuery(999))
        .rejects
        .toThrow('Consulta con ID 999 no encontrada');
    });

    it('should handle AI processing errors with fallback response', async () => {
      const mockQuery: MockQuery = {
        id: 1,
        question: '¿Pregunta de prueba?',
        patientId: '123',
        update: updateStub,
        getDataValue: (key: string) => {
          const values: MockValues = {
            patientId: '123',
            question: '¿Pregunta de prueba?'
          };
          return values[key];
        }
      };

      const mockPatient: MockPatient = {
        id: '123',
        getDataValue: (key: string) => {
          const values: MockValues = {
            name: 'Test Patient',
            age: 30
          };
          return values[key];
        }
      };

      findByPkStub.resolves(mockQuery);
      patientFindByPkStub.resolves(mockPatient);
      generateStructuredResponseStub.rejects(new Error('AI processing error'));

      await clinicalQueryService.processQuery(1);

      expect(updateStub.called).toBe(true);
      const updateCallArg = updateStub.getCall(0).args[0];
      expect(updateCallArg.answer).toContain('No se pudo procesar la consulta');
    });
  });
}); 