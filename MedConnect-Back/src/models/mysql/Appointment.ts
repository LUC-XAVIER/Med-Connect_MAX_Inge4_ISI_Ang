export interface IAppointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: Date;
  appointment_time: string;
  duration: number;
  reason?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateAppointment {
  patient_id: number;
  doctor_id: number;
  appointment_date: Date;
  appointment_time: string;
  duration?: number;
  reason?: string;
}

export interface IAppointmentWithDetails extends IAppointment {
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty: string;
  doctor_contact: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_contact: string;
}
