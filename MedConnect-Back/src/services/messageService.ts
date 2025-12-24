import messageRepository from '../repositories/messageRepository';
import { CreateMessageDTO, Message, MessageWithUserInfo, ConversationPreview } from '../models/mysql/Message';

export class MessageService {
  // Send a message
  async sendMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
    // Check if users are connected
    const areConnected = await messageRepository.areUsersConnected(senderId, receiverId);
    
    if (!areConnected) {
      throw new Error('You can only message connected users');
    }

    const messageData: CreateMessageDTO = {
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
  ): Promise<{ messages: MessageWithUserInfo[], total: number, page: number, limit: number }> {
    // Check if users are connected
    const areConnected = await messageRepository.areUsersConnected(userId, otherUserId);
    
    if (!areConnected) {
      throw new Error('You can only view messages with connected users');
    }

    const offset = (page - 1) * limit;
    const messages = await messageRepository.getConversation(userId, otherUserId, limit, offset);

    return {
      messages,
      total: messages.length,
      page,
      limit
    };
  }

  // Mark conversation as read
  async markConversationAsRead(userId: number, otherUserId: number): Promise<void> {
    await messageRepository.markAsRead(otherUserId, userId);
  }

  // Get all conversations for a user
  async getUserConversations(userId: number): Promise<ConversationPreview[]> {
    return await messageRepository.getConversations(userId);
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