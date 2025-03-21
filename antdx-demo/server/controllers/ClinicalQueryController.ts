import { Request, Response } from 'express';
import { ClinicalQuery } from '../models/clinicalQuery';
import { Patient } from '../models/patient';
import { sequelize } from '../config';
import { Op } from 'sequelize';
import { ClinicalQueryService } from '../services/ClinicalQueryService';

/**
 * Controlador para gestionar las consultas clínicas interactivas
 */
export class ClinicalQueryController {
  private clinicalQueryService: ClinicalQueryService;
  
  constructor() {
    this.clinicalQueryService = new ClinicalQueryService();
  }
  
  /**
   * Obtiene todas las consultas clínicas de un paciente
   */
  async getQueriesByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { limit = 20, offset = 0, tag, favorite } = req.query;
      
      // Construir condiciones de búsqueda
      const where: Record<string, any> = { patientId };
      
      if (tag) {
        where.tags = { [Op.contains]: [tag] };
      }
      
      if (favorite === 'true') {
        where.isFavorite = true;
      }
      
      // Obtener consultas
      const result = await ClinicalQuery.findAndCountAll({
        where,
        limit: Number(limit),
        offset: Number(offset),
        order: [['createdAt', 'DESC']],
      });
      
      res.status(200).json({
        success: true,
        data: {
          queries: result.rows,
          total: result.count
        }
      });
    } catch (error) {
      console.error('Error al obtener consultas clínicas:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener las consultas clínicas'
      });
    }
  }
  
  /**
   * Obtiene una consulta clínica específica por ID
   */
  async getQueryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const query = await ClinicalQuery.findByPk(id);
      
      if (!query) {
        res.status(404).json({
          success: false,
          error: 'Consulta clínica no encontrada'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: query
      });
    } catch (error) {
      console.error('Error al obtener consulta clínica:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener la consulta clínica'
      });
    }
  }
  
  /**
   * Crea una nueva consulta clínica y procesa la respuesta
   */
  async createQuery(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { patientId, question, tags } = req.body;
      
      // Verificar si el paciente existe
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        await transaction.rollback();
        res.status(404).json({
          success: false,
          error: 'Paciente no encontrado'
        });
        return;
      }
      
      // Crear consulta inicial (sin respuesta aún)
      const query = await ClinicalQuery.create({
        patientId,
        question,
        tags: tags || [],
        isFavorite: false,
        createdBy: req.body.createdBy || 'system'
      }, { transaction });
      
      await transaction.commit();
      
      // Procesar la consulta con IA de manera asíncrona
      this.processQueryAsync(query.getDataValue('id'));
      
      res.status(201).json({
        success: true,
        data: query,
        message: 'Consulta creada y en procesamiento'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error al crear consulta clínica:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear la consulta clínica'
      });
    }
  }
  
  /**
   * Procesa una consulta existente para obtener/actualizar respuesta
   */
  async processQuery(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar si la consulta existe
      const query = await ClinicalQuery.findByPk(id);
      if (!query) {
        res.status(404).json({
          success: false,
          error: 'Consulta clínica no encontrada'
        });
        return;
      }
      
      // Procesar la consulta
      const processedQuery = await this.clinicalQueryService.processQuery(Number(id));
      
      if (!processedQuery) {
        res.status(500).json({
          success: false,
          error: 'Error al procesar la consulta clínica'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: processedQuery
      });
    } catch (error) {
      console.error('Error al procesar consulta clínica:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar la consulta clínica'
      });
    }
  }
  
  /**
   * Actualiza una consulta clínica existente
   */
  async updateQuery(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { answer, responseJson, confidenceScore, references, isFavorite, tags } = req.body;
      
      // Verificar si la consulta existe
      const query = await ClinicalQuery.findByPk(id);
      if (!query) {
        await transaction.rollback();
        res.status(404).json({
          success: false,
          error: 'Consulta clínica no encontrada'
        });
        return;
      }
      
      // Actualizar consulta
      const updatedFields: Record<string, any> = {};
      
      if (answer !== undefined) updatedFields.answer = answer;
      if (responseJson !== undefined) updatedFields.responseJson = responseJson;
      if (confidenceScore !== undefined) updatedFields.confidenceScore = confidenceScore;
      if (references !== undefined) updatedFields.references = references;
      if (isFavorite !== undefined) updatedFields.isFavorite = isFavorite;
      if (tags !== undefined) updatedFields.tags = tags;
      
      await query.update(updatedFields, { transaction });
      
      await transaction.commit();
      
      res.status(200).json({
        success: true,
        data: await ClinicalQuery.findByPk(id)
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error al actualizar consulta clínica:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la consulta clínica'
      });
    }
  }
  
  /**
   * Elimina una consulta clínica
   */
  async deleteQuery(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      // Verificar si la consulta existe
      const query = await ClinicalQuery.findByPk(id);
      if (!query) {
        await transaction.rollback();
        res.status(404).json({
          success: false,
          error: 'Consulta clínica no encontrada'
        });
        return;
      }
      
      // Eliminar consulta
      await query.destroy({ transaction });
      
      await transaction.commit();
      
      res.status(200).json({
        success: true,
        message: 'Consulta clínica eliminada correctamente'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error al eliminar consulta clínica:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar la consulta clínica'
      });
    }
  }
  
  /**
   * Marca/desmarca una consulta como favorita
   */
  async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar si la consulta existe
      const query = await ClinicalQuery.findByPk(id);
      if (!query) {
        res.status(404).json({
          success: false,
          error: 'Consulta clínica no encontrada'
        });
        return;
      }
      
      // Cambiar estado de favorito
      await query.update({ isFavorite: !query.getDataValue('isFavorite') });
      
      res.status(200).json({
        success: true,
        data: await ClinicalQuery.findByPk(id)
      });
    } catch (error) {
      console.error('Error al actualizar estado de favorito:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar estado de favorito'
      });
    }
  }
  
  /**
   * Procesa una consulta de forma asíncrona
   */
  private async processQueryAsync(queryId: number): Promise<void> {
    try {
      await this.clinicalQueryService.processQuery(queryId);
    } catch (error) {
      console.error(`Error al procesar consulta ${queryId} de forma asíncrona:`, error);
    }
  }
} 