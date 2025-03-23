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
      const where: Record<string, unknown> = { patientId };
      
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
      
      // Procesar la consulta con IA de manera asíncrona (puede implementarse un worker aquí)
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
      const updatedFields: Record<string, unknown> = {};
      
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
   * Cambia el estado de favorito de una consulta
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
      
      // Obtener estado actual y cambiarlo
      const currentStatus = query.getDataValue('isFavorite') as boolean;
      await query.update({ isFavorite: !currentStatus });
      
      res.status(200).json({
        success: true,
        data: await ClinicalQuery.findByPk(id)
      });
    } catch (error) {
      console.error('Error al cambiar estado de favorito:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cambiar estado de favorito'
      });
    }
  }
  
  /**
   * Método auxiliar para procesar una consulta de forma asíncrona
   * Esto debería ser reemplazado por un sistema de colas en producción
   */
  private async processQueryAsync(queryId: number): Promise<void> {
    try {
      // Obtener la consulta
      const query = await ClinicalQuery.findByPk(queryId);
      if (!query) {
        console.error(`No se pudo encontrar la consulta ${queryId} para procesamiento asíncrono`);
        return;
      }
      
      // Actualizar con mensaje de procesamiento
      await query.update({
        answer: 'Procesando consulta clínica...',
        responseJson: {
          mainAnswer: 'Procesando consulta clínica...',
          reasoning: '',
          confidenceScore: 0,
          references: []
        }
      });
      
      // Procesar consulta (idealmente esto sería manejado por un worker)
      setTimeout(async () => {
        try {
          await this.clinicalQueryService.processQuery(queryId);
        } catch (error) {
          console.error(`Error en procesamiento asíncrono de consulta ${queryId}:`, error);
          
          // Actualizar con mensaje de error
          await query.update({
            answer: 'Error al procesar la consulta. Por favor, inténtelo de nuevo.',
            responseJson: {
              mainAnswer: 'Error al procesar la consulta',
              reasoning: 'Se produjo un error durante el procesamiento',
              confidenceScore: 0,
              references: []
            },
            confidenceScore: 0
          });
        }
      }, 500); // Pequeño retraso para simular procesamiento asíncrono
    } catch (error) {
      console.error(`Error al iniciar procesamiento asíncrono para consulta ${queryId}:`, error);
    }
  }
}

/**
 * Registra la retroalimentación del usuario sobre una respuesta clínica
 * @param req Solicitud con el ID de la consulta y datos de retroalimentación
 * @param res Respuesta del servidor
 */
export const provideFeedback = async (req: Request, res: Response) => {
  const { queryId } = req.params;
  const { rating, feedback, helpful, accurate, detailed } = req.body;
  
  if (!queryId) {
    return res.status(400).json({ 
      error: 'ID de consulta requerido'
    });
  }
  
  try {
    // Obtener la consulta existente
    const query = await ClinicalQuery.findByPk(parseInt(queryId));
    
    if (!query) {
      return res.status(404).json({ 
        error: 'Consulta no encontrada'
      });
    }
    
    // Actualizar con la retroalimentación
    await query.update({
      feedbackRating: rating,
      feedbackComment: feedback,
      feedbackTags: [
        ...(helpful ? ['útil'] : []),
        ...(accurate ? ['precisa'] : []),
        ...(detailed ? ['detallada'] : [])
      ],
      hasFeedback: true
    });
    
    return res.status(200).json({
      success: true,
      message: 'Retroalimentación registrada correctamente',
      query
    });
  } catch (error) {
    console.error('Error al registrar retroalimentación:', error);
    return res.status(500).json({
      error: 'Error al registrar retroalimentación',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 