import { Router } from 'express';
import newsletterController from '../controllers/newsletterController';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';

const router = Router();

// Simple public subscription endpoint - any email can be used
router.post(
  '/subscribe',
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  validate,
  newsletterController.subscribe
);

export default router;


