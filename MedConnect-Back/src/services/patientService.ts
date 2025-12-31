import patientRepository from '../repositories/patientRepository';
import userRepository from '../repositories/userRepository';
import { IPatient } from '../models/mysql/Patient';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class PatientService {
  // Get patient profile by user_id
  async getProfile(userId: number): Promise<any> {
    const profile = await patientRepository.getCompleteProfile(userId);

    if (!profile) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return profile;
  }

  // Get patient by patient_id
  async getPatientById(patientId: number): Promise<IPatient> {
    const patient = await patientRepository.findById(patientId);

    if (!patient) {
      throw new AppError('Patient not found', HTTP_STATUS.NOT_FOUND);
    }

    return patient;
  }

  // Update patient profile
  async updateProfile(
    userId: number,
    updates: {
      // User fields
      first_name?: string;
      last_name?: string;
      contact?: string;
      address?: string;
      // Patient fields
      dob?: Date;
      gender?: 'male' | 'female' | 'other';
      bloodtype?: string;
    }
  ): Promise<any> {
    // Get patient
    const patient = await patientRepository.findByUserId(userId);
    if (!patient) {
      throw new AppError('Patient not found', HTTP_STATUS.NOT_FOUND);
    }

    // Separate user updates and patient updates
    const userUpdates: any = {};
    const patientUpdates: any = {};

    if (updates.first_name) userUpdates.first_name = updates.first_name;
    if (updates.last_name) userUpdates.last_name = updates.last_name;
    if (updates.contact) userUpdates.contact = updates.contact;
    if (updates.address) userUpdates.address = updates.address;

    if (updates.dob) patientUpdates.dob = updates.dob;
    if (updates.gender) patientUpdates.gender = updates.gender;
    if (updates.bloodtype) patientUpdates.bloodtype = updates.bloodtype;

    // Update user info if there are user updates
    if (Object.keys(userUpdates).length > 0) {
      await userRepository.update(userId, userUpdates);
    }

    // Update patient info if there are patient updates
    if (Object.keys(patientUpdates).length > 0) {
      await patientRepository.update(patient.patient_id, patientUpdates);
    }

    logger.info(`Patient profile updated: user_id=${userId}`);

    // Return updated complete profile
    return await patientRepository.getCompleteProfile(userId);
  }

  // Get all patients (admin only)
  async getAllPatients(page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    const patients = await patientRepository.getAll(limit, offset);
    const total = await patientRepository.count();

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Delete patient (soft delete user)
  async deleteProfile(userId: number): Promise<void> {
    await userRepository.softDelete(userId);
    logger.info(`Patient account deactivated: user_id=${userId}`);
  }
}

export default new PatientService();