export interface IPatient {
  patient_id: number;
  user_id: number;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  bloodtype?: string;
  created_at: Date;
}

export interface ICreatePatient {
  user_id: number;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  bloodtype?: string;
}