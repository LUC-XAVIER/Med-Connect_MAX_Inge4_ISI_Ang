import nodemailer from 'nodemailer';
import logger from '../utils/logger';

export class NewsletterService {
  private readonly transporter;

  constructor() {
    // Reuse the same SMTP configuration pattern as password reset.
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

  /**
   * Send a simple subscription confirmation email.
   * No database storage required per current requirements.
   */
  async sendSubscriptionConfirmation(email: string): Promise<void> {
    // If SMTP credentials are not configured, don't fail the request.
    // Just log and return so the API can still respond 200.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn(
        `Newsletter subscription attempted for ${email}, but SMTP credentials are not configured. Skipping email send.`
      );
      return;
    }

    const appName = process.env.APP_NAME || 'Med-Connect';

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: `${appName} - Subscription Confirmed`,
      html: `
        <h2>Thank you for subscribing to ${appName}</h2>
        <p>Hello,</p>
        <p>You've successfully subscribed to our updates.</p>
        <p>We'll keep you informed about new features, improvements, and useful health tips.</p>
        <br/>
        <p>If you did not request this subscription, you can safely ignore this email.</p>
        <br/>
        <p>Best regards,</p>
        <p>${appName} Team</p>
      `,
    });

    logger.info(`Newsletter subscription confirmation email sent to: ${email}`);
  }
}

export default new NewsletterService();


