import pool from '../config/mysql';
import { IConnection, ICreateConnection, IConnectionWithDetails } from '../models/mysql/Connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ConnectionRepository {
  // Create connection request
  async create(connectionData: ICreateConnection): Promise<IConnection> {
    const { patient_id, doctor_id, status = 'pending' } = connectionData;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO connections (patient_id, doctor_id, status, request_date) VALUES (?, ?, ?, NOW())',
      [patient_id, doctor_id, status]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM connections WHERE connection_id = ?',
      [result.insertId]
    );

    return rows[0] as IConnection;
  }

  // Find connection by ID
  async findById(connectionId: number): Promise<IConnection | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM connections WHERE connection_id = ?',
      [connectionId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IConnection;
  }

  // Find connection between patient and doctor
  async findByPatientAndDoctor(patientId: number, doctorId: number): Promise<IConnection | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM connections WHERE patient_id = ? AND doctor_id = ?',
      [patientId, doctorId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IConnection;
  }

  // Get all connections for a patient (with doctor details)
  async getPatientConnections(patientId: number, status?: string): Promise<IConnectionWithDetails[]> {
    let query = `
      SELECT 
        c.*,
        u_d.first_name as doctor_first_name,
        u_d.last_name as doctor_last_name,
        u_d.email as doctor_email,
        d.specialty as doctor_specialty,
        d.hospital_affiliation as doctor_hospital,
        d.verified as doctor_verified
      FROM connections c
      JOIN doctors d ON c.doctor_id = d.doctor_id
      JOIN users u_d ON d.user_id = u_d.user_id
      WHERE c.patient_id = ?
    `;

    const params: any[] = [patientId];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows as IConnectionWithDetails[];
  }

  // Get all connections for a doctor (with patient details)
  async getDoctorConnections(doctorId: number, status?: string): Promise<IConnectionWithDetails[]> {
    let query = `
      SELECT 
        c.*,
        u_p.first_name as patient_first_name,
        u_p.last_name as patient_last_name,
        u_p.email as patient_email,
        p.dob as patient_dob,
        p.gender as patient_gender,
        p.bloodtype as patient_bloodtype
      FROM connections c
      JOIN patients p ON c.patient_id = p.patient_id
      JOIN users u_p ON p.user_id = u_p.user_id
      WHERE c.doctor_id = ?
    `;

    const params: any[] = [doctorId];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows as IConnectionWithDetails[];
  }

  // Update connection status
  async updateStatus(
    connectionId: number,
    status: 'pending' | 'approved' | 'rejected' | 'revoked'
  ): Promise<IConnection> {
    await pool.query(
      'UPDATE connections SET status = ?, response_date = NOW() WHERE connection_id = ?',
      [status, connectionId]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM connections WHERE connection_id = ?',
      [connectionId]
    );

    return rows[0] as IConnection;
  }

  // Check if connection exists and is approved
  async isApproved(patientId: number, doctorId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT connection_id FROM connections WHERE patient_id = ? AND doctor_id = ? AND status = ?',
      [patientId, doctorId, 'approved']
    );

    return rows.length > 0;
  }

  // Delete connection
  async delete(connectionId: number): Promise<void> {
    await pool.query('DELETE FROM connections WHERE connection_id = ?', [connectionId]);
  }

  // Share specific record with doctor
  async shareRecord(connectionId: number, recordId: string): Promise<void> {
    // Check if record is already shared
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM shared_records WHERE connection_id = ? AND record_id = ?',
      [connectionId, recordId]
    );

    if (existing.length > 0) {
      return; // Already shared
    }

    await pool.query(
      'INSERT INTO shared_records (connection_id, record_id, shared_at) VALUES (?, ?, NOW())',
      [connectionId, recordId]
    );
  }

  // Unshare specific record from doctor
  async unshareRecord(connectionId: number, recordId: string): Promise<void> {
    await pool.query(
      'DELETE FROM shared_records WHERE connection_id = ? AND record_id = ?',
      [connectionId, recordId]
    );
  }

  // Get shared records for a connection
  async getSharedRecords(connectionId: number): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT record_id FROM shared_records WHERE connection_id = ?',
      [connectionId]
    );

    return rows.map(row => row.record_id);
  }

  // Check if specific record is shared
  async isRecordShared(connectionId: number, recordId: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM shared_records WHERE connection_id = ? AND record_id = ?',
      [connectionId, recordId]
    );

    return rows.length > 0;
  }

  // Share all records with doctor (mark connection as share_all)
  async shareAllRecords(connectionId: number): Promise<void> {
    // We can add a column to connections table or use a convention
    // For now, we'll delete all individual shares to indicate "share all"
    await pool.query(
      'DELETE FROM shared_records WHERE connection_id = ?',
      [connectionId]
    );
  }
}

export default new ConnectionRepository();