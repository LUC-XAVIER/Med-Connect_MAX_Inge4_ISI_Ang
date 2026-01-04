import { Request, Response, NextFunction } from 'express';
import doctorService from '../services/doctorService';
import { HTTP_STATUS } from '../utils/constants';

export class DoctorController {
  // Get doctor profile
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

      const profile = await doctorService.getProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update doctor profile
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

      const updatedProfile = await doctorService.updateProfile(userId, updates);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all doctors
  async getAllDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const specialty = req.query.specialty as string;
      const verified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await doctorService.getAllDoctors({ specialty, verified, page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Search doctors
  async searchDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchTerm = req.query.q as string || '';
      const specialty = req.query.specialty as string;
      const verified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;
      const hospital = req.query.hospital as string;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: { specialty?: string; verified?: boolean; hospital?: string } = {};
      if (specialty) filters.specialty = specialty;
      if (verified !== undefined) filters.verified = verified;
      if (hospital) filters.hospital = hospital;

      const doctors = await doctorService.searchDoctors(searchTerm, filters, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: doctors,
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify doctor (admin only)
  async verifyDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = parseInt(req.params.doctorId);

      await doctorService.verifyDoctor(doctorId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Doctor verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete doctor profile
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

      await doctorService.deleteProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();