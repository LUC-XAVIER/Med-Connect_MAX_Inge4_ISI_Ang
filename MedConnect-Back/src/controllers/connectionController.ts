import { Request, Response, NextFunction } from 'express';
import connectionService from '../services/connectionService';
import { HTTP_STATUS } from '../utils/constants';

export class ConnectionController {
  // Patient sends connection request to doctor
  async requestConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientUserId = req.user?.user_id;
      const { doctor_user_id } = req.body;
      if (!patientUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Patient not authenticated',
        });
        return;
      }

      const connection = await connectionService.requestConnection(doctor_user_id, patientUserId);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Connection request sent successfully',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  }

  // Doctor approves connection
  async approveConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorUserId = req.user?.user_id;
      const connectionId = parseInt(req.params.connectionId);

      if (!doctorUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Doctor not authenticated',
        });
        return;
      }

      const connection = await connectionService.approveConnection(connectionId, doctorUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Connection approved successfully',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  }

  // Doctor rejects connection
  async rejectConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorUserId = req.user?.user_id;
      const connectionId = parseInt(req.params.connectionId);

      if (!doctorUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Doctor not authenticated',
        });
        return;
      }

      const connection = await connectionService.rejectConnection(connectionId, doctorUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Connection rejected',
        data: connection,
      });
    } catch (error) {
      next(error);
    }
  }

  // Doctor revokes connection
  async revokeConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorUserId = req.user?.user_id;
      const connectionId = parseInt(req.params.connectionId);

      if (!doctorUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Doctor not authenticated',
        });
        return;
      }

      await connectionService.revokeConnection(connectionId, doctorUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Connection revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get my connections (patient or doctor)
  async getMyConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const status = req.query.status as string;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let connections;
      if (userRole === 'patient') {
        connections = await connectionService.getPatientConnections(userId, status);
      } else if (userRole === 'doctor') {
        connections = await connectionService.getDoctorConnections(userId, status);
      } else {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Invalid user role',
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: connections,
      });
    } catch (error) {
      next(error);
    }
  }

  // Share specific records with doctor (patient only)
  async shareRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientUserId = req.user?.user_id;
      const connectionId = parseInt(req.params.connectionId);
      const { record_ids } = req.body;

      if (!patientUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Patient not authenticated',
        });
        return;
      }

      if (!Array.isArray(record_ids) || record_ids.length === 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Please provide an array of record IDs',
        });
        return;
      }

      await connectionService.shareRecords(connectionId, record_ids, patientUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `${record_ids.length} record(s) shared successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Unshare specific records from doctor (patient only)
  async unshareRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientUserId = req.user?.user_id;
      const connectionId = parseInt(req.params.connectionId);
      const { record_ids } = req.body;

      if (!patientUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Patient not authenticated',
        });
        return;
      }

      if (!Array.isArray(record_ids) || record_ids.length === 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Please provide an array of record IDs',
        });
        return;
      }

      await connectionService.unshareRecords(connectionId, record_ids, patientUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `${record_ids.length} record(s) unshared successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Share ALL records with doctor (patient only)
  async shareAllRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientUserId = req.user?.user_id;
      const connectionId = parseInt(req.params.connectionId);

      if (!patientUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Patient not authenticated',
        });
        return;
      }

      await connectionService.shareAllRecords(connectionId, patientUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'All records shared successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get shared records for a connection
  async getSharedRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role;
      const connectionId = parseInt(req.params.connectionId);

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const result = await connectionService.getSharedRecords(connectionId, userId, userRole);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Doctor views patient records
  async viewPatientRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorUserId = req.user?.user_id;
      const patientUserId = parseInt(req.params.patientUserId);

      if (!doctorUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Doctor not authenticated',
        });
        return;
      }

      const result = await connectionService.viewPatientRecords(doctorUserId, patientUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ConnectionController();