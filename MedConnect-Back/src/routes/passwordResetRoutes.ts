import { Router } from 'express';
import passwordResetController from '../controllers/passwordResetController';
import {
  requestPasswordResetValidation,
  resetPasswordValidation,
  validate,
} from '../middleware/validation';

const router = Router();

// Request password reset (public)
router.post(
  '/request',
  requestPasswordResetValidation,
  validate,
  passwordResetController.requestPasswordReset
);

// Reset password with token (public)
router.post(
  '/reset',
  resetPasswordValidation,
  validate,
  passwordResetController.resetPassword
);

export default router;