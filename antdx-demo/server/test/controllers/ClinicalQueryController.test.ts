import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import { ClinicalQueryController } from '../../controllers/ClinicalQueryController';
import { ClinicalQuery } from '../../models/clinicalQuery';
import { Patient } from '../../models/patient';
import { ClinicalQueryService } from '../../services/ClinicalQueryService';
import { Op } from 'sequelize';

describe('ClinicalQueryController', () => {
  let clinicalQueryController: ClinicalQueryController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusStub: sinon.SinonStub;
  let jsonStub: sinon.SinonStub;
  let clinicalQueryServiceStub: sinon.SinonStubbedInstance<ClinicalQueryService>;
  let findAndCountAllStub: sinon.SinonStub;
  let findByPkStub: sinon.SinonStub;
  let createStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Setup stubs for response
    statusStub = sinon.stub();
    jsonStub = sinon.stub();
    res = {
      status: statusStub,
      json: jsonStub
    };
    statusStub.returns(res);
    
    // Setup stubs for models
    findAndCountAllStub = sinon.stub(ClinicalQuery, 'findAndCountAll');
    findByPkStub = sinon.stub(ClinicalQuery, 'findByPk');
    createStub = sinon.stub(ClinicalQuery, 'create');
    
    // Setup stub for ClinicalQueryService
    clinicalQueryServiceStub = sinon.createStubInstance(ClinicalQueryService);
    
    // Create controller instance with stubbed service
    clinicalQueryController = new ClinicalQueryController();
    (clinicalQueryController as any).clinicalQueryService = clinicalQueryServiceStub;
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('getQueriesByPatient', () => {
    it('should return queries for a patient successfully', async () => {
      const mockQueries = [
        { id: 1, question: '¿Qué síntomas indican depresión?', patientId: '123' },
        { id: 2, question: '¿Cuál es el tratamiento recomendado para ansiedad?', patientId: '123' }
      ];
      
      req = {
        params: { patientId: '123' },
        query: { limit: '20', offset: '0' }
      };
      
      findAndCountAllStub.resolves({
        rows: mockQueries,
        count: 2
      });
      
      await clinicalQueryController.getQueriesByPatient(req as Request, res as Response);
      
      expect(statusStub.calledWith(200)).to.be.true;
      expect(jsonStub.calledWith({
        success: true,
        data: {
          queries: mockQueries,
          total: 2
        }
      })).to.be.true;
      expect(findAndCountAllStub.calledWith({
        where: { patientId: '123' },
        limit: 20,
        offset: 0,
        order: [['createdAt', 'DESC']],
      })).to.be.true;
    });
    
    it('should handle errors when fetching queries', async () => {
      req = {
        params: { patientId: '123' },
        query: {}
      };
      
      findAndCountAllStub.rejects(new Error('Database error'));
      
      await clinicalQueryController.getQueriesByPatient(req as Request, res as Response);
      
      expect(statusStub.calledWith(500)).to.be.true;
      expect(jsonStub.calledWith({
        success: false,
        error: 'Error al obtener las consultas clínicas'
      })).to.be.true;
    });
  });
  
  describe('getQueryById', () => {
    it('should return a specific query by id', async () => {
      const mockQuery = { 
        id: 1, 
        question: '¿Qué síntomas indican depresión?', 
        patientId: '123' 
      };
      
      req = {
        params: { id: '1' }
      };
      
      findByPkStub.resolves(mockQuery);
      
      await clinicalQueryController.getQueryById(req as Request, res as Response);
      
      expect(statusStub.calledWith(200)).to.be.true;
      expect(jsonStub.calledWith({
        success: true,
        data: mockQuery
      })).to.be.true;
    });
    
    it('should return 404 when query is not found', async () => {
      req = {
        params: { id: '999' }
      };
      
      findByPkStub.resolves(null);
      
      await clinicalQueryController.getQueryById(req as Request, res as Response);
      
      expect(statusStub.calledWith(404)).to.be.true;
      expect(jsonStub.calledWith({
        success: false,
        error: 'Consulta clínica no encontrada'
      })).to.be.true;
    });
  });
  
  describe('processQuery', () => {
    it('should process an existing query successfully', async () => {
      const mockQuery = { 
        id: 1, 
        question: '¿Qué síntomas indican depresión?', 
        patientId: '123' 
      };
      
      const processedQuery = {
        ...mockQuery,
        answer: 'Los síntomas de depresión incluyen...',
        confidenceScore: 0.85
      };
      
      req = {
        params: { id: '1' }
      };
      
      findByPkStub.resolves(mockQuery);
      clinicalQueryServiceStub.processQuery.resolves(processedQuery);
      
      await clinicalQueryController.processQuery(req as Request, res as Response);
      
      expect(clinicalQueryServiceStub.processQuery.calledWith(1)).to.be.true;
      expect(statusStub.calledWith(200)).to.be.true;
      expect(jsonStub.calledWith({
        success: true,
        data: processedQuery
      })).to.be.true;
    });
    
    it('should return 404 when query to process is not found', async () => {
      req = {
        params: { id: '999' }
      };
      
      findByPkStub.resolves(null);
      
      await clinicalQueryController.processQuery(req as Request, res as Response);
      
      expect(statusStub.calledWith(404)).to.be.true;
      expect(jsonStub.calledWith({
        success: false,
        error: 'Consulta clínica no encontrada'
      })).to.be.true;
      expect(clinicalQueryServiceStub.processQuery.called).to.be.false;
    });
  });
}); 