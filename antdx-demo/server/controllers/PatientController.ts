import { Request, Response } from 'express';
import { Patient } from '../models/patient';
import { TestResult } from '../models/testResult';
import { sequelize } from '../config';

/**
 * Controlador para gestionar los pacientes y sus datos
 */
export class PatientController {

  /**
   * Obtiene todos los pacientes
   */
  async getAllPatients(req: Request, res: Response): Promise<void> {
    try {
      const patients = await Patient.findAll({
        order: [['createdAt', 'DESC']]
      });
      res.json(patients);
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      res.status(500).json({ error: 'Error al obtener pacientes' });
    }
  }

  /**
   * Obtiene un paciente por ID
   */
  async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const patient = await Patient.findByPk(req.params.id, {
        include: [{ model: TestResult, as: 'testResults' }]
      });
      
      if (!patient) {
        res.status(404).json({ error: 'Paciente no encontrado' });
        return;
      }
      
      res.json(patient);
    } catch (error) {
      console.error(`Error al obtener paciente ${req.params.id}:`, error);
      res.status(500).json({ error: 'Error al obtener datos del paciente' });
    }
  }

  /**
   * Actualiza un paciente
   */
  async updatePatient(req: Request, res: Response): Promise<void> {
    try {
      const patient = await Patient.findByPk(req.params.id);
      
      if (!patient) {
        res.status(404).json({ error: 'Paciente no encontrado' });
        return;
      }
      
      await patient.update(req.body);
      res.json(patient);
    } catch (error) {
      console.error(`Error al actualizar paciente ${req.params.id}:`, error);
      res.status(500).json({ error: 'Error al actualizar datos del paciente' });
    }
  }

  /**
   * Actualiza el borrador de evaluación de un paciente
   */
  async updateEvaluationDraft(req: Request, res: Response): Promise<void> {
    try {
      const { draft } = req.body;
      const patient = await Patient.findByPk(req.params.id);
      
      if (!patient) {
        res.status(404).json({ error: 'Paciente no encontrado' });
        return;
      }
      
      await patient.update({ evaluationDraft: draft });
      res.json(patient);
    } catch (error) {
      console.error(`Error al actualizar borrador ${req.params.id}:`, error);
      res.status(500).json({ error: 'Error al guardar borrador de evaluación' });
    }
  }

  /**
   * Agrega un resultado de prueba a un paciente
   */
  async addTestResult(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { name, score, interpretation } = req.body;
      const patientId = req.params.id;
      
      // Verificar que el paciente existe
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        await transaction.rollback();
        res.status(404).json({ error: 'Paciente no encontrado' });
        return;
      }
      
      // Crear el resultado de prueba
      const testResult = await TestResult.create({
        name,
        score,
        interpretation,
        patientId
      }, { transaction });
      
      await transaction.commit();
      
      res.status(201).json(testResult);
    } catch (error) {
      await transaction.rollback();
      console.error(`Error al crear resultado de prueba:`, error);
      res.status(500).json({ error: 'Error al guardar resultado de prueba' });
    }
  }
} 