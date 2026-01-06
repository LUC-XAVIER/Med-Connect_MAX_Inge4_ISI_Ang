import recordRepository from '../repositories/recordRepository';
import patientRepository from '../repositories/patientRepository';
import uploadService from './uploadService';
import { ICreateMedicalRecord } from '../models/mongodb/Record';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import logger from '../utils/logger';

export class RecordService {
  // Upload new medical record
  async uploadRecord(
    patientId: number,
    file: Express.Multer.File,
    metadata: {
      title: string;
      description?: string;
      record_type: string;
      record_date: Date;
    },
    uploadedBy: number
  ): Promise<any> {
    // Verify patient exists
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', HTTP_STATUS.NOT_FOUND);
    }

    // Validate file type
    if (!uploadService.validateFileType(file.mimetype)) {
      throw new AppError(
        'Invalid file type. Only PDF, JPG, and PNG files are allowed.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate file size
    if (!uploadService.validateFileSize(file.size)) {
      throw new AppError(
        `File size exceeds maximum limit of ${Math.floor(parseInt(process.env.MAX_FILE_SIZE || '10485760') / 1024 / 1024)}MB`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Upload file to local storage
    const fileUrl = await uploadService.uploadToLocal(file, `patient-${patientId}`);

    // Create record in MongoDB
    const recordData: ICreateMedicalRecord = {
      patient_id: patientId,
      title: metadata.title,
      description: metadata.description,
      record_type: metadata.record_type as any,
      file_url: fileUrl,
      file_name: file.originalname,
      file_size: file.size,
      file_format: file.mimetype,
      record_date: metadata.record_date,
      uploaded_by: uploadedBy,
    };

    const record = await recordRepository.create(recordData);

    logger.info(`Medical record uploaded: patient_id=${patientId}, record_id=${record._id}`);

    // Map _id to record_id for frontend compatibility
    return {
      ...record,
      record_id: record._id || record.record_id,
    };
  }

  // Get all records for a patient
  async getPatientRecords(
    patientId: number,
    filters?: {
      record_type?: string;
      start_date?: Date;
      end_date?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const records = await recordRepository.findByPatientId(patientId, {
      record_type: filters?.record_type,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      limit,
      skip,
    });

    const total = await recordRepository.countByPatientId(patientId);
    const recordsByType = await recordRepository.getRecordsByType(patientId);

    // Ensure all records have record_id mapped from _id
    const mappedRecords = records.map(record => ({
      ...record,
      record_id: record._id || record.record_id,
    }));

    return {
      records: mappedRecords,
      statistics: {
        total,
        by_type: recordsByType,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single record
  async getRecordById(recordId: string, requesterId: number, requesterRole: string): Promise<any> {
    const record = await recordRepository.findById(recordId);

    if (!record) {
      throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify access rights
    if (requesterRole === 'patient' && record.patient_id !== requesterId) {
      throw new AppError('Unauthorized access', HTTP_STATUS.FORBIDDEN);
    }

    // TODO: For doctors, verify connection exists

    return record;
  }

  // Search records
  async searchRecords(patientId: number, searchTerm: string): Promise<any> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new AppError('Search term must be at least 2 characters', HTTP_STATUS.BAD_REQUEST);
    }

    return await recordRepository.search(patientId, searchTerm.trim());
  }

  // Update record metadata
  async updateRecord(
    recordId: string,
    patientId: number,
    updates: {
      title?: string;
      description?: string;
      record_type?: string;
      record_date?: Date;
      tags?: string[];
    }
  ): Promise<any> {
    const record = await recordRepository.findById(recordId);

    if (!record) {
      throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify ownership
    if (record.patient_id !== patientId) {
      throw new AppError('Unauthorized access', HTTP_STATUS.FORBIDDEN);
    }

    const updatedRecord = await recordRepository.update(recordId, updates as any);

    logger.info(`Medical record updated: record_id=${recordId}`);

    return updatedRecord;
  }

  // Delete record
  async deleteRecord(recordId: string, patientId: number): Promise<void> {
    const record = await recordRepository.findById(recordId);

    if (!record) {
      throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify ownership
    if (record.patient_id !== patientId) {
      throw new AppError('Unauthorized access', HTTP_STATUS.FORBIDDEN);
    }

    // Delete file from local storage
    try {
      await uploadService.deleteFromLocal(record.file_url);
    } catch (error) {
      logger.error(`Failed to delete file from local storage: ${error}`);
      // Continue with soft delete even if file deletion fails
    }

    // Soft delete in MongoDB
    await recordRepository.softDelete(recordId);

    logger.info(`Medical record deleted: record_id=${recordId}`);
  }
}

export default new RecordService();