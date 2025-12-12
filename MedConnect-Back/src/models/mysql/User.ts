export interface IUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: 'patient' | 'doctor' | 'admin';
  contact?: string;
  address?: string;
  profile_picture?: string; 
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateUser {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  contact?: string;
  address?: string;
}

export interface IRegisterPatient {
  // User info
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact?: string;
  address?: string;
  // Patient-specific info
  dob: Date;
  gender: 'male' | 'female' | 'other';
  bloodtype?: string;
}

export interface IRegisterDoctor {
  // User info
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact?: string;
  address?: string;
  // Doctor-specific info
  specialty: string;
  license_number: string;
  hospital_affiliation?: string;
  bio?: string;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IAuthResponse {
  token: string;
  user: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  profile?: any; // Patient or Doctor profile
}