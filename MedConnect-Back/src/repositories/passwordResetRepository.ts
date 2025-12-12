import pool from '../config/mysql';
import { IPasswordResetToken, ICreatePasswordResetToken } from '../models/mysql/PasswordResetToken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class PasswordResetRepository {
  // Create reset token
  async create(tokenData: ICreatePasswordResetToken): Promise<IPasswordResetToken> {
    const { user_id, token, expires_at } = tokenData;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user_id, token, expires_at]
    );

    const [newToken] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM password_reset_tokens WHERE token_id = ?',
      [result.insertId]
    );

    return newToken[0] as IPasswordResetToken;
  }

  // Find token
  async findByToken(token: string): Promise<IPasswordResetToken | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IPasswordResetToken;
  }

  // Mark token as used
  async markAsUsed(tokenId: number): Promise<void> {
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token_id = ?',
      [tokenId]
    );
  }

  // Delete expired tokens
  async deleteExpired(): Promise<void> {
    await pool.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
  }

  // Delete all tokens for a user
  async deleteByUserId(userId: number): Promise<void> {
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [userId]
    );
  }

  // Find token by user ID (get latest)
  async findByUserId(userId: number): Promise<IPasswordResetToken | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM password_reset_tokens WHERE user_id = ? AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IPasswordResetToken;
  }

  // Count active tokens for a user
  async countActiveTokensByUserId(userId: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM password_reset_tokens WHERE user_id = ? AND used = FALSE AND expires_at > NOW()',
      [userId]
    );

    return rows[0]?.count || 0;
  }

  // Delete token by ID
  async deleteByTokenId(tokenId: number): Promise<void> {
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE token_id = ?',
      [tokenId]
    );
  }

  // Find token by token ID
  async findByTokenId(tokenId: number): Promise<IPasswordResetToken | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM password_reset_tokens WHERE token_id = ?',
      [tokenId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IPasswordResetToken;
  }

  // Check if token is valid (not expired and not used)
  async isTokenValid(token: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    return rows.length > 0;
  }

  // Invalidate all tokens for a user (mark as used)
  async invalidateAllUserTokens(userId: number): Promise<void> {
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ?',
      [userId]
    );
  }

  // Get all tokens for a user (for admin purposes)
  async findAllByUserId(userId: number): Promise<IPasswordResetToken[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM password_reset_tokens WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return rows as IPasswordResetToken[];
  }
}

export default new PasswordResetRepository();