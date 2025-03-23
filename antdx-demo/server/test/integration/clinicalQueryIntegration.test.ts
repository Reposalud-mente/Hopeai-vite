import { expect, describe, beforeAll, afterAll, it } from 'vitest';
import request from 'supertest';
import app from '../../server';
import { ClinicalQuery } from '../../models/clinicalQuery';
import { Patient } from '../../models/patient';
import { Model } from 'sequelize';
import { sequelize } from '../../config';

interface PatientInstance extends Model {
  id: string;
  name: string;
  email: string;
  birthDate: Date;
  gender: string;
  phone: string;
}

interface ClinicalQueryInstance extends Model {
  id: number;
  patientId: string;
  question: string;
  answer: string;
  responseJson: {
    mainAnswer: string;
    reasoning: string;
    confidenceScore: number;
    references: Array<{
      source: string;
      citation: string;
    }>;
  };
  confidenceScore: number;
  isFavorite: boolean;
  tags: string[];
}

describe('Integración de Consultas Clínicas', () => {
  // Crear datos de prueba
  let testPatient: PatientInstance;
  let testQuery: ClinicalQueryInstance;
  
  // Preparar la base de datos antes de las pruebas
  beforeAll(async () => {
    // Crear un paciente de prueba
    testPatient = await Patient.create({
      id: 'test-patient-1',
      name: 'Paciente de Prueba',
      email: 'test@example.com',
      birthDate: new Date('1990-01-01'),
      gender: 'Masculino',
      phone: '123456789'
    }) as PatientInstance;
    
    // Crear una consulta de prueba
    testQuery = await ClinicalQuery.create({
      patientId: testPatient.id,
      question: '¿Cuáles son los síntomas de ansiedad?',
      answer: 'Los síntomas de ansiedad incluyen preocupación excesiva, inquietud, fatiga, dificultad para concentrarse, irritabilidad, tensión muscular y problemas de sueño.',
      responseJson: {
        mainAnswer: 'Los síntomas de ansiedad incluyen preocupación excesiva...',
        reasoning: 'Según el DSM-5, el trastorno de ansiedad generalizada se caracteriza por...',
        confidenceScore: 0.9,
        references: [
          { source: 'DSM-5', citation: 'Criterios diagnósticos para Trastorno de Ansiedad Generalizada' }
        ]
      },
      confidenceScore: 0.9,
      isFavorite: false,
      tags: ['ansiedad', 'diagnóstico']
    }) as ClinicalQueryInstance;
  });
  
  // Limpiar después de las pruebas
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('GET /api/clinical/queries/patient/:patientId', () => {
    it('debe obtener todas las consultas para un paciente específico', async () => {
      const response = await request(app)
        .get(`/api/clinical/queries/patient/${testPatient.id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.queries).toBeInstanceOf(Array);
      expect(response.body.data.queries.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.queries[0].patientId).toBe(testPatient.id);
    });
    
    it('debe devolver un array vacío cuando el paciente no existe', async () => {
      const response = await request(app)
        .get('/api/clinical/queries/patient/non-existent-id')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.queries).toBeInstanceOf(Array);
      expect(response.body.data.queries.length).toBe(0);
    });
  });
  
  describe('GET /api/clinical/queries/:id', () => {
    it('debe obtener una consulta específica por ID', async () => {
      const response = await request(app)
        .get(`/api/clinical/queries/${testQuery.id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Object);
      expect(response.body.data.id).toBe(testQuery.id);
      expect(response.body.data.question).toBe(testQuery.question);
    });
    
    it('debe devolver 404 cuando la consulta no existe', async () => {
      const response = await request(app)
        .get('/api/clinical/queries/9999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Consulta clínica no encontrada');
    });
  });
  
  describe('POST /api/clinical/queries', () => {
    it('debe crear una nueva consulta clínica', async () => {
      const newQuery = {
        patientId: testPatient.id,
        question: '¿Cuáles son los tratamientos recomendados para la depresión?',
        tags: ['depresión', 'tratamiento']
      };
      
      const response = await request(app)
        .post('/api/clinical/queries')
        .send(newQuery)
        .timeout(20000) // Aumentar timeout para esta prueba específica
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Object);
      expect(response.body.data.question).toBe(newQuery.question);
      expect(response.body.data.patientId).toBe(newQuery.patientId);
      expect(response.body.message).toContain('procesamiento');
    });
    
    it('debe devolver 404 cuando el paciente no existe', async () => {
      const invalidQuery = {
        patientId: 'non-existent-patient',
        question: '¿Qué es el TDAH?'
      };
      
      const response = await request(app)
        .post('/api/clinical/queries')
        .send(invalidQuery)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Paciente no encontrado');
    });
  });
  
  describe('POST /api/clinical/queries/:id/process', () => {
    it('debe procesar una consulta existente', async () => {
      const response = await request(app)
        .post(`/api/clinical/queries/${testQuery.id}/process`)
        .timeout(20000) // Aumentar timeout para esta prueba específica
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Object);
      expect(response.body.data.id).toBe(testQuery.id);
    });
    
    it('debe devolver 404 cuando la consulta a procesar no existe', async () => {
      const response = await request(app)
        .post('/api/clinical/queries/9999/process')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Consulta clínica no encontrada');
    });
  });
});