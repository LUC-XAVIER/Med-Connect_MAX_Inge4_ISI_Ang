import { Router } from 'express';
import prescriptionController from '../controllers/prescriptionController';
import { authenticate, isDoctor } from '../middleware/auth';
import {
  createPrescriptionValidation,
  updatePrescriptionStatusValidation,
  validate,
} from '../middleware/validation';

const router = Router();

// Create prescription (doctor only)
router.post(
  '/',
  authenticate,
  isDoctor,
  createPrescriptionValidation,
  validate,
  prescriptionController.createPrescription
);

// Get my prescriptions (patient or doctor)
router.get(
  '/',
  authenticate,
  prescriptionController.getMyPrescriptions
);

// Get single prescription
router.get(
  '/:prescriptionId',
  authenticate,
  prescriptionController.getPrescriptionById
);

// Update prescription status (doctor only)
router.put(
  '/:prescriptionId/status',
  authenticate,
  isDoctor,
  updatePrescriptionStatusValidation,
  validate,
  prescriptionController.updateStatus
);

export default router;