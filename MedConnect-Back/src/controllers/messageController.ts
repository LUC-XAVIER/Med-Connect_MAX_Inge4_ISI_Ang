import { Request, Response, NextFunction } from 'express';
import messageService from '../services/messageService';

export class MessageController {
  // Send a message (REST endpoint - also handled by Socket.io)
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user?.user_id;
      const { receiver_id, message_content } = req.body;

      if (!senderId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      if (!receiver_id || !message_content) {
        res.status(400).json({
          success: false,
          error: 'Receiver ID and message content are required'
        });
        return;
      }

      const message = await messageService.sendMessage(senderId, receiver_id, message_content);

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get conversation with another user
  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const otherUserId = parseInt(req.params.userId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      if (isNaN(otherUserId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
        return;
      }

      const conversation = await messageService.getConversation(userId, otherUserId, page, limit);

      res.status(200).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark conversation as read
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const otherUserId = parseInt(req.params.userId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      if (isNaN(otherUserId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        });
        return;
      }

      await messageService.markConversationAsRead(userId, otherUserId);

      res.status(200).json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all conversations
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const conversations = await messageService.getUserConversations(userId);

      res.status(200).json({
        success: true,
        data: conversations
      });
    } catch (error) {
      next(error);
    }
  }

  // Get unread message count
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const count = await messageService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();