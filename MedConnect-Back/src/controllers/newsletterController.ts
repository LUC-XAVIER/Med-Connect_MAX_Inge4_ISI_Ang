import { Request, Response, NextFunction } from 'express';
import newsletterService from '../services/newsletterService';
import { HTTP_STATUS } from '../utils/constants';

export class NewsletterController {
  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Even if sending fails, we don't want to leak whether an email is "valid"
      // or enforce existence in our system; we just attempt to send.
      await newsletterService.sendSubscriptionConfirmation(email);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'If the email is valid, a subscription confirmation has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsletterController();


