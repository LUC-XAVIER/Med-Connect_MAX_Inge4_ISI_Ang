import { Router } from 'express';
import patientController from '../controllers/patientController';
import { authenticate, isPatient, isAdmin } from '../middleware/auth';
import { updatePatientProfileValidation, validate } from '../middleware/validation';

const router = Router();

// Patient routes (require authentication + patient role)
router.get('/profile', authenticate, isPatient, patientController.getProfile);
router.put(
  '/profile',
  authenticate,
  isPatient,
  updatePatientProfileValidation,
  validate,
  patientController.updateProfile
);
router.delete('/profile', authenticate, isPatient, patientController.deleteProfile);

// Admin routes
router.get('/', authenticate, isAdmin, patientController.getAllPatients);

export default router;