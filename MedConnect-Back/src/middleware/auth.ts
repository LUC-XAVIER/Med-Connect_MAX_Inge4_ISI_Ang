import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { AppError } from './errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { IUser } from '../models/mysql/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Middleware to verify JWT token
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user from database
    const user = await authService.getUserById(decoded.user_id);

    // Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN);
    }

    // Attach user to request object
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check user role
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED_ACCESS, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action',
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

// Middleware to check if user is patient
export const isPatient = authorize('patient');

// Middleware to check if user is doctor
export const isDoctor = authorize('doctor');

// Middleware to check if user is admin
export const isAdmin = authorize('admin');

// Middleware to check if user is patient or doctor
export const isPatientOrDoctor = authorize('patient', 'doctor');