import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { HTTP_STATUS } from '../utils/constants';

// Validation middleware to check for errors
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }

  next();
};

// Validation rules for patient registration
export const registerPatientValidation = [
  body('first_name')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('First name must be between 2 and 100 characters'),

  body('last_name')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Last name must be between 2 and 100 characters'),

  body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),

  body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('contact')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),

  body('address')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Address must be less than 255 characters'),

  body('dob')
      .isISO8601()
      .withMessage('Please provide a valid date of birth')
      .custom((value) => {
        const dob = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - dob.getFullYear();
        if (age < 0 || age > 150) {
          throw new Error('Invalid date of birth');
        }
        return true;
      }),

  body('gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),

  body('bloodtype')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood type'),
];

// Validation rules for doctor registration
export const registerDoctorValidation = [
  body('first_name')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('First name must be between 2 and 100 characters'),

  body('last_name')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Last name must be between 2 and 100 characters'),

  body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),

  body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('contact')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),

  body('address')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Address must be less than 255 characters'),

  body('specialty')
      .trim()
      .notEmpty()
      .withMessage('Specialty is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Specialty must be between 2 and 200 characters'),

  body('license_number')
      .trim()
      .notEmpty()
      .withMessage('License number is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('License number must be between 3 and 100 characters'),

  body('hospital_affiliation')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Hospital affiliation must be less than 255 characters'),

  body('bio')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Bio must be less than 1000 characters'),
];

// Validation rules for user login
export const loginValidation = [
  body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),

  body('password')
      .notEmpty()
      .withMessage('Password is required'),
];

// Validation rules for password change
export const changePasswordValidation = [
  body('oldPassword')
      .notEmpty()
      .withMessage('Current password is required'),

  body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];


// Validation rules for updating patient profile
export const updatePatientProfileValidation = [
  body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('First name must be between 2 and 100 characters'),

  body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Last name must be between 2 and 100 characters'),

  body('contact')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),

  body('address')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Address must be less than 255 characters'),

  body('dob')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date of birth'),

  body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),

  body('bloodtype')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood type'),
];

// Validation rules for updating doctor profile
export const updateDoctorProfileValidation = [
  body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('First name must be between 2 and 100 characters'),

  body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Last name must be between 2 and 100 characters'),

  body('contact')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),

  body('address')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Address must be less than 255 characters'),

  body('specialty')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Specialty must be between 2 and 200 characters'),

  body('hospital_affiliation')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Hospital affiliation must be less than 255 characters'),

  body('bio')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Bio must be less than 1000 characters'),
];

// Validation rules for uploading medical record
export const uploadRecordValidation = [
  body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Title must be between 3 and 255 characters'),

  body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),

  body('record_type')
      .notEmpty()
      .withMessage('Record type is required')
      .isIn(['lab_result', 'x_ray', 'xray', 'mri', 'prescription', 'doctor_note', 'imaging_report', 'vaccination', 'other'])
      .withMessage('Invalid record type'),

  body('record_date')
      .notEmpty()
      .withMessage('Record date is required')
      .isISO8601()
      .withMessage('Please provide a valid date'),
];

// Validation rules for updating medical record
export const updateRecordValidation = [
  body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Title must be between 3 and 255 characters'),

  body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),

  body('record_type')
      .optional()
      .isIn(['lab_result', 'x_ray', 'xray', 'mri', 'prescription', 'doctor_note', 'imaging_report', 'vaccination', 'other'])
      .withMessage('Invalid record type'),

  body('record_date')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date'),

  body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
];


// Doctor rating validation
export const rateDoctorValidation = [
  body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),

  body('review')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Review must be less than 500 characters'),
];

// Prescription validation
export const createPrescriptionValidation = [
  body('patient_id')
      .isInt()
      .withMessage('Patient ID must be an integer'),

  body('diagnosis')
      .notEmpty()
      .withMessage('Diagnosis is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Diagnosis must be between 10 and 1000 characters'),

  body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters'),

  body('medications')
      .isArray({ min: 1 })
      .withMessage('At least one medication is required'),

  body('medications.*.medication_name')
      .notEmpty()
      .withMessage('Medication name is required'),

  body('medications.*.dosage')
      .notEmpty()
      .withMessage('Dosage is required'),

  body('medications.*.frequency')
      .notEmpty()
      .withMessage('Frequency is required'),

  body('medications.*.duration')
      .notEmpty()
      .withMessage('Duration is required'),
];

// ✅ FIXED: Appointment validation - accepts EITHER doctor_user_id OR patient_user_id
export const createAppointmentValidation = [
  body('doctor_user_id')
      .optional()
      .isInt()
      .withMessage('Doctor user ID must be an integer'),

  body('patient_user_id')
      .optional()
      .isInt()
      .withMessage('Patient user ID must be an integer'),

  body('appointment_date')
      .isISO8601()
      .withMessage('Please provide a valid date')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (appointmentDate < today) {
          throw new Error('Appointment date cannot be in the past');
        }
        return true;
      }),

  body('appointment_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Please provide a valid time in HH:MM format'),

  body('duration')
      .optional()
      .isInt({ min: 15, max: 180 })
      .withMessage('Duration must be between 15 and 180 minutes'),

  body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters'),
];

// Update appointment status validation
export const updateAppointmentStatusValidation = [
  body('status')
      .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
      .withMessage('Invalid status'),

  body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
];

// Reschedule appointment validation
export const rescheduleAppointmentValidation = [
  body('appointment_date')
      .isISO8601()
      .withMessage('Please provide a valid date')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (appointmentDate < today) {
          throw new Error('Appointment date cannot be in the past');
        }
        return true;
      }),

  body('appointment_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Please provide a valid time in HH:MM format'),
];

// Password reset request validation
export const requestPasswordResetValidation = [
  body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
];

// Password reset validation
export const resetPasswordValidation = [
  body('token')
      .notEmpty()
      .withMessage('Reset token is required'),

  body('new_password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// Update prescription status validation
export const updatePrescriptionStatusValidation = [
  body('status')
      .isIn(['active', 'completed', 'cancelled'])
      .withMessage('Status must be active, completed, or cancelled'),
];

// Validation for connection request
export const requestConnectionValidation = [
  body('doctor_user_id')
      .isInt()
      .withMessage('Doctor user ID must be an integer')
      .notEmpty()
      .withMessage('Doctor user ID is required'),
];

// Validation for sharing records
export const shareRecordsValidation = [
  body('record_ids')
      .isArray({ min: 1 })
      .withMessage('Please provide at least one record ID'),

  body('record_ids.*')
      .isString()
      .withMessage('Each Record ID must be a string'),
];