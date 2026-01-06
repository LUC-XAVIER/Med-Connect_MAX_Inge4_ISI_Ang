import { Request, Response, NextFunction } from 'express';
import recordService from '../services/recordService';
import patientRepository from '../repositories/patientRepository';
import { HTTP_STATUS } from '../utils/constants';
// import { AppError } from '../middleware/errorHandler';

export class RecordController {
  // Upload medical record
  async uploadRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const file = req.file;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!file) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Get patient_id from user_id
      const patient = await patientRepository.findByUserId(userId);
      if (!patient) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Patient profile not found',
        });
        return;
      }

      const { title, description, record_type, record_date } = req.body;

      const record = await recordService.uploadRecord(
        patient.patient_id,
        file,
        {
          title,
          description,
          record_type,
          record_date: new Date(record_date),
        },
        userId
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Medical record uploaded successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all records for current patient
  async getMyRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get patient_id
      const patient = await patientRepository.findByUserId(userId);
      if (!patient) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Patient profile not found',
        });
        return;
      }

      const { record_type, start_date, end_date, page, limit } = req.query;

      const result = await recordService.getPatientRecords(patient.patient_id, {
        record_type: record_type as string,
        start_date: start_date ? new Date(start_date as string) : undefined,
        end_date: end_date ? new Date(end_date as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single record
  async getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const recordId = req.params.recordId;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get patient_id for patients
      let requesterId = userId;
      if (userRole === 'patient') {
        const patient = await patientRepository.findByUserId(userId);
        if (patient) {
          requesterId = patient.patient_id;
        }
      }

      const record = await recordService.getRecordById(recordId, requesterId, userRole);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  // Search records
  async searchRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const searchTerm = req.query.q as string;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const patient = await patientRepository.findByUserId(userId);
      if (!patient) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Patient profile not found',
        });
        return;
      }

      const records = await recordService.searchRecords(patient.patient_id, searchTerm);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update record
  async updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const recordId = req.params.recordId;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const patient = await patientRepository.findByUserId(userId);
      if (!patient) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Patient profile not found',
        });
        return;
      }

      const updates = req.body;

      const updatedRecord = await recordService.updateRecord(recordId, patient.patient_id, updates);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Record updated successfully',
        data: updatedRecord,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete record
  async deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const recordId = req.params.recordId;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const patient = await patientRepository.findByUserId(userId);
      if (!patient) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Patient profile not found',
        });
        return;
      }

      await recordService.deleteRecord(recordId, patient.patient_id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RecordController();