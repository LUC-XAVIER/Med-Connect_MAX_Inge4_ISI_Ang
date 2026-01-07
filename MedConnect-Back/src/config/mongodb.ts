import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medconnect';

let db: Db;
let client: MongoClient;

export const connectMongoDB = async (): Promise<void> => {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    db = client.db();
    
    // Create indexes
    await db.collection('medical_records').createIndex({ patient_id: 1, record_date: -1 });
    await db.collection('medical_records').createIndex({ patient_id: 1, record_type: 1 });
    await db.collection('medical_records').createIndex({ created_at: -1 });
    await db.collection('medical_records').createIndex({ is_deleted: 1 });
    
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call connectMongoDB first.');
  }
  return db;
};

export const closeMongoDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
};

export default { connectMongoDB, getDB, closeMongoDB };