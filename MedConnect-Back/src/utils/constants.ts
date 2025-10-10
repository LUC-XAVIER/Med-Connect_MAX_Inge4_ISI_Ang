export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
} as const;

export const RECORD_TYPES = {
  LAB_RESULT: 'lab_result',
  X_RAY: 'x_ray',
  PRESCRIPTION: 'prescription',
  DOCTOR_NOTE: 'doctor_note',
  IMAGING_REPORT: 'imaging_report',
  OTHER: 'other',
} as const;

export const CONNECTION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVOKED: 'revoked',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  RECORD_NOT_FOUND: 'Medical record not found',
  CONNECTION_NOT_FOUND: 'Connection not found',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type RecordType = typeof RECORD_TYPES[keyof typeof RECORD_TYPES];
export type ConnectionStatusType = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];