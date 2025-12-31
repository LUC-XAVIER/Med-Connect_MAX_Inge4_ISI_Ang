import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import messageService from '../services/messageService';

// interface UserSocket {
//   userId: number;
//   socketId: string;
// }

// Store active users and their socket connections
const activeUsers = new Map<number, string>();

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

    // Store user's socket connection
    activeUsers.set(userId, socket.id);

    // Notify user they're connected
    socket.emit('connected', {
      message: 'Successfully connected to messaging server',
      userId: userId
    });

    // Send online users list to the connected user
    socket.emit('online_users', Array.from(activeUsers.keys()));

    // Broadcast to others that this user is online
    socket.broadcast.emit('user_online', userId);

    // Handle sending messages
    socket.on('send_message', async (data: { receiver_id: number; message_content: string }) => {
      try {
        const { receiver_id, message_content } = data;

        // Validate message
        if (!receiver_id || !message_content || message_content.trim() === '') {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Send message through service (includes connection check)
        const message = await messageService.sendMessage(userId, receiver_id, message_content);

        // Send confirmation to sender
        socket.emit('message_sent', {
          success: true,
          message: message
        });

        // Send message to receiver if they're online
        const receiverSocketId = activeUsers.get(receiver_id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            message: message
          });
        }

      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { receiver_id: number }) => {
      const receiverSocketId = activeUsers.get(data.receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          user_id: userId
        });
      }
    });

    // Handle stop typing indicator
    socket.on('stop_typing', (data: { receiver_id: number }) => {
      const receiverSocketId = activeUsers.get(data.receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stop_typing', {
          user_id: userId
        });
      }
    });

    // Handle mark as read
    socket.on('mark_as_read', async (data: { sender_id: number }) => {
      try {
        await messageService.markConversationAsRead(userId, data.sender_id);
        
        // Notify sender that their messages were read
        const senderSocketId = activeUsers.get(data.sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', {
            reader_id: userId
          });
        }

        socket.emit('marked_as_read', { success: true });
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Failed to mark as read' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);
      activeUsers.delete(userId);
      
      // Broadcast to others that this user is offline
      socket.broadcast.emit('user_offline', userId);
    });
  });

  return io;
};

export default initializeSocket;