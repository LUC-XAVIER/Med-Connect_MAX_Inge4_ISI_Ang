import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const poolConfig: PoolOptions = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool: Pool = mysql.createPool(poolConfig);

// Test connection
pool.getConnection()
    .then((connection: any) => {
      logger.info('✅ MySQL connected successfully');
      connection.release();
    })
    .catch((err: any) => {
      logger.error('❌ MySQL connection error:', err);
    });

const connectMySQL = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    await connection.ping(); // optional: verifies the connection
    logger.info('✅ MySQL connected successfully');
    connection.release();
  } catch (error: any) {
    logger.error('❌ MySQL connection error:', error.message || error);
    throw error; // Let the server handle the error
  }
};

export async function createPoolWithRetry(): Promise<Pool> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info('✅ MySQL pool is ready (createPoolWithRetry)');
    return pool;
  } catch (err: any) {
    logger.error('❌ createPoolWithRetry failed:', err?.message || err);
    throw err;
  }
}

export default pool;
export { connectMySQL };
