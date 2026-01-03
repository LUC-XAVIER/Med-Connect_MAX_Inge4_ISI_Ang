import { Request, Response, NextFunction } from 'express';
import appointmentService from '../services/appointmentService';
import { HTTP_STATUS } from '../utils/constants';

export class AppointmentController {
  // Create appointment (both patient and doctor can create)
  async createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const appointmentData = req.body;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let appointment;

      if (userRole === 'patient') {
        // Patient books appointment with doctor
        appointment = await appointmentService.createAppointmentByPatient(userId, appointmentData);
      } else if (userRole === 'doctor') {
        // Doctor schedules appointment for patient
        appointment = await appointmentService.createAppointmentByDoctor(userId, appointmentData);
      } else {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Invalid user role',
        });
        return;
      }

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get appointment by ID
  async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const appointmentId = parseInt(req.params.appointmentId);

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const appointment = await appointmentService.getAppointmentById(appointmentId, userId, userRole);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get my appointments
  async getMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const status = req.query.status as string;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let appointments;
      if (userRole === 'patient') {
        appointments = await appointmentService.getPatientAppointments(userId, status);
      } else if (userRole === 'doctor') {
        appointments = await appointmentService.getDoctorAppointments(userId, status);
      } else {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Invalid user role',
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update appointment status
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const appointmentId = parseInt(req.params.appointmentId);
      const { status, notes } = req.body;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await appointmentService.updateStatus(appointmentId, status, notes, userId, userRole);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Appointment status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const appointmentId = parseInt(req.params.appointmentId);
      const { appointment_date, appointment_time } = req.body;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const appointment = await appointmentService.rescheduleAppointment(
          appointmentId,
          new Date(appointment_date),
          appointment_time,
          userId,
          userRole
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel appointment
  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const appointmentId = parseInt(req.params.appointmentId);

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await appointmentService.cancelAppointment(appointmentId, userId, userRole);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Appointment cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AppointmentController();