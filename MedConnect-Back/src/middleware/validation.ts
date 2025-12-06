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