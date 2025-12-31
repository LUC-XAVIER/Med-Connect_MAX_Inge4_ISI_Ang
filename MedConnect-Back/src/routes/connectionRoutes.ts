import { Router } from 'express';
import connectionController from '../controllers/connectionController';
import { authenticate, isPatient, isDoctor } from '../middleware/auth';
import { requestConnectionValidation, shareRecordsValidation, validate } from '../middleware/validation';

const router = Router();

// Patient routes
router.post(
  '/request',
  authenticate,
  isPatient,
  requestConnectionValidation,
  validate,
  connectionController.requestConnection
);

router.post(
  '/:connectionId/share',
  authenticate,
  isPatient,
  shareRecordsValidation,
  validate,
  connectionController.shareRecords
);

router.post(
  '/:connectionId/unshare',
  authenticate,
  isPatient,
  shareRecordsValidation,
  validate,
  connectionController.unshareRecords
);

router.post(
  '/:connectionId/share-all',
  authenticate,
  isPatient,
  connectionController.shareAllRecords
);

// Doctor routes
router.put(
  '/:connectionId/approve',
  authenticate,
  isDoctor,
  connectionController.approveConnection
);

router.put(
  '/:connectionId/reject',
  authenticate,
  isDoctor,
  connectionController.rejectConnection
);

router.put(
  '/:connectionId/revoke',
  authenticate,
  isDoctor,
  connectionController.revokeConnection
);

router.get(
  '/patient/:patientUserId/records',
  authenticate,
  isDoctor,
  connectionController.viewPatientRecords
);

// Both patient and doctor can access
router.get(
  '/',
  authenticate,
  connectionController.getMyConnections
);

router.get(
  '/:connectionId/shared-records',
  authenticate,
  connectionController.getSharedRecords
);

export default router;