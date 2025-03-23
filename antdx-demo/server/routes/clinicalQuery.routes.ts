import { Router } from 'express';
import { ClinicalQueryController, provideFeedback } from '../controllers/ClinicalQueryController';

const router = Router();
const clinicalQueryController = new ClinicalQueryController();

// Rutas para consultas clínicas
router.get('/patient/:patientId', clinicalQueryController.getQueriesByPatient.bind(clinicalQueryController));
router.get('/:id', clinicalQueryController.getQueryById.bind(clinicalQueryController));
router.post('/', clinicalQueryController.createQuery.bind(clinicalQueryController));
router.put('/:id', clinicalQueryController.updateQuery.bind(clinicalQueryController));
router.delete('/:id', clinicalQueryController.deleteQuery.bind(clinicalQueryController));
router.patch('/:id/favorite', clinicalQueryController.toggleFavorite.bind(clinicalQueryController));
router.post('/:id/process', clinicalQueryController.processQuery.bind(clinicalQueryController));
router.post('/:queryId/feedback', provideFeedback);

export default router; 