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

  // Get all conversations for a user (includes both existing conversations and connected users)
  async getUserConversations(userId: number): Promise<ConversationPreview[]> {
    const existingConversations = await messageRepository.getConversations(userId);
    
    // Also get all connected users to show in conversation list
    const connectedUsers = await messageRepository.getConnectedUsers(userId);
    
    // Merge: use existing conversations, add connected users without conversations
    const conversationMap = new Map<number, ConversationPreview>();
    
    // Add existing conversations
    existingConversations.forEach(conv => {
      conversationMap.set(conv.conversation_partner_id, conv);
    });
    
    // Add connected users without existing conversations
    connectedUsers.forEach(user => {
      if (!conversationMap.has(user.user_id)) {
        conversationMap.set(user.user_id, {
          conversation_partner_id: user.user_id,
          conversation_partner_name: user.name,
          conversation_partner_profile_picture: user.profile_picture || undefined,
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0,
          is_last_message_from_me: false
        });
      }
    });
    
    return Array.from(conversationMap.values()).sort((a, b) => {
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