import messageRepository from '../repositories/messageRepository';
import { AppError } from '@middleware/errorHandler';
import { HTTP_STATUS } from '@utils/constants';

export class MessageService {
  // Send a message
  async sendMessage(senderId: number, receiverId: number, content: string): Promise<any> {
    // Check if users are connected
    const areConnected = await messageRepository.areUsersConnected(senderId, receiverId);
    
    if (!areConnected) {
      throw new AppError('You can only message connected users', HTTP_STATUS.FORBIDDEN);
    }

    const messageData = {
      sender_id: senderId,
      receiver_id: receiverId,
      message_content: content.trim()
    };

    return await messageRepository.createMessage(messageData);
  }

  // Get conversation between two users
  async getConversation(
    userId: number,
    otherUserId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<any> {
    // Check if users are connected
    const areConnected = await messageRepository.areUsersConnected(userId, otherUserId);
    
    if (!areConnected) {
      throw new AppError('You can only view messages with connected users', HTTP_STATUS.FORBIDDEN);
    }

    const offset = (page - 1) * limit;
    const messages = await messageRepository.getConversation(userId, otherUserId, limit, offset);

    return messages;
  }

  // Mark conversation as read
  async markConversationAsRead(userId: number, otherUserId: number): Promise<void> {
    await messageRepository.markAsRead(otherUserId, userId);
  }

  // Get all conversations for a user
  async getUserConversations(userId: number): Promise<any[]> {
    const existingConversations = await messageRepository.getConversations(userId);
    
    // Also get all connected users to show in conversation list
    const connectedUsers = await messageRepository.getConnectedUsers(userId);
    
    // Merge: use existing conversations, add connected users without conversations
    const conversationMap = new Map<number, any>();
    
    // Add existing conversations
    existingConversations.forEach((conv: any) => {
      conversationMap.set(conv.conversation_partner_id, conv);
    });
    
    // Add connected users without existing conversations
    connectedUsers.forEach((user: any) => {
      if (!conversationMap.has(user.user_id)) {
        conversationMap.set(user.user_id, {
          conversation_partner_id: user.user_id,
          conversation_partner_name: user.name,
          conversation_partner_profile_picture: user.profile_picture || null,
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0,
          is_last_message_from_me: false,
          other_user_id: user.user_id,
          other_user_name: user.name
        });
      }
    });
    
    return Array.from(conversationMap.values()).sort((a: any, b: any) => {
      // Sort by last message time, newest first
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });
  }

  // Get unread message count
  async getUnreadCount(userId: number): Promise<number> {
    return await messageRepository.getUnreadCount(userId);
  }

  // Validate if users can message each other
  async canUsersMessage(userId1: number, userId2: number): Promise<boolean> {
    return await messageRepository.areUsersConnected(userId1, userId2);
  }
}

export default new MessageService();