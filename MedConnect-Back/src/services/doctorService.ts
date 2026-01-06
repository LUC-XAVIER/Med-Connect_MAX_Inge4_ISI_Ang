import doctorRepository from '../repositories/doctorRepository';
import userRepository from '../repositories/userRepository';
import patientRepository from '../repositories/patientRepository';
import { IDoctor } from '../models/mysql/Doctor';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class DoctorService {
  // Get doctor profile by user_id
  async getProfile(userId: number): Promise<any> {
    const profile = await doctorRepository.getCompleteProfile(userId);

    if (!profile) {
      throw new AppError('Doctor profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return profile;
  }

  // Get doctor by doctor_id
  async getDoctorById(doctorId: number): Promise<IDoctor> {
    const doctor = await doctorRepository.findById(doctorId);

    if (!doctor) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    return doctor;
  }

  // Update doctor profile
  async updateProfile(
    userId: number,
    updates: {
      // User fields
      first_name?: string;
      last_name?: string;
      contact?: string;
      address?: string;
      // Doctor fields
      specialty?: string;
      hospital_affiliation?: string;
      bio?: string;
    }
  ): Promise<any> {
    // Get doctor
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    // Separate user updates and doctor updates
    const userUpdates: any = {};
    const doctorUpdates: any = {};

    if (updates.first_name) userUpdates.first_name = updates.first_name;
    if (updates.last_name) userUpdates.last_name = updates.last_name;
    if (updates.contact) userUpdates.contact = updates.contact;
    if (updates.address) userUpdates.address = updates.address;

    if (updates.specialty) doctorUpdates.specialty = updates.specialty;
    if (updates.hospital_affiliation) doctorUpdates.hospital_affiliation = updates.hospital_affiliation;
    if (updates.bio) doctorUpdates.bio = updates.bio;

    // Update user info if there are user updates
    if (Object.keys(userUpdates).length > 0) {
      await userRepository.update(userId, userUpdates);
    }

    // Update doctor info if there are doctor updates
    if (Object.keys(doctorUpdates).length > 0) {
      await doctorRepository.update(doctor.doctor_id, doctorUpdates);
    }

    logger.info(`Doctor profile updated: user_id=${userId}`);

    // Return updated complete profile
    return await doctorRepository.getCompleteProfile(userId);
  }

  // Get all doctors with filters
  async getAllDoctors(filters: {
    specialty?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { specialty, verified, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const doctors = await doctorRepository.getAll({
      specialty,
      verified,
      limit,
      offset,
    });

    const total = await doctorRepository.count(verified);

    return {
      doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Search doctors with filters
  async searchDoctors(
    searchTerm: string = '', 
    filters?: { specialty?: string; verified?: boolean; hospital?: string },
    limit: number = 20
  ): Promise<any[]> {
    // Allow empty search term if filters are provided
    if (!searchTerm && !filters) {
      return [];
    }

    return await doctorRepository.search(searchTerm.trim(), filters, limit);
  }

  // Verify doctor (admin only)
  async verifyDoctor(doctorId: number): Promise<void> {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    if (doctor.verified) {
      throw new AppError('Doctor is already verified', HTTP_STATUS.BAD_REQUEST);
    }

    await doctorRepository.verify(doctorId);
    logger.info(`Doctor verified: doctor_id=${doctorId}`);
  }

  // Admin stats for dashboard
  async getAdminStats(): Promise<{
    totalDoctors: number;
    verifiedDoctors: number;
    unverifiedDoctors: number;
    totalPatients: number;
  }> {
    const [totalDoctors, verifiedDoctors, totalPatients] = await Promise.all([
      doctorRepository.count(),
      doctorRepository.count(true),
      patientRepository.count()
    ]);

    return {
      totalDoctors,
      verifiedDoctors,
      unverifiedDoctors: totalDoctors - verifiedDoctors,
      totalPatients
    };
  }

  // Top rated doctors (for admin dashboard)
  async getTopRatedDoctors(limit: number = 5): Promise<any[]> {
    return await doctorRepository.getTopRated(limit);
  }

  // Delete doctor (soft delete user)
  async deleteProfile(userId: number): Promise<void> {
    await userRepository.softDelete(userId);
    logger.info(`Doctor account deactivated: user_id=${userId}`);
  }
}

export default new DoctorService();