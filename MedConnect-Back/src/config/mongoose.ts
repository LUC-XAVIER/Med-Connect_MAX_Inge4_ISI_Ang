import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '@utils/logger';

dotenv.config();

const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectMongoDB;