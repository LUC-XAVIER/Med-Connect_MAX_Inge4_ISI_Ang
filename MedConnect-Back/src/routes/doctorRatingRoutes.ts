import { Router } from 'express';
import doctorRatingController from '../controllers/doctorRatingController';
import { authenticate, isPatient } from '../middleware/auth';
import { rateDoctorValidation, validate } from '../middleware/validation';

const router = Router();

// Rate a doctor (patient only)
router.post(
  '/:doctorUserId/rate',
  authenticate,
  isPatient,
  rateDoctorValidation,
  validate,
  doctorRatingController.rateDoctor
);

// Get all ratings for a doctor (public)
router.get(
  '/:doctorUserId/ratings',
  authenticate,
  doctorRatingController.getDoctorRatings
);

// Get my rating for a doctor (patient only)
router.get(
  '/:doctorUserId/my-rating',
  authenticate,
  isPatient,
  doctorRatingController.getMyRating
);

export default router;