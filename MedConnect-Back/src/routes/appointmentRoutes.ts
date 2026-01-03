import { Router } from 'express';
import appointmentController from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';
import {
  createAppointmentValidation,
  updateAppointmentStatusValidation,
  rescheduleAppointmentValidation,
  validate,
} from '../middleware/validation';

const router = Router();

// Create appointment (BOTH patient and doctor can create)
router.post(
    '/',
    authenticate,
    createAppointmentValidation,
    validate,
    appointmentController.createAppointment
);

// Get my appointments
router.get(
    '/',
    authenticate,
    appointmentController.getMyAppointments
);

// Get single appointment
router.get(
    '/:appointmentId',
    authenticate,
    appointmentController.getAppointmentById
);

// Update appointment status
router.put(
    '/:appointmentId/status',
    authenticate,
    updateAppointmentStatusValidation,
    validate,
    appointmentController.updateStatus
);

// Reschedule appointment
router.put(
    '/:appointmentId/reschedule',
    authenticate,
    rescheduleAppointmentValidation,
    validate,
    appointmentController.rescheduleAppointment
);

// Cancel appointment
router.delete(
    '/:appointmentId',
    authenticate,
    appointmentController.cancelAppointment
);

export default router;