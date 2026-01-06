import pool from '../config/mysql';
import { IUser, ICreateUser } from '../models/mysql/User';
import { ICreatePatient, IPatient } from '../models/mysql/Patient';
import { ICreateDoctor, IDoctor } from '../models/mysql/Doctor';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UserRepository {
  // Find user by email
  async findByEmail(email: string): Promise<IUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IUser;
  }

  // Find user by ID
  async findById(userId: number): Promise<IUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IUser;
  }

  // Create new user
  async create(userData: Omit<ICreateUser, 'password'> & { password_hash: string }): Promise<IUser> {
    const { first_name, last_name, email, password_hash, role, contact, address } = userData;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, contact, address, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, password_hash, role, contact || null, address || null, true]
    );

    const newUser = await this.findById(result.insertId);
    
    if (!newUser) {
      throw new Error('Failed to create user');
    }

    return newUser;
  }

  // Create patient profile
  async createPatient(patientData: ICreatePatient): Promise<IPatient> {
    const { user_id, dob, gender, bloodtype } = patientData;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO patients (user_id, dob, gender, bloodtype) VALUES (?, ?, ?, ?)',
      [user_id, dob, gender, bloodtype || null]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM patients WHERE patient_id = ?',
      [result.insertId]
    );

    return rows[0] as IPatient;
  }

  // Create doctor profile
  async createDoctor(doctorData: ICreateDoctor): Promise<IDoctor> {
    const { user_id, specialty, license_number, hospital_affiliation, bio } = doctorData;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO doctors (user_id, specialty, license_number, hospital_affiliation, verified, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, specialty, license_number, hospital_affiliation || null, false, bio || null]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM doctors WHERE doctor_id = ?',
      [result.insertId]
    );

    return rows[0] as IDoctor;
  }

  // Get patient profile by user_id
  async getPatientByUserId(userId: number): Promise<IPatient | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM patients WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IPatient;
  }

  // Get doctor profile by user_id
  async getDoctorByUserId(userId: number): Promise<IDoctor | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM doctors WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IDoctor;
  }

  // Check if license number exists
  async licenseExists(licenseNumber: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT doctor_id FROM doctors WHERE license_number = ?',
      [licenseNumber]
    );

    return rows.length > 0;
  }

  // Update user
  async update(userId: number, updates: Partial<IUser>): Promise<IUser> {
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    const updatedUser = await this.findById(userId);
    
    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  }

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    return rows.length > 0;
  }

  // Delete user (soft delete by setting is_active to false)
  async softDelete(userId: number): Promise<void> {
    await pool.query(
      'UPDATE users SET is_active = false WHERE user_id = ?',
      [userId]
    );
  }
}

export default new UserRepository();