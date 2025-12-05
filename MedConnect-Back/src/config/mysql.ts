import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '@utils/logger';

dotenv.config();

const poolConfig: PoolOptions = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
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
  .then((connection) => {
    logger.info('✅ MySQL connected successfully');
    connection.release();
  })
  .catch((err) => {
    logger.error('❌ MySQL connection error:', err);
  });

const connectMySQL = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    await connection.ping(); // optional: verifies the connection
    logger.info('✅ MySQL connected successfully');
    connection.release();
  } catch (error) {
    logger.error('❌ MySQL connection error:', error);
    process.exit(1);
  }
};

export default pool;
export { connectMySQL };