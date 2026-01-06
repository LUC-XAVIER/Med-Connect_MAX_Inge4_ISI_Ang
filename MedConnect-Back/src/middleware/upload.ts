import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';
import { HTTP_STATUS } from '../utils/constants';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF, JPG, and PNG are allowed.', HTTP_STATUS.BAD_REQUEST));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});