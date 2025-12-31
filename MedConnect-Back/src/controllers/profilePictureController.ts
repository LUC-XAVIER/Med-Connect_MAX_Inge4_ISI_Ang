import { Request, Response, NextFunction } from 'express';
import profilePictureService from '../services/profilePictureService';
import { HTTP_STATUS } from '../utils/constants';

export class ProfilePictureController {
  // Upload profile picture
  async uploadProfilePicture(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const file = req.file;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!file) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const fileUrl = await profilePictureService.uploadProfilePicture(userId, file);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: { profile_picture: fileUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete profile picture
  async deleteProfilePicture(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      await profilePictureService.deleteProfilePicture(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile picture deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProfilePictureController();