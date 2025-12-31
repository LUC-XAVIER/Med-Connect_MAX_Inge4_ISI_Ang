import app from './app';
import { connectMongoDB } from '@config/mongodb';
import { connectMySQL } from '@config/mysql';
import logger from '@utils/logger';
import { initializeSocket } from '@utils/socketHandler';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    await connectMySQL();

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📡 WebSocket server is ready for connections`);
      logger.info(`📍 API endpoint: http://localhost:${PORT}/api/${process.env.API_VERSION}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name + ': ' + err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };