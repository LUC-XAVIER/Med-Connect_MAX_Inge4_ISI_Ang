import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import userRepository from '../repositories/userRepository';
import passwordResetRepository from '../repositories/passwordResetRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class PasswordResetService {
  private readonly transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    await passwordResetRepository.create({
      user_id: user.user_id,
      token,
      expires_at: expiresAt,
    });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:19006'}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Med-Connect - Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.first_name},</p>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <p>Best regards,</p>
        <p>Med-Connect Team</p>
      `,
    });

    logger.info(`Password reset email sent to: ${email}`);
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid token
    const resetToken = await passwordResetRepository.findByToken(token);

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await userRepository.update(resetToken.user_id, { password_hash });

    // Mark token as used
    await passwordResetRepository.markAsUsed(resetToken.token_id);

    // Delete all other tokens for this user
    await passwordResetRepository.deleteByUserId(resetToken.user_id);

    logger.info(`Password reset successful for user_id=${resetToken.user_id}`);
  }

  // Clean up expired tokens (run periodically)
  async cleanupExpiredTokens(): Promise<void> {
    await passwordResetRepository.deleteExpired();
    logger.info('Expired password reset tokens cleaned up');
  }
}

export default new PasswordResetService();