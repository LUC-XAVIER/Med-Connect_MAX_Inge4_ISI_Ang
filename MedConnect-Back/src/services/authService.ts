import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import userRepository from '../repositories/userRepo';
import { ILoginCredentials, IAuthResponse, IRegisterPatient, IRegisterDoctor } from '../models/mysql/User';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import logger from '../utils/logger';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
  private readonly JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
  private readonly SALT_ROUNDS = 10;

  // Register new patient
  async registerPatient(patientData: IRegisterPatient): Promise<IAuthResponse> {
    const { first_name, last_name, email, password, contact, address, dob, gender, bloodtype } = patientData;

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      first_name,
      last_name,
      email,
      password_hash,
      role: 'patient',
      contact,
      address,
    });

    // Create patient profile
    const patient = await userRepository.createPatient({
      user_id: user.user_id,
      dob,
      gender,
      bloodtype,
    });

    logger.info(`New patient registered: ${email}`);

    // Generate JWT token
    const token = this.generateToken(user.user_id, user.role);

    return {
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
      profile: patient,
    };
  }

  // Register new doctor
  async registerDoctor(doctorData: IRegisterDoctor): Promise<IAuthResponse> {
    const { first_name, last_name, email, password, contact, address, specialty, license_number, hospital_affiliation, bio } = doctorData;

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    // Check if license number already exists
    const existingLicense = await userRepository.licenseExists(license_number);
    if (existingLicense) {
      throw new AppError('License number already registered', HTTP_STATUS.CONFLICT);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      first_name,
      last_name,
      email,
      password_hash,
      role: 'doctor',
      contact,
      address,
    });

    // Create doctor profile (unverified by default)
    const doctor = await userRepository.createDoctor({
      user_id: user.user_id,
      specialty,
      license_number,
      hospital_affiliation,
      bio,
    });

    logger.info(`New doctor registered: ${email} - Pending verification`);

    // Generate JWT token
    const token = this.generateToken(user.user_id, user.role);

    return {
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
      profile: doctor,
    };
  }

  // Login user
  async login(credentials: ILoginCredentials): Promise<IAuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Failed login attempt for email: ${email} - User not found`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if account is active
    if (!user.is_active) {
      logger.warn(`Login attempt for inactive account: ${email}`);
      throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for email: ${email} - Invalid password`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    logger.info(`User logged in successfully: ${email}`);

    // Get profile based on role
    let profile = null;
    if (user.role === 'patient') {
      profile = await userRepository.getPatientByUserId(user.user_id);
    } else if (user.role === 'doctor') {
      profile = await userRepository.getDoctorByUserId(user.user_id);
    }

    // Generate JWT token
    const token = this.generateToken(user.user_id, user.role);

    return {
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
      profile,
    };
  }

  // Generate JWT token
  private generateToken(userId: number, role: string): string {
    const payload = {
      user_id: userId,
      role: role,
    };

    const signOptions: SignOptions = {
      expiresIn: this.JWT_EXPIRE as SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      payload as string | object | Buffer,
      this.JWT_SECRET as Secret,
      signOptions
    );

    return token;
  }

  // Verify JWT token
  verifyToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  // Get user by ID (for auth middleware)
  async getUserById(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  // Change password
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await userRepository.update(userId, { password_hash: newPasswordHash });

    logger.info(`Password changed for user: ${user.email}`);
  }
}

export default new AuthService();