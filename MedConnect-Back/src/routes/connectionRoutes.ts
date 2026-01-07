import { Router } from 'express';
import connectionController from '../controllers/connectionController';
import { authenticate, isPatient, isDoctor } from '../middleware/auth';
import { requestConnectionValidation, shareRecordsValidation, validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Patient routes
router.post(
  '/request',
  isPatient,
  requestConnectionValidation,
  validate,
  connectionController.requestConnection
);

router.post(
  '/:connectionId/share',
  isPatient,
  shareRecordsValidation,
  validate,
  connectionController.shareRecords
);

router.post(
  '/:connectionId/unshare',
  isPatient,
  shareRecordsValidation,
  validate,
  connectionController.unshareRecords
);

router.post(
  '/:connectionId/share-all',
  isPatient,
  connectionController.shareAllRecords
);

// Get connection status (patient checks status with doctor)
router.get(
  '/status/:doctorUserId',
  isPatient,
  connectionController.getConnectionStatus
);

// Doctor routes
router.get(
  '/pending',
  isDoctor,
  connectionController.getPendingRequests
);

router.put(
  '/:connectionId/approve',
  isDoctor,
  connectionController.approveConnection
);

router.put(
  '/:connectionId/reject',
  isDoctor,
  connectionController.rejectConnection
);

router.put(
  '/:connectionId/revoke',
  isDoctor,
  connectionController.revokeConnection
);

router.get(
  '/patient/:patientUserId/records',
  isDoctor,
  connectionController.viewPatientRecords
);

// Both patient and doctor can access
router.get(
  '/',
  connectionController.getMyConnections
);

router.get(
  '/:connectionId/shared-records',
  connectionController.getSharedRecords
);

export default router;