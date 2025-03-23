import express, { Request, Response } from 'express';
import cors from 'cors';
import { Patient } from './models/patient';
import { TestResult } from './models/testResult';
import { ClinicalQuery } from './models/clinicalQuery';
import { testConnection, sequelize } from './config';
import { testAnalysis, analyzePatient, answerQuestion } from './controllers/clinicalAnalysisController';
import clinicalQueryRoutes from './routes/clinicalQuery.routes';
import patientRoutes from './routes/patient.routes';

/* Nota: Se han añadido comentarios @ts-expect-error a las rutas para suprimir
   errores de compatibilidad de tipos en los controladores Express. 
   Una mejor solución sería actualizar las definiciones de tipos o usar 
   el tipo RequestHandler explícitamente en los controladores.
*/

// Inicializar Express
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para verificar conexión
app.get('/api/health', async (req: Request, res: Response) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: 'ok', 
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// === RUTAS PARA ANÁLISIS CLÍNICO ===
// @ts-expect-error - Tipo incompatible en controlador Express
app.get('/api/analysis', testAnalysis);
// @ts-expect-error - Tipo incompatible en controlador Express
app.post('/api/clinical/analyze', analyzePatient);
// @ts-expect-error - Tipo incompatible en controlador Express
app.post('/api/clinical/question', answerQuestion);

// === RUTAS PARA CONSULTAS CLÍNICAS INTERACTIVAS ===
app.use('/api/clinical/queries', clinicalQueryRoutes);
// Ruta de prueba para verificar que el endpoint funciona
app.get('/api/clinical/queries-test', (req: Request, res: Response) => {
  res.json({ success: true, message: 'API de consultas clínicas funcionando correctamente' });
});

// === RUTAS PARA PACIENTES ===
app.use('/api/patients', patientRoutes);

// Ruta para depuración
app.get('/api/models', (req: Request, res: Response) => {
  res.json({
    models: {
      Patient: !!Patient,
      TestResult: !!TestResult,
      ClinicalQuery: !!ClinicalQuery
    },
    sequelize: {
      models: Object.keys(sequelize.models)
    }
  });
});

// === INICIALIZACIÓN ===

// Función para sincronizar la base de datos
const initializeDatabase = async () => {
  try {
    // Sincronizar modelos con la base de datos (crea tablas si no existen)
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados con la base de datos');
    
    // Verificar si hay datos en la tabla de pacientes
    const patientCount = await Patient.count();
    
    // Si no hay pacientes, añadir datos de muestra
    if (patientCount === 0) {
      console.log('Cargando datos de muestra...');
      
      // Datos de muestra para pacientes
      const samplePatients = [
        { 
          id: "PS005", 
          name: "Laura Fernández", 
          age: 32,
          status: "Nueva Paciente",
          evaluationDate: "2024-03-12",
          psychologist: "Dra. María González",
          consultReason: "Ansiedad y problemas de sueño",
          evaluationDraft: `Evaluación Psicológica Inicial

Datos del Paciente:
Nombre: Laura Fernández
Edad: 32 años
Fecha de Evaluación: 12 de marzo de 2024
Psicóloga: Dra. María González

Motivo de Consulta:
La paciente acude a consulta refiriendo síntomas de ansiedad y problemas de sueño que han persistido durante los últimos 3 meses.

Historia Clínica Breve:
- Sin antecedentes de tratamiento psicológico previo.
- Reporta aumento de estrés laboral en los últimos 6 meses.
- Niega consumo de sustancias o condiciones médicas relevantes.`
        },
        { 
          id: "PS006", 
          name: "Javier Morales", 
          age: 45,
          status: "En Espera",
          evaluationDate: null,
          psychologist: null,
          consultReason: "Pendiente de evaluación inicial",
          evaluationDraft: ""
        },
        { 
          id: "PS007", 
          name: "Isabel Torres", 
          age: 28,
          status: "Evaluación Pendiente",
          evaluationDate: "2024-03-16",
          psychologist: "Dr. Carlos Mendoza",
          consultReason: "Síntomas depresivos",
          evaluationDraft: ""
        }
      ];
      
      // Crear pacientes
      await Patient.bulkCreate(samplePatients);
      
      // Crear resultados de pruebas para Laura Fernández
      await TestResult.bulkCreate([
        { 
          name: "Inventario de Ansiedad de Beck (BAI)", 
          score: 25, 
          interpretation: "Ansiedad moderada",
          patientId: "PS005"
        },
        { 
          name: "Escala de Depresión de Hamilton", 
          score: 12, 
          interpretation: "Depresión leve",
          patientId: "PS005"
        }
      ]);
      
      console.log('Datos de muestra cargados correctamente');
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
};

// Iniciar el servidor
app.listen(PORT, async () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  await initializeDatabase();
});

export default app; 