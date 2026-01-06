import express from 'express';
import messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// REST API routes
router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:userId', messageController.getConversation);
router.put('/conversations/:userId/read', messageController.markAsRead);
router.get('/unread-count', messageController.getUnreadCount);

export default router;