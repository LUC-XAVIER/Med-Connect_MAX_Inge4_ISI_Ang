import appointmentRepository from '../repositories/appointmentRepository';
import patientRepository from '../repositories/patientRepository';
import doctorRepository from '../repositories/doctorRepository';
import connectionRepository from '../repositories/connectionRepository';
import { ICreateAppointment } from '../models/mysql/Appointment';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class AppointmentService {
  // Create appointment (patient books with doctor)
  async createAppointment(patientUserId: number, appointmentData: ICreateAppointment): Promise<any> {
    // Get patient
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify doctor exists
    const doctor = await doctorRepository.findById(appointmentData.doctor_id);
    if (!doctor) {
      throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if connection exists and is approved
    const isConnected = await connectionRepository.isApproved(patient.patient_id, appointmentData.doctor_id);
    if (!isConnected) {
      throw new AppError('You can only book appointments with connected doctors', HTTP_STATUS.FORBIDDEN);
    }

    // Check if slot is available
    const isAvailable = await appointmentRepository.isSlotAvailable(
      appointmentData.doctor_id,
      appointmentData.appointment_date,
      appointmentData.appointment_time
    );

    if (!isAvailable) {
      throw new AppError('This time slot is not available', HTTP_STATUS.CONFLICT);
    }

    // Set patient_id
    appointmentData.patient_id = patient.patient_id;

    // Create appointment
    const appointment = await appointmentRepository.create(appointmentData);

    logger.info(`Appointment created: appointment_id=${appointment.appointment_id}`);

    return await appointmentRepository.findById(appointment.appointment_id);
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId: number, userId: number, userRole: string): Promise<any> {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify access rights
    if (userRole === 'patient') {
      const patient = await patientRepository.findByUserId(userId);
      if (!patient || patient.patient_id !== appointment.patient_id) {
        throw new AppError('Unauthorized access', HTTP_STATUS.FORBIDDEN);
      }
    } else if (userRole === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor || doctor.doctor_id !== appointment.doctor_id) {
        throw new AppError('Unauthorized access', HTTP_STATUS.FORBIDDEN);
      }
    }

    return appointment;
  }

  // Get patient's appointments
  async getPatientAppointments(patientUserId: number, status?: string): Promise<any[]> {
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return await appointmentRepository.findByPatientId(patient.patient_id, status);
  }

  // Get doctor's appointments
  async getDoctorAppointments(doctorUserId: number, status?: string): Promise<any[]> {
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return await appointmentRepository.findByDoctorId(doctor.doctor_id, status);
  }

  // Update appointment status
  async updateStatus(appointmentId: number, status: string, notes: string | undefined, userId: number, userRole: string): Promise<void> {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify user is part of the appointment
    if (userRole === 'patient') {
      const patient = await patientRepository.findByUserId(userId);
      if (!patient || patient.patient_id !== appointment.patient_id) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
      }
    } else if (userRole === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor || doctor.doctor_id !== appointment.doctor_id) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
      }
    }

    await appointmentRepository.updateStatus(appointmentId, status, notes);

    logger.info(`Appointment status updated: appointment_id=${appointmentId}, status=${status}`);
  }

  // Reschedule appointment
  async rescheduleAppointment(
    appointmentId: number,
    newDate: Date,
    newTime: string,
    userId: number,
    userRole: string
  ): Promise<any> {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify user is part of the appointment
    if (userRole === 'patient') {
      const patient = await patientRepository.findByUserId(userId);
      if (!patient || patient.patient_id !== appointment.patient_id) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
      }
    } else if (userRole === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (!doctor || doctor.doctor_id !== appointment.doctor_id) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
      }
    }

    // Check if new slot is available
    const isAvailable = await appointmentRepository.isSlotAvailable(
      appointment.doctor_id,
      newDate,
      newTime,
      appointmentId
    );

    if (!isAvailable) {
      throw new AppError('This time slot is not available', HTTP_STATUS.CONFLICT);
    }

    // Update appointment
    await appointmentRepository.update(appointmentId, {
      appointment_date: newDate,
      appointment_time: newTime,
      status: 'scheduled',
    });

    logger.info(`Appointment rescheduled: appointment_id=${appointmentId}`);

    return await appointmentRepository.findById(appointmentId);
  }

  // Cancel appointment
  async cancelAppointment(appointmentId: number, userId: number, userRole: string): Promise<void> {
    await this.updateStatus(appointmentId, 'cancelled', undefined, userId, userRole);
  }
}

export default new AppointmentService();