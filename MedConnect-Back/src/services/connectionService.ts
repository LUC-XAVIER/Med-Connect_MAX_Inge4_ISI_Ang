import connectionRepository from '../repositories/connectionRepository';
import patientRepository from '../repositories/patientRepository';
import doctorRepository from '../repositories/doctorRepository';
import recordRepository from '../repositories/recordRepository';
import { AppError } from '@middleware/errorHandler';
import { HTTP_STATUS } from '@utils/constants';
import logger from '../utils/logger';

export class ConnectionService {
  // Patient sends connection request to doctor
  async requestConnection(doctorUserId: number, patientUserId: number): Promise<any> {
    // Get patient profile - verify requester is a valid patient
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get doctor profile
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor profile not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if doctor is verified (doctors must be verified to receive requests)
    if (!doctor.verified) {
      throw new AppError('This doctor is not yet verified and cannot accept connection requests', HTTP_STATUS.FORBIDDEN);
    }

    // Check if connection already exists
    const existingConnection = await connectionRepository.findByPatientAndDoctor(
        patient.patient_id,
        doctor.doctor_id
    );

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        throw new AppError('Connection request already pending', HTTP_STATUS.CONFLICT);
      }
      if (existingConnection.status === 'approved') {
        throw new AppError('Connection already approved', HTTP_STATUS.CONFLICT);
      }
      if (existingConnection.status === 'rejected' || existingConnection.status === 'revoked') {
        // Update to pending (allow re-request)
        const updated = await connectionRepository.updateStatus(existingConnection.connection_id, 'pending');
        logger.info(`Connection re-requested: doctor_id=${doctor.doctor_id}, patient_id=${patient.patient_id}`);
        return updated;
      }
    }

    // Create connection request
    const connection = await connectionRepository.create({
      patient_id: patient.patient_id,
      doctor_id: doctor.doctor_id,
      status: 'pending',
    });

    logger.info(`Connection request created: doctor_id=${doctor.doctor_id}, patient_id=${patient.patient_id}`);

    return connection;
  }
  // Doctor approves connection request
  async approveConnection(connectionId: number, doctorUserId: number): Promise<any> {
    const connection = await connectionRepository.findById(connectionId);

    if (!connection) {
      throw new AppError('Connection not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify doctor owns this connection
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor || doctor.doctor_id !== connection.doctor_id) {
      throw new AppError('Unauthorized: You can only approve your own connection requests', HTTP_STATUS.FORBIDDEN);
    }

    if (connection.status !== 'pending') {
      throw new AppError('Connection is not pending', HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await connectionRepository.updateStatus(connectionId, 'approved');

    logger.info(`Connection approved: connection_id=${connectionId}`);

    return updated;
  }

  // Doctor rejects connection request
  async rejectConnection(connectionId: number, doctorUserId: number): Promise<any> {
    const connection = await connectionRepository.findById(connectionId);

    if (!connection) {
      throw new AppError('Connection not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify doctor owns this connection
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor || doctor.doctor_id !== connection.doctor_id) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }

    if (connection.status !== 'pending') {
      throw new AppError('Connection is not pending', HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await connectionRepository.updateStatus(connectionId, 'rejected');

    logger.info(`Connection rejected: connection_id=${connectionId}`);

    return updated;
  }

  // Doctor revokes connection (remove patient access)
  async revokeConnection(connectionId: number, doctorUserId: number): Promise<void> {
    const connection = await connectionRepository.findById(connectionId);

    if (!connection) {
      throw new AppError('Connection not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify doctor owns this connection
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor || doctor.doctor_id !== connection.doctor_id) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }

    if (connection.status !== 'approved') {
      throw new AppError('Connection is not approved', HTTP_STATUS.BAD_REQUEST);
    }

    await connectionRepository.updateStatus(connectionId, 'revoked');

    logger.info(`Connection revoked: connection_id=${connectionId}`);
  }

  // Get patient's connections
  async getPatientConnections(patientUserId: number, status?: string): Promise<any[]> {
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return await connectionRepository.getPatientConnections(patient.patient_id, status);
  }

  // Get doctor's connections
  async getDoctorConnections(doctorUserId: number, status?: string): Promise<any[]> {
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return await connectionRepository.getDoctorConnections(doctor.doctor_id, status);
  }

  // Share specific records with doctor
  async shareRecords(
      connectionId: number,
      recordIds: string[],
      patientUserId: number
  ): Promise<void> {
    const connection = await connectionRepository.findById(connectionId);

    if (!connection) {
      throw new AppError('Connection not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify patient owns this connection
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient || patient.patient_id !== connection.patient_id) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }

    if (connection.status !== 'approved') {
      throw new AppError('Connection must be approved first', HTTP_STATUS.BAD_REQUEST);
    }

    // Verify all records belong to patient
    for (const recordId of recordIds) {
      try {
        const record = await recordRepository.findById(recordId);
        if (!record || record.patient_id !== patient.patient_id) {
          throw new AppError(`Record ${recordId} not found or unauthorized`, HTTP_STATUS.FORBIDDEN);
        }
      } catch (error: any) {
        // If record not found, throw a more descriptive error
        if (error.message?.includes('not found')) {
          throw new AppError(`Record ${recordId} not found`, HTTP_STATUS.NOT_FOUND);
        }
        throw error;
      }
    }

    // Share each record
    for (const recordId of recordIds) {
      await connectionRepository.shareRecord(connectionId, recordId);
    }

    logger.info(`Records shared: connection_id=${connectionId}, count=${recordIds.length}`);
  }

  // Unshare specific records from doctor
  async unshareRecords(
      connectionId: number,
      recordIds: string[],
      patientUserId: number
  ): Promise<void> {
    const connection = await connectionRepository.findById(connectionId);

    if (!connection) {
      throw new AppError('Connection not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify patient owns this connection
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient || patient.patient_id !== connection.patient_id) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }

    // Unshare each record
    for (const recordId of recordIds) {
      await connectionRepository.unshareRecord(connectionId, recordId);
    }

    logger.info(`Records unshared: connection_id=${connectionId}, count=${recordIds.length}`);
  }

  // Share ALL records with doctor
  async shareAllRecords(connectionId: number, patientUserId: number): Promise<void> {
    const connection = await connectionRepository.findById(connectionId);

    if (!connection) {
      throw new AppError('Connection not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify patient owns this connection
    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient || patient.patient_id !== connection.patient_id) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }

    if (connection.status !== 'approved') {
      throw new AppError('Connection must be approved first', HTTP_STATUS.BAD_REQUEST);
    }

    // Clear specific shares (convention: no specific shares = share all)
    await connectionRepository.shareAllRecords(connectionId);

    logger.info(`All records shared: connection_id=${connectionId}`);
  }

  // Get shared records for a connection
  async getSharedRecords(connectionId: number, requesterId: number, requesterRole: string): Promise<any> {
    const connection = await connectionRepository.findById(connectionId);

    if (!connection) {
      throw new AppError('Connection not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify requester is part of this connection
    if (requesterRole === 'patient') {
      const patient = await patientRepository.findByUserId(requesterId);
      if (!patient || patient.patient_id !== connection.patient_id) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
      }
    } else if (requesterRole === 'doctor') {
      const doctor = await doctorRepository.findByUserId(requesterId);
      if (!doctor || doctor.doctor_id !== connection.doctor_id) {
        throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
      }
    }

    const sharedRecordIds = await connectionRepository.getSharedRecords(connectionId);

    // If no specific records shared, means "share all"
    if (sharedRecordIds.length === 0) {
      // Get all patient records
      const allRecords = await recordRepository.findByPatientId(connection.patient_id);
      return {
        share_all: true,
        records: allRecords,
      };
    }

    // Get specific shared records
    const records = [];
    for (const recordId of sharedRecordIds) {
      const record = await recordRepository.findById(recordId);
      if (record) {
        records.push(record);
      }
    }

    return {
      share_all: false,
      records,
    };
  }

  // Doctor views patient records (checks connection and sharing)
  async viewPatientRecords(doctorUserId: number, patientUserId: number): Promise<any> {
    const doctor = await doctorRepository.findByUserId(doctorUserId);
    if (!doctor) {
      throw new AppError('Doctor profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const patient = await patientRepository.findByUserId(patientUserId);
    if (!patient) {
      throw new AppError('Patient not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if approved connection exists
    const connection = await connectionRepository.findByPatientAndDoctor(
        patient.patient_id,
        doctor.doctor_id
    );

    if (!connection || connection.status !== 'approved') {
      throw new AppError('No approved connection with this patient', HTTP_STATUS.FORBIDDEN);
    }

    // Get shared records
    const sharedRecordIds = await connectionRepository.getSharedRecords(connection.connection_id);

    // If no specific records, share all
    if (sharedRecordIds.length === 0) {
      const allRecords = await recordRepository.findByPatientId(patient.patient_id);
      return {
        patient_info: patient,
        share_all: true,
        records: allRecords,
      };
    }

    // Get specific shared records
    const records = [];
    for (const recordId of sharedRecordIds) {
      const record = await recordRepository.findById(recordId);
      if (record) {
        records.push(record);
      }
    }

    return {
      patient_info: patient,
      share_all: false,
      records,
    };
  }
}

export default new ConnectionService();