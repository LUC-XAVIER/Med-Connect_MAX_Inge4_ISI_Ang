import pool from '../config/mysql';
import { IPatient } from '../models/mysql/Patient';
import { RowDataPacket } from 'mysql2';

export class PatientRepository {
  // Get patient by ID
  async findById(patientId: number): Promise<IPatient | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM patients WHERE patient_id = ?',
      [patientId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IPatient;
  }

  // Get patient by user_id
  async findByUserId(userId: number): Promise<IPatient | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM patients WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IPatient;
  }

  // Get complete patient profile (user + patient info)
  async getCompleteProfile(userId: number): Promise<any> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.user_id, u.first_name, u.last_name, u.email, u.role, 
        u.contact, u.address, u.is_active, u.created_at as user_created_at,
        p.patient_id, p.dob, p.gender, p.bloodtype, p.created_at as patient_created_at
      FROM users u
      JOIN patients p ON u.user_id = p.user_id
      WHERE u.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  // Update patient profile
  async update(patientId: number, updates: Partial<IPatient>): Promise<IPatient> {
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'patient_id' && key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(patientId);

    await pool.query(
      `UPDATE patients SET ${fields.join(', ')} WHERE patient_id = ?`,
      values
    );

    const updatedPatient = await this.findById(patientId);
    
    if (!updatedPatient) {
      throw new Error('Patient not found after update');
    }

    return updatedPatient;
  }

  // Delete patient (cascade will delete user)
  async delete(patientId: number): Promise<void> {
    await pool.query('DELETE FROM patients WHERE patient_id = ?', [patientId]);
  }

  // Get all patients (for admin)
  async getAll(limit: number = 50, offset: number = 0): Promise<IPatient[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM patients LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return rows as IPatient[];
  }

  // Count total patients
  async count(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM patients'
    );

    return rows[0].total;
  }
}

export default new PatientRepository();