// src/app/models/appointment.model.ts

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_user_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface AppointmentWithDetails extends Appointment {
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_email?: string;
  doctor_specialty?: string;
}

// ✅ Doctor schedules appointment FOR patient
export interface CreateAppointmentByDoctor {
  patient_user_id: number;  // Required: which patient (user_id)
  appointment_date: string;
  appointment_time: string;
  reason: string;
  notes?: string;
}

// ✅ Patient books appointment WITH doctor
export interface CreateAppointmentByPatient {
  doctor_user_id: number;   // Required: which doctor
  appointment_date: string;
  appointment_time: string;
  reason: string;
  notes?: string;
}

// Generic request (backward compatible)
export interface CreateAppointmentRequest {
  appointment_date: string;
  appointment_time: string;
  reason: string;
  notes?: string;
  patient_user_id?: number;  // Used when doctor schedules (user_id)
  doctor_user_id?: number;   // Used when patient books
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  notes?: string;
}

export interface RescheduleAppointmentRequest {
  appointment_date: string;
  appointment_time: string;
}
