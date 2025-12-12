import pool from '../config/mysql';
import { IDoctorRating, ICreateDoctorRating, IDoctorRatingWithDetails } from '../models/mysql/DoctorRating';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class DoctorRatingRepository {
  // Create or update rating
  async createOrUpdate(ratingData: ICreateDoctorRating): Promise<IDoctorRating> {
    const { doctor_id, patient_id, rating, review } = ratingData;

    // Check if rating already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT rating_id FROM doctor_ratings WHERE doctor_id = ? AND patient_id = ?',
      [doctor_id, patient_id]
    );

    if (existing.length > 0) {
      // Update existing rating
      await pool.query(
        'UPDATE doctor_ratings SET rating = ?, review = ?, updated_at = NOW() WHERE rating_id = ?',
        [rating, review || null, existing[0].rating_id]
      );

      const [updated] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM doctor_ratings WHERE rating_id = ?',
        [existing[0].rating_id]
      );

      return updated[0] as IDoctorRating;
    } else {
      // Create new rating
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO doctor_ratings (doctor_id, patient_id, rating, review) VALUES (?, ?, ?, ?)',
        [doctor_id, patient_id, rating, review || null]
      );

      const [newRating] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM doctor_ratings WHERE rating_id = ?',
        [result.insertId]
      );

      return newRating[0] as IDoctorRating;
    }
  }

  // Get all ratings for a doctor
  async findByDoctorId(doctorId: number): Promise<IDoctorRatingWithDetails[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        dr.*,
        u.first_name as patient_first_name,
        u.last_name as patient_last_name
      FROM doctor_ratings dr
      JOIN patients p ON dr.patient_id = p.patient_id
      JOIN users u ON p.user_id = u.user_id
      WHERE dr.doctor_id = ?
      ORDER BY dr.created_at DESC`,
      [doctorId]
    );

    return rows as IDoctorRatingWithDetails[];
  }

  // Calculate average rating for a doctor
  async calculateAverageRating(doctorId: number): Promise<{ average: number; total: number }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT AVG(rating) as average, COUNT(*) as total FROM doctor_ratings WHERE doctor_id = ?',
      [doctorId]
    );

    return {
      average: parseFloat(rows[0].average) || 0,
      total: rows[0].total || 0,
    };
  }

  // Update doctor's rating in doctors table
  async updateDoctorRating(doctorId: number): Promise<void> {
    const stats = await this.calculateAverageRating(doctorId);

    await pool.query(
      'UPDATE doctors SET rating = ?, total_ratings = ? WHERE doctor_id = ?',
      [stats.average, stats.total, doctorId]
    );
  }

  // Get patient's rating for a doctor
  async findByDoctorAndPatient(doctorId: number, patientId: number): Promise<IDoctorRating | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM doctor_ratings WHERE doctor_id = ? AND patient_id = ?',
      [doctorId, patientId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as IDoctorRating;
  }

  // Delete rating
  async delete(ratingId: number): Promise<void> {
    await pool.query('DELETE FROM doctor_ratings WHERE rating_id = ?', [ratingId]);
  }
}

export default new DoctorRatingRepository();