import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  registerPatientValidation,
  registerDoctorValidation,
  loginValidation,
  changePasswordValidation,
  validate,
} from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register/patient', registerPatientValidation, validate, authController.registerPatient);
router.post('/register/doctor', registerDoctorValidation, validate, authController.registerDoctor);
router.post('/login', loginValidation, validate, authController.login);

// Protected routes (require authentication)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

export default router;