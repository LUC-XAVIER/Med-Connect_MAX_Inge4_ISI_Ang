import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/mysql';
import { Message, CreateMessageDTO, MessageWithUserInfo, ConversationPreview } from '../models/mysql/Message';

export class MessageRepository {
  // Create a new message
  async createMessage(messageData: CreateMessageDTO): Promise<Message> {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, message_content)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await pool.execute<ResultSetHeader>(
      query,
      [messageData.sender_id, messageData.receiver_id, messageData.message_content]
    );

    return this.findById(result.insertId);
  }

  // Find message by ID
  async findById(messageId: number): Promise<Message> {
    const query = `
      SELECT * FROM messages WHERE message_id = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [messageId]);
    return rows[0] as Message;
  }

  // Get conversation between two users
  async getConversation(userId1: number, userId2: number, limit: number = 50, offset: number = 0): Promise<MessageWithUserInfo[]> {
    const query = `
      SELECT 
        m.*,
        s.first_name as sender_first_name,
        s.last_name as sender_last_name,
        s.profile_picture as sender_profile_picture,
        r.first_name as receiver_first_name,
        r.last_name as receiver_last_name,
        r.profile_picture as receiver_profile_picture
      FROM messages m
      INNER JOIN users s ON m.sender_id = s.user_id
      INNER JOIN users r ON m.receiver_id = r.user_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      query,
      [userId1, userId2, userId2, userId1, limit, offset]
    );
    
    return rows as MessageWithUserInfo[];
  }

  // Mark messages as read
  async markAsRead(senderId: number, receiverId: number): Promise<void> {
    const query = `
      UPDATE messages 
      SET is_read = TRUE 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
    `;
    
    await pool.execute(query, [senderId, receiverId]);
  }

  // Get all conversations for a user
  async getConversations(userId: number): Promise<ConversationPreview[]> {
    const query = `
      SELECT 
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as conversation_partner_id,
        CASE 
          WHEN m.sender_id = ? THEN CONCAT(r.first_name, ' ', r.last_name)
          ELSE CONCAT(s.first_name, ' ', s.last_name)
        END as conversation_partner_name,
        CASE 
          WHEN m.sender_id = ? THEN r.profile_picture
          ELSE s.profile_picture
        END as conversation_partner_profile_picture,
        m.message_content as last_message,
        m.created_at as last_message_time,
        CASE WHEN m.sender_id = ? THEN TRUE ELSE FALSE END as is_last_message_from_me,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE sender_id = conversation_partner_id 
            AND receiver_id = ? 
            AND is_read = FALSE
        ) as unread_count
      FROM messages m
      INNER JOIN users s ON m.sender_id = s.user_id
      INNER JOIN users r ON m.receiver_id = r.user_id
      WHERE m.message_id IN (
        SELECT MAX(message_id)
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END
      )
      ORDER BY m.created_at DESC
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      query,
      [userId, userId, userId, userId, userId, userId, userId, userId]
    );
    
    return rows as ConversationPreview[];
  }

  // Get unread message count for a user
  async getUnreadCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND is_read = FALSE
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [userId]);
    return rows[0].count;
  }

  // Check if two users are connected
  async areUsersConnected(userId1: number, userId2: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM connections c
      INNER JOIN patients p1 ON c.patient_id = p1.patient_id
      INNER JOIN doctors d ON c.doctor_id = d.doctor_id
      INNER JOIN patients p2 ON p2.patient_id = c.patient_id
      WHERE c.status = 'approved'
        AND (
          (p1.user_id = ? AND d.user_id = ?) OR
          (p1.user_id = ? AND d.user_id = ?)
        )
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      query,
      [userId1, userId2, userId2, userId1]
    );
    
    return rows[0].count > 0;
  }

  // Delete a message (optional - for future use)
  async deleteMessage(messageId: number): Promise<void> {
    const query = `DELETE FROM messages WHERE message_id = ?`;
    await pool.execute(query, [messageId]);
  }
}

export default new MessageRepository();