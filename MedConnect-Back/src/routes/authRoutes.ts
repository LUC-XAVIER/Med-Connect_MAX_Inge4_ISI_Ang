import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

// Stricter limiter for login to prevent brute force attacks (enabled only in production)
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'), // 5 login attempts per 15 min
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
    message: 'Login failed. Please try again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Public routes
router.post('/register/patient', registerPatientValidation, validate, authController.registerPatient);
router.post('/register/doctor', registerDoctorValidation, validate, authController.registerDoctor);
// In development, disable the login rate limiter to avoid blocking local testing
if (process.env.NODE_ENV === 'production') {
  router.post('/login', loginLimiter, loginValidation, validate, authController.login);
} else {
  router.post('/login', loginValidation, validate, authController.login);
}

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