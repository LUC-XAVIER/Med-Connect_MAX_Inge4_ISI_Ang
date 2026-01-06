import { Request, Response, NextFunction } from 'express';
import prescriptionService from '../services/prescriptionService';
import { HTTP_STATUS } from '../utils/constants';

export class PrescriptionController {
  // Create prescription (doctor only)
  async createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorUserId = req.user?.user_id;
      const prescriptionData = req.body;

      if (!doctorUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Doctor not authenticated',
        });
        return;
      }

      const prescription = await prescriptionService.createPrescription(doctorUserId, prescriptionData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Prescription created successfully',
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get prescription by ID
  async getPrescriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const prescriptionId = parseInt(req.params.prescriptionId);

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const prescription = await prescriptionService.getPrescriptionById(prescriptionId, userId, userRole);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get my prescriptions
  async getMyPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let prescriptions;
      if (userRole === 'patient') {
        prescriptions = await prescriptionService.getPatientPrescriptions(userId);
      } else if (userRole === 'doctor') {
        prescriptions = await prescriptionService.getDoctorPrescriptions(userId);
      } else {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Invalid user role',
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update prescription status
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const prescriptionId = parseInt(req.params.prescriptionId);
      const { status } = req.body;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await prescriptionService.updateStatus(prescriptionId, status, userId, userRole);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Prescription status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PrescriptionController();