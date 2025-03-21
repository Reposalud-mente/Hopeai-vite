import { Request, Response } from 'express';
import { runClinicalAnalysis, answerClinicalQuestion, AnalysisState } from '../services/clinicalAnalysisGraph';

/**
 * Controlador para funciones de análisis clínico
 */

/**
 * Realiza un análisis clínico completo usando LangGraph
 * @param req Request - Debe contener patientData en el body
 * @param res Response
 */
export const analyzePatient = async (req: Request, res: Response) => {
  try {
    const { patientData } = req.body;
    
    if (!patientData) {
      return res.status(400).json({ 
        error: 'Datos del paciente no proporcionados', 
        success: false 
      });
    }

    console.log(`Analizando datos de paciente usando LangGraph (${patientData.length} caracteres)`);
    const result = await runClinicalAnalysis(patientData);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error al analizar paciente con LangGraph:', error);
    return res.status(500).json({
      error: `Error en el análisis clínico: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      success: false
    });
  }
};

/**
 * Responde a una pregunta específica sobre un análisis clínico
 * @param req Request - Debe contener question y analysisState en el body
 * @param res Response
 */
export const answerQuestion = async (req: Request, res: Response) => {
  try {
    const { question, analysisState } = req.body;
    
    if (!question) {
      return res.status(400).json({
        error: 'Pregunta no proporcionada',
        success: false
      });
    }
    
    if (!analysisState) {
      return res.status(400).json({
        error: 'Estado del análisis no proporcionado',
        success: false
      });
    }
    
    console.log(`Respondiendo pregunta clínica: "${question}"`);
    const answer = await answerClinicalQuestion(analysisState as AnalysisState, question);
    
    return res.status(200).json({
      success: true,
      data: { answer }
    });
  } catch (error) {
    console.error('Error al responder pregunta con LangGraph:', error);
    return res.status(500).json({
      error: `Error al responder pregunta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      success: false
    });
  }
};

/**
 * Endpoint de prueba para verificar el funcionamiento básico
 * @param req Request
 * @param res Response
 */
export const testAnalysis = (req: Request, res: Response) => {
  return res.status(200).json({
    message: 'API de análisis clínico funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}; 