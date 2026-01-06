import pool from '../config/mysql';
import { IAppointment, ICreateAppointment, IAppointmentWithDetails } from '../models/mysql/Appointment';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AppointmentRepository {
  // Create appointment
  async create(appointmentData: ICreateAppointment): Promise<IAppointment> {
    const { patient_id, doctor_id, appointment_date, appointment_time, duration, reason } = appointmentData;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO appointments 
       (patient_id, doctor_id, appointment_date, appointment_time, duration, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
      [patient_id, doctor_id, appointment_date, appointment_time, duration || 30, reason || null]
    );

    const [appointment] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM appointments WHERE appointment_id = ?',
      [result.insertId]
    );

    return appointment[0] as IAppointment;
  }

  // Get appointment by ID
  async findById(appointmentId: number): Promise<IAppointmentWithDetails | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        a.*,
        u_d.first_name as doctor_first_name,
        u_d.last_name as doctor_last_name,
        d.specialty as doctor_specialty,
        u_d.contact as doctor_contact,
        u_p.first_name as patient_first_name,
        u_p.last_name as patient_last_name,
        u_p.contact as patient_contact
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN users u_d ON d.user_id = u_d.user_id
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u_p ON p.user_id = u_p.user_id
      WHERE a.appointment_id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IAppointmentWithDetails;
  }

  // Get all appointments for a patient
  async findByPatientId(patientId: number, status?: string): Promise<IAppointmentWithDetails[]> {
    let query = `
      SELECT 
        a.*,
        u_d.first_name as doctor_first_name,
        u_d.last_name as doctor_last_name,
        d.specialty as doctor_specialty,
        u_d.contact as doctor_contact
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN users u_d ON d.user_id = u_d.user_id
      WHERE a.patient_id = ?
    `;

    const params: any[] = [patientId];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows as IAppointmentWithDetails[];
  }

  // Get all appointments for a doctor
  async findByDoctorId(doctorId: number, status?: string): Promise<IAppointmentWithDetails[]> {
    let query = `
      SELECT 
        a.*,
        u_p.first_name as patient_first_name,
        u_p.last_name as patient_last_name,
        u_p.contact as patient_contact
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u_p ON p.user_id = u_p.user_id
      WHERE a.doctor_id = ?
    `;

    const params: any[] = [doctorId];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows as IAppointmentWithDetails[];
  }

  // Check if slot is available
  async isSlotAvailable(doctorId: number, appointmentDate: Date, appointmentTime: string, excludeId?: number): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctor_id = ? 
      AND appointment_date = ? 
      AND appointment_time = ? 
      AND status NOT IN ('cancelled', 'no_show')
    `;

    const params: any[] = [doctorId, appointmentDate, appointmentTime];

    if (excludeId) {
      query += ' AND appointment_id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows[0].count === 0;
  }

  // Update appointment status
  async updateStatus(appointmentId: number, status: string, notes?: string): Promise<void> {
    await pool.query(
      'UPDATE appointments SET status = ?, notes = ?, updated_at = NOW() WHERE appointment_id = ?',
      [status, notes || null, appointmentId]
    );
  }

  // Update appointment
  async update(appointmentId: number, updates: Partial<IAppointment>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'appointment_id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return;
    }

    values.push(appointmentId);

    await pool.query(
      `UPDATE appointments SET ${fields.join(', ')}, updated_at = NOW() WHERE appointment_id = ?`,
      values
    );
  }

  // Delete appointment
  async delete(appointmentId: number): Promise<void> {
    await pool.query('DELETE FROM appointments WHERE appointment_id = ?', [appointmentId]);
  }
}

export default new AppointmentRepository();