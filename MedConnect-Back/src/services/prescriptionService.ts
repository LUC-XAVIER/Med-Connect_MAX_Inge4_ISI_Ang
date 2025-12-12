import prescriptionRepository from '../repositories/prescriptionRepository';
import patientRepository from '../repositories/patientRepository';
import doctorRepository from '../repositories/doctorRepository';
import connectionRepository from '../repositories/connectionRepository';
import { ICreatePrescription } from '../models/mysql/Prescription';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class PrescriptionService {
  // Create prescription (doctor only)
  async createPrescription(doctorUserId: number, prescriptionData: ICreatePrescription): Promise<any> {
    // Get doctor
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor profile not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify patient exists
    const patient = await patientRepository.findById(prescriptionData.patient_id);
    if (!patient) {
      throw new AppError('Patient not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if connection exists and is approved
    const isConnected = await connectionRepository.isApproved(prescriptionData.patient_id, doctor.doctor_id);
    if (!isConnected) {
      throw new AppError('You can only prescribe to connected patients', HTTP_STATUS.FORBIDDEN);
    }

    // Set doctor_id
    prescriptionData.doctor_id = doctor.doctor_id;

    // Create prescription
    const prescription = await prescriptionRepository.create(prescriptionData);

    logger.info(`Prescription created: prescription_id=${prescription.prescription_id}`);

    return await prescriptionRepository.findById(prescription.prescription_id);
  }

  // Get prescription by ID
  async getPrescriptionById(prescriptionId: number, userId: number, userRole: string): Promise<any> {
    const prescription = await prescriptionRepository.findById(prescriptionId);

    if (!prescription) {
      throw new AppError('Prescription not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify access rights
    if (userRole === 'patient') {
      const patient = await patientRepository.findByUserId(userId);
      if (!patient || patient.patient_id !== prescription.patient_id) {
        throw new AppError('Unauthorized access', HTTP_STATUS.FORBIDDEN);
      }
    } else if (userRole === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor || doctor.doctor_id !== prescription.doctor_id) {
        throw new AppError('Unauthorized access', HTTP_STATUS.FORBIDDEN);
      }
    }

    return prescription;
  }

  // Get patient's prescriptions
  async getPatientPrescriptions(patientUserId: number): Promise<any[]> {
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return await prescriptionRepository.findByPatientId(patient.patient_id);
  }

  // Get doctor's prescriptions
  async getDoctorPrescriptions(doctorUserId: number): Promise<any[]> {
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return await prescriptionRepository.findByDoctorId(doctor.doctor_id);
  }

  // Update prescription status
  async updateStatus(prescriptionId: number, status: string, userId: number, userRole: string): Promise<void> {
    const prescription = await prescriptionRepository.findById(prescriptionId);

    if (!prescription) {
      throw new AppError('Prescription not found', HTTP_STATUS.NOT_FOUND);
    }

    // Only doctor who created it can update status
    if (userRole === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor || doctor.doctor_id !== prescription.doctor_id) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
      }
    } else {
      throw new AppError('Only doctors can update prescription status', HTTP_STATUS.FORBIDDEN);
    }

    await prescriptionRepository.updateStatus(prescriptionId, status);

    logger.info(`Prescription status updated: prescription_id=${prescriptionId}, status=${status}`);
  }
}

export default new PrescriptionService();