import { Request, Response, NextFunction } from 'express';
import doctorRatingService from '../services/doctorRatingService';
import { HTTP_STATUS } from '../utils/constants';

export class DoctorRatingController {
  // Rate a doctor
  async rateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientUserId = req.user?.user_id;
      const doctorUserId = parseInt(req.params.doctorUserId);
      const { rating, review } = req.body;

      if (!patientUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const result = await doctorRatingService.rateDoctor(patientUserId, doctorUserId, { rating, review });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Doctor rated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all ratings for a doctor
  async getDoctorRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorUserId = parseInt(req.params.doctorUserId);

      const result = await doctorRatingService.getDoctorRatings(doctorUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get my rating for a doctor
  async getMyRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientUserId = req.user?.user_id;
      const doctorUserId = parseInt(req.params.doctorUserId);

      if (!patientUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const result = await doctorRatingService.getMyRating(patientUserId, doctorUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorRatingController();