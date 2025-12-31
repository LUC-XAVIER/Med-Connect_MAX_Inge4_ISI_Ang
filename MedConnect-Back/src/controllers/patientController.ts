import { Request, Response, NextFunction } from 'express';
import patientService from '../services/patientService';
import { HTTP_STATUS } from '../utils/constants';

export class PatientController {
  // Get patient profile
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const profile = await patientService.getProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update patient profile
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const updates = req.body;

      const updatedProfile = await patientService.updateProfile(userId, updates);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all patients (admin only)
  async getAllPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await patientService.getAllPatients(page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete patient profile
  async deleteProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await patientService.deleteProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PatientController();