import doctorRatingRepository from '../repositories/doctorRatingRepository';
import connectionRepository from '../repositories/connectionRepository';
import patientRepository from '../repositories/patientRepository';
import doctorRepository from '../repositories/doctorRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class DoctorRatingService {
  // Rate a doctor
  async rateDoctor(patientUserId: number, doctorUserId: number, ratingData: { rating: number; review?: string }): Promise<any> {
    // Get patient
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get doctor
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if connection exists and is approved
    const isConnected = await connectionRepository.isApproved(patient.patient_id, doctor.doctor_id);
    if (!isConnected) {
      throw new AppError('You can only rate doctors you are connected with', HTTP_STATUS.FORBIDDEN);
    }

    // Validate rating (1-5)
    if (ratingData.rating < 1 || ratingData.rating > 5) {
      throw new AppError('Rating must be between 1 and 5', HTTP_STATUS.BAD_REQUEST);
    }

    // Create or update rating
    const rating = await doctorRatingRepository.createOrUpdate({
      doctor_id: doctor.doctor_id,
      patient_id: patient.patient_id,
      rating: ratingData.rating,
      review: ratingData.review,
    });

    // Update doctor's overall rating
    await doctorRatingRepository.updateDoctorRating(doctor.doctor_id);

    logger.info(`Doctor rated: doctor_id=${doctor.doctor_id}, patient_id=${patient.patient_id}, rating=${ratingData.rating}`);

    return rating;
  }

  // Get all ratings for a doctor
  async getDoctorRatings(doctorUserId: number): Promise<any> {
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    const ratings = await doctorRatingRepository.findByDoctorId(doctor.doctor_id);
    const stats = await doctorRatingRepository.calculateAverageRating(doctor.doctor_id);

    return {
      average_rating: stats.average,
      total_ratings: stats.total,
      ratings,
    };
  }

  // Get patient's rating for a doctor
  async getMyRating(patientUserId: number, doctorUserId: number): Promise<any> {
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    return await doctorRatingRepository.findByDoctorAndPatient(doctor.doctor_id, patient.patient_id);
  }
}

export default new DoctorRatingService();