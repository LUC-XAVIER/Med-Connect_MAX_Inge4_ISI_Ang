export interface Doctor {
  user_id: number;
  doctor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  speciality: string;
  license_number: string;
  years_of_experience?: number;
  consultation_fee?: number;
  bio?: string;
  verified: boolean;
  hospital_affiliation?: string;
  profile_picture_url?: string;
  average_rating?: number;
  total_ratings?: number;
  created_at: string;
}
