export interface IDoctorRating {
  rating_id: number;
  doctor_id: number;
  patient_id: number;
  rating: number;
  review?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateDoctorRating {
  doctor_id: number;
  patient_id: number;
  rating: number;
  review?: string;
}

export interface IDoctorRatingWithDetails extends IDoctorRating {
  patient_first_name: string;
  patient_last_name: string;
}