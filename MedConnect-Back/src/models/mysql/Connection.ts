export interface IConnection {
  connection_id: number;
  patient_id: number;
  doctor_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  request_date: Date;
  response_date?: Date;
  created_at: Date;
}

export interface ICreateConnection {
  patient_id: number;
  doctor_id: number;
  status?: 'pending' | 'approved' | 'rejected' | 'revoked';
}

export interface IConnectionWithDetails extends IConnection {
  // Patient details
  patient_user_id?: number; // Added for doctor connections
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_dob: Date;
  patient_gender: string;
  patient_bloodtype?: string;
  
  // Doctor details
  doctor_user_id?: number; // Added for patient connections
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_specialty: string;
  doctor_hospital: string;
  doctor_verified: boolean;
}

export interface ISharedRecord {
  connection_id: number;
  record_id: string; // MongoDB ObjectId as string
  shared_at: Date;
}