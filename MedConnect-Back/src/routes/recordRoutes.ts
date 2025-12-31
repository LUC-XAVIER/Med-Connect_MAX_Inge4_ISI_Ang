import { Router } from 'express';
import recordController from '../controllers/recordController';
import { authenticate, isPatient } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  uploadRecordValidation,
  updateRecordValidation,
  validate,
} from '../middleware/validation';

const router = Router();

// All routes require authentication and patient role

// Upload medical record (with file)
router.post(
  '/upload',
  authenticate,
  isPatient,
  upload.single('file'),
  uploadRecordValidation,
  validate,
  recordController.uploadRecord
);

// Get all my records (with filters)
router.get('/', authenticate, isPatient, recordController.getMyRecords);

// Search my records
router.get('/search', authenticate, isPatient, recordController.searchRecords);

// Get single record
router.get('/:recordId', authenticate, recordController.getRecordById);

// Update record metadata
router.put(
  '/:recordId',
  authenticate,
  isPatient,
  updateRecordValidation,
  validate,
  recordController.updateRecord
);

// Delete record
router.delete('/:recordId', authenticate, isPatient, recordController.deleteRecord);

export default router;