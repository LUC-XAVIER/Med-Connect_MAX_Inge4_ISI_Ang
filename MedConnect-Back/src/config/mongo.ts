// typescript
// File: `src/config/mongo.ts`
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI?.trim();

export async function connectMongoIfNeeded(): Promise<void> {
    if (!MONGO_URI) {
        console.info('MongoDB not configured (MONGODB_URI empty) — skipping mongoose connection.');
        return;
    }

    try {
        await mongoose.connect(MONGO_URI, {
            // adjust options to your mongoose version
            serverSelectionTimeoutMS: 5000,
        } as mongoose.ConnectOptions);
        console.info('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err);
        // Do not throw if you want server to keep running without Mongo.
        // throw err;
    }


}
