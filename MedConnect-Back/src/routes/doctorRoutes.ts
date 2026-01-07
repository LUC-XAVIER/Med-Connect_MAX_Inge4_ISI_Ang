import { Router } from 'express';
import doctorController from '../controllers/doctorController';
import { authenticate, isDoctor, isAdmin } from '../middleware/auth';
import { updateDoctorProfileValidation, validate } from '../middleware/validation';

const router = Router();

// Public routes (patients can search doctors)
router.get('/search', authenticate, doctorController.searchDoctors);
router.get('/', authenticate, doctorController.getAllDoctors);

// Doctor routes (require authentication + doctor role)
router.get('/profile', authenticate, isDoctor, doctorController.getProfile);
router.put(
  '/profile',
  authenticate,
  isDoctor,
  updateDoctorProfileValidation,
  validate,
  doctorController.updateProfile
);
router.delete('/profile', authenticate, isDoctor, doctorController.deleteProfile);

// Admin routes
router.put('/:doctorId/verify', authenticate, isAdmin, doctorController.verifyDoctor);
router.put('/:doctorId/reject', authenticate, isAdmin, doctorController.rejectDoctor);
router.get('/admin/stats', authenticate, isAdmin, doctorController.getAdminStats);
// Top-rated doctors - accessible to all authenticated users (patients and doctors)
router.get('/top-rated', authenticate, doctorController.getTopRated);

export default router;