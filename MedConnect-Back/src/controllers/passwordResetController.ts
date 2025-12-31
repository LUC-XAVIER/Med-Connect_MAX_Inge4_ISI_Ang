import { Request, Response, NextFunction } from 'express';
import passwordResetService from '../services/passwordResetService';
import { HTTP_STATUS } from '../utils/constants';

export class PasswordResetController {
  // Request password reset
  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      await passwordResetService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password with token
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, new_password } = req.body;

      await passwordResetService.resetPassword(token, new_password);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PasswordResetController();