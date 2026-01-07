import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
// import logger from './utils/logger';

// Import routes
import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes';
import doctorRoutes from './routes/doctorRoutes';
import recordRoutes from './routes/recordRoutes';
import profilePictureRoutes from './routes/profilePictureRoutes';
import doctorRatingRoutes from './routes/doctorRatingRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import passwordResetRoutes from './routes/passwordResetRoutes';
import connectionRoutes from './routes/connectionRoutes';
import messageRoutes from './routes/messageRoutes';
import newsletterRoutes from './routes/newsletterRoutes';

dotenv.config();

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Serve static files from uploads directory with permissive resource policy for cross-origin frontends
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Med-Connect API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';

// API info route (must be before rate limiter to avoid issues)
app.get([`/api/${API_VERSION}`, `/api/${API_VERSION}/`], (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Med-Connect API',
    version: API_VERSION,
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      patients: `/api/${API_VERSION}/patients`,
      doctors: `/api/${API_VERSION}/doctors`,
      records: `/api/${API_VERSION}/records`,
      appointments: `/api/${API_VERSION}/appointments`,
      prescriptions: `/api/${API_VERSION}/prescriptions`,
      connections: `/api/${API_VERSION}/connections`,
      messages: `/api/${API_VERSION}/messages`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting configuration
// Login limiter is applied directly in authRoutes.ts
// General API rate limiter (more lenient) - enable only in production to avoid
// interrupting local development with 429 errors.
if (process.env.NODE_ENV === 'production') {
  const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'),
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      message: 'Request failed. Please try again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general API limiter to all /api routes in production
  app.use('/api', apiLimiter);
}

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/patients`, patientRoutes);
app.use(`/api/${API_VERSION}/doctors`, doctorRoutes);
app.use(`/api/${API_VERSION}/records`, recordRoutes);
app.use(`/api/${API_VERSION}/profile-picture`, profilePictureRoutes);
app.use(`/api/${API_VERSION}/doctors`, doctorRatingRoutes);
app.use(`/api/${API_VERSION}/prescriptions`, prescriptionRoutes);
app.use(`/api/${API_VERSION}/appointments`, appointmentRoutes);
app.use(`/api/${API_VERSION}/password-reset`, passwordResetRoutes);
app.use(`/api/${API_VERSION}/connections`, connectionRoutes);
app.use(`/api/${API_VERSION}/messages`, messageRoutes);
app.use(`/api/${API_VERSION}/newsletter`, newsletterRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;