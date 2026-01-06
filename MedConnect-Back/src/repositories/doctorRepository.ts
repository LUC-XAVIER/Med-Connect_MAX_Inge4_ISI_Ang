import pool from '../config/mysql';
import { IDoctor } from '../models/mysql/Doctor';
import { RowDataPacket } from 'mysql2';

export class DoctorRepository {
  // Get doctor by ID
  async findById(doctorId: number): Promise<IDoctor | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM doctors WHERE doctor_id = ?',
      [doctorId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IDoctor;
  }

  // Get doctor by user_id
  async findByUserId(userId: number): Promise<IDoctor | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM doctors WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IDoctor;
  }

  // Get complete doctor profile (user + doctor info)
  async getCompleteProfile(userId: number): Promise<any> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.user_id, u.first_name, u.last_name, u.email, u.role, 
        u.contact, u.address, u.profile_picture, u.is_active, u.created_at as user_created_at,
        d.doctor_id, d.specialty, d.license_number, d.hospital_affiliation, 
        d.verified, d.bio, d.created_at as doctor_created_at
      FROM users u
      JOIN doctors d ON u.user_id = d.user_id
      WHERE u.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  // Update doctor profile
  async update(doctorId: number, updates: Partial<IDoctor>): Promise<IDoctor> {
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'doctor_id' && key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(doctorId);

    await pool.query(
      `UPDATE doctors SET ${fields.join(', ')} WHERE doctor_id = ?`,
      values
    );

    const updatedDoctor = await this.findById(doctorId);
    
    if (!updatedDoctor) {
      throw new Error('Doctor not found after update');
    }

    return updatedDoctor;
  }

  // Verify doctor (admin only)
  async verify(doctorId: number): Promise<void> {
    await pool.query(
      'UPDATE doctors SET verified = true WHERE doctor_id = ?',
      [doctorId]
    );
  }

  // Delete doctor (cascade will delete user)
  async delete(doctorId: number): Promise<void> {
    await pool.query('DELETE FROM doctors WHERE doctor_id = ?', [doctorId]);
  }

  // Get all doctors with filters
  async getAll(filters: {
    specialty?: string;
    verified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { specialty, verified, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT 
        u.user_id, u.first_name, u.last_name, u.email, u.contact, u.address, u.profile_picture,
        d.doctor_id, d.specialty, d.license_number, d.hospital_affiliation, 
        d.verified, d.bio
      FROM users u
      JOIN doctors d ON u.user_id = d.user_id
      WHERE u.is_active = true
    `;

    const params: any[] = [];

    if (specialty) {
      query += ' AND d.specialty LIKE ?';
      params.push(`%${specialty}%`);
    }

    if (verified !== undefined) {
      query += ' AND d.verified = ?';
      params.push(verified);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows;
  }

  // Search doctors by name, specialty, hospital, or bio
  async search(searchTerm: string, filters?: { specialty?: string; verified?: boolean; hospital?: string }, limit: number = 20): Promise<any[]> {
    let query = `
      SELECT 
        u.user_id, u.first_name, u.last_name, u.email, u.contact, u.address, u.profile_picture,
        d.doctor_id, d.specialty, d.license_number, d.hospital_affiliation, 
        d.verified, d.bio
      FROM users u
      JOIN doctors d ON u.user_id = d.user_id
      WHERE u.is_active = true
    `;
    
    const params: any[] = [];
    
    // Add search term filters
    if (searchTerm) {
      query += ` AND (
        u.first_name LIKE ? 
        OR u.last_name LIKE ? 
        OR d.specialty LIKE ?
        OR d.hospital_affiliation LIKE ?
        OR d.bio LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Add additional filters
    if (filters?.specialty) {
      query += ' AND d.specialty LIKE ?';
      params.push(`%${filters.specialty}%`);
    }
    
    if (filters?.verified !== undefined) {
      query += ' AND d.verified = ?';
      params.push(filters.verified);
    }
    
    if (filters?.hospital) {
      query += ' AND d.hospital_affiliation LIKE ?';
      params.push(`%${filters.hospital}%`);
    }
    
    query += ' LIMIT ?';
    params.push(limit);
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
  }

  // Count total doctors
  async count(verified?: boolean): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM doctors';
    const params: any[] = [];

    if (verified !== undefined) {
      query += ' WHERE verified = ?';
      params.push(verified);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows[0].total;
  }

  // Get top-rated doctors (admin dashboard)
  async getTopRated(limit: number = 5): Promise<any[]> {
    const query = `
      SELECT 
        u.user_id, u.first_name, u.last_name, u.email, u.profile_picture,
        d.doctor_id, d.specialty, d.verified, d.rating, d.total_ratings
      FROM doctors d
      JOIN users u ON u.user_id = d.user_id
      WHERE u.is_active = true AND d.rating IS NOT NULL
      ORDER BY d.rating DESC, d.total_ratings DESC, u.last_name ASC
      LIMIT ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [limit]);
    return rows;
  }
}

export default new DoctorRepository();