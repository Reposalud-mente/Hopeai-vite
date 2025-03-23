import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';

const router = Router();
const patientController = new PatientController();

// Rutas para pacientes
router.get('/', patientController.getAllPatients.bind(patientController));
router.get('/:id', patientController.getPatientById.bind(patientController));
router.put('/:id', patientController.updatePatient.bind(patientController));
router.put('/:id/evaluation-draft', patientController.updateEvaluationDraft.bind(patientController));
router.post('/:id/test-results', patientController.addTestResult.bind(patientController));

export default router; 