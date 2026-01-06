import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { IRegisterPatient, IRegisterDoctor, ILoginCredentials } from '../models/mysql/User';
import { HTTP_STATUS } from '../utils/constants';

export class AuthController {
  // Register new patient
  async registerPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== Patient Registration Request ===');
      console.log('Request body:', req.body);
      console.log('Request headers:', req.headers);
      
      const patientData: IRegisterPatient = req.body;

      const result = await authService.registerPatient(patientData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Patient registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Register new doctor
  async registerDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== Doctor Registration Request ===');
      console.log('Request body:', req.body);
      console.log('Request headers:', req.headers);
      
      const doctorData: IRegisterDoctor = req.body;

      const result = await authService.registerDoctor(doctorData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Doctor registered successfully. Account pending verification.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== Login Request ===');
      console.log('Email:', req.body.email);
      console.log('Password provided:', req.body.password ? 'Yes' : 'No');
      
      const credentials: ILoginCredentials = req.body;

      const result = await authService.login(credentials);

      console.log('Login successful for:', credentials.email);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      console.error('Login error in controller:', error.message || error);
      next(error);
    }
  }

  // Logout user
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<Response|void> {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const user = await authService.getUserById(userId);

      // Don't send password hash
      const { password_hash, ...userWithoutPassword } = user;

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.user_id;
      const { oldPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      await authService.changePassword(userId, oldPassword, newPassword);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();