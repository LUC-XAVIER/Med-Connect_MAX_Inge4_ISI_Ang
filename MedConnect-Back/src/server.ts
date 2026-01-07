import app from './app';
import { connectMongoDB } from 'config/mongodb';
import { connectMySQL } from 'config/mysql';
import logger from 'utils/logger';
import { initializeSocket } from 'utils/socketHandler';
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
    // Check for required environment variables
    if (!process.env.JWT_SECRET) {
      logger.error('❌ JWT_SECRET is not set in environment variables');
      logger.error('Please create a .env file with required variables. See README.md for details.');
      process.exit(1);
    }

    // Connect to MongoDB
    try {
      await connectMongoDB();
    } catch (error: any) {
      logger.error('❌ Failed to connect to MongoDB:', error.message || error);
      logger.error('Make sure MongoDB is running and MONGODB_URI is correct in .env file');
      throw error;
    }

    // Connect to MySQL
    try {
      await connectMySQL();
    } catch (error: any) {
      logger.error('❌ Failed to connect to MySQL:', error.message || error);
      logger.error('Make sure MySQL is running and database credentials are correct in .env file');
      throw error;
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`📡 WebSocket server is ready for connections`);
      logger.info(`📍 API endpoint: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name + ': ' + err.message);
      if (err.stack) {
        logger.error(err.stack);
      }
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

  } catch (error: any) {
    logger.error('❌ Failed to start server:', error.message || error);
    if (error.stack) {
      logger.error(error.stack);
    }
    logger.error('\n💡 Troubleshooting tips:');
    logger.error('1. Make sure you have a .env file in the MedConnect-Back directory');
    logger.error('2. Check that MySQL and MongoDB are running');
    logger.error('3. Verify database credentials in .env file');
    logger.error('4. See README.md for required environment variables');
    process.exit(1);
  }
};

startServer();

export { io };