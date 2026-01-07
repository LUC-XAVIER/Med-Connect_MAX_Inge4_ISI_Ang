export interface IDoctor {
  doctor_id: number;
  user_id: number;
  specialty: string;
  license_number: string;
  hospital_affiliation?: string;
  verified: boolean;
  bio?: string;
  rating: number; 
  total_ratings: number; 
  created_at: Date;
}

export interface ICreateDoctor {
  user_id: number;
  specialty: string;
  license_number: string;
  hospital_affiliation?: string;
  bio?: string;
}