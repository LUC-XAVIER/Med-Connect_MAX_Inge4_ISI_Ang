import pool from '../config/mysql';
import { 
  IPrescription, 
  IPrescriptionMedication, 
  ICreatePrescription,
  IPrescriptionWithDetails 
} from '../models/mysql/Prescription';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class PrescriptionRepository {
  // Create prescription with medications
  async create(prescriptionData: ICreatePrescription): Promise<IPrescription> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create prescription
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO prescriptions (patient_id, doctor_id, diagnosis, notes, status) 
         VALUES (?, ?, ?, ?, 'active')`,
        [prescriptionData.patient_id, prescriptionData.doctor_id, prescriptionData.diagnosis, prescriptionData.notes || null]
      );

      const prescriptionId = result.insertId;

      // Create medications
      for (const med of prescriptionData.medications) {
        await connection.query(
          `INSERT INTO prescription_medications 
           (prescription_id, medication_name, dosage, frequency, duration, instructions) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [prescriptionId, med.medication_name, med.dosage, med.frequency, med.duration, med.instructions || null]
        );
      }

      await connection.commit();

      const [prescription] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM prescriptions WHERE prescription_id = ?',
        [prescriptionId]
      );

      return prescription[0] as IPrescription;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get prescription by ID with medications
  async findById(prescriptionId: number): Promise<IPrescriptionWithDetails | null> {
    const [prescriptions] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.*,
        u_d.first_name as doctor_first_name,
        u_d.last_name as doctor_last_name,
        d.specialty as doctor_specialty,
        u_p.first_name as patient_first_name,
        u_p.last_name as patient_last_name
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.doctor_id
      JOIN users u_d ON d.user_id = u_d.user_id
      JOIN patients pt ON p.patient_id = pt.patient_id
      JOIN users u_p ON pt.user_id = u_p.user_id
      WHERE p.prescription_id = ?`,
      [prescriptionId]
    );

    if (prescriptions.length === 0) {
      return null;
    }

    const prescription = prescriptions[0] as IPrescriptionWithDetails;

    // Get medications
    const [medications] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM prescription_medications WHERE prescription_id = ?',
      [prescriptionId]
    );

    prescription.medications = medications as IPrescriptionMedication[];

    return prescription;
  }

  // Get all prescriptions for a patient
  async findByPatientId(patientId: number): Promise<IPrescriptionWithDetails[]> {
    const [prescriptions] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.*,
        u_d.first_name as doctor_first_name,
        u_d.last_name as doctor_last_name,
        d.specialty as doctor_specialty
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.doctor_id
      JOIN users u_d ON d.user_id = u_d.user_id
      WHERE p.patient_id = ?
      ORDER BY p.prescribed_date DESC`,
      [patientId]
    );

    // Get medications for each prescription
    for (const prescription of prescriptions) {
      const [medications] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM prescription_medications WHERE prescription_id = ?',
        [prescription.prescription_id]
      );

      prescription.medications = medications;
    }

    return prescriptions as IPrescriptionWithDetails[];
  }

  // Get all prescriptions for a doctor
  async findByDoctorId(doctorId: number): Promise<IPrescriptionWithDetails[]> {
    const [prescriptions] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.*,
        u_p.first_name as patient_first_name,
        u_p.last_name as patient_last_name
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.patient_id
      JOIN users u_p ON pt.user_id = u_p.user_id
      WHERE p.doctor_id = ?
      ORDER BY p.prescribed_date DESC`,
      [doctorId]
    );

    // Get medications for each prescription
    for (const prescription of prescriptions) {
      const [medications] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM prescription_medications WHERE prescription_id = ?',
        [prescription.prescription_id]
      );

      prescription.medications = medications;
    }

    return prescriptions as IPrescriptionWithDetails[];
  }

  // Update prescription status
  async updateStatus(prescriptionId: number, status: string): Promise<void> {
    await pool.query(
      'UPDATE prescriptions SET status = ?, updated_at = NOW() WHERE prescription_id = ?',
      [status, prescriptionId]
    );
  }

  // Delete prescription
  async delete(prescriptionId: number): Promise<void> {
    await pool.query('DELETE FROM prescriptions WHERE prescription_id = ?', [prescriptionId]);
  }
}

export default new PrescriptionRepository();