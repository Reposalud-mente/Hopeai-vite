import express from 'express';
import cors from 'cors';
import { Patient, TestResult } from './models/patient.js';
import { testConnection, sequelize } from './config.js';

// Inicializar Express
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para verificar conexión
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: 'ok', 
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// === RUTAS PARA PACIENTES ===

// Obtener todos los pacientes
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(patients);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// Obtener un paciente por ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [{ model: TestResult, as: 'testResults' }]
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error(`Error al obtener paciente ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al obtener datos del paciente' });
  }
});

// Actualizar un paciente
app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    await patient.update(req.body);
    res.json(patient);
  } catch (error) {
    console.error(`Error al actualizar paciente ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al actualizar datos del paciente' });
  }
});

// Actualizar borrador de evaluación
app.put('/api/patients/:id/evaluation-draft', async (req, res) => {
  try {
    const { draft } = req.body;
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    await patient.update({ evaluationDraft: draft });
    res.json(patient);
  } catch (error) {
    console.error(`Error al actualizar borrador ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al guardar borrador de evaluación' });
  }
});

// Agregar un resultado de prueba
app.post('/api/patients/:id/test-results', async (req, res) => {
  try {
    const { name, score, interpretation } = req.body;
    const patientId = req.params.id;
    
    // Verificar que el paciente existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    // Crear el resultado de prueba
    const testResult = await TestResult.create({
      name,
      score,
      interpretation,
      patientId
    });
    
    res.status(201).json(testResult);
  } catch (error) {
    console.error(`Error al crear resultado de prueba:`, error);
    res.status(500).json({ error: 'Error al guardar resultado de prueba' });
  }
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