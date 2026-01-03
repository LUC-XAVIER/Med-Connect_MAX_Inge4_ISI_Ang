import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import {
  AppointmentStatus,
  AppointmentWithDetails,
  CreateAppointmentRequest,
  CreateAppointmentByDoctor,
  CreateAppointmentByPatient
} from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Helper to map backend status to frontend status
  private mapStatusFromBackend(status: string): string {
    return status === 'scheduled' ? AppointmentStatus.PENDING : status;
  }

  // Helper to map frontend status to backend status
  private mapStatusToBackend(status: string): string {
    return status === AppointmentStatus.PENDING ? 'scheduled' : status;
  }

  // Helper to map backend appointment data to frontend format
  private mapAppointmentData(apt: any): AppointmentWithDetails {
    // Construct names from first_name and last_name if needed
    const patientName = apt.patient_name || 
      (apt.patient_first_name && apt.patient_last_name 
        ? `${apt.patient_first_name} ${apt.patient_last_name}` 
        : undefined);
    
    const doctorName = apt.doctor_name || 
      (apt.doctor_first_name && apt.doctor_last_name 
        ? `${apt.doctor_first_name} ${apt.doctor_last_name}` 
        : undefined);

    return {
      ...apt,
      status: this.mapStatusFromBackend(apt.status) as AppointmentStatus,
      patient_name: patientName,
      doctor_name: doctorName,
      patient_email: apt.patient_contact || apt.patient_email,
      doctor_email: apt.doctor_contact || apt.doctor_email
    };
  }

  // Get appointments (works for both patient and doctor based on token)
  getMyAppointments(status?: string): Observable<AppointmentWithDetails[]> {
    const params: any = {};
    if (status) {
      // Map frontend status to backend status
      params.status = this.mapStatusToBackend(status);
    }
    return this.http.get<{ success: boolean; data: AppointmentWithDetails[] }>(
      `${this.apiUrl}/appointments`,
      { params }
    ).pipe(
      map(response => {
        const appointments = response.data || [];
        // Map backend data to frontend format
        return appointments.map(apt => this.mapAppointmentData(apt));
      })
    );
  }

  // Alias for backward compatibility
  getDoctorAppointments(status?: string): Observable<AppointmentWithDetails[]> {
    return this.getMyAppointments(status);
  }

  // ✅ Generic create - backend determines patient vs doctor based on token
  createAppointment(appointmentData: CreateAppointmentRequest): Observable<AppointmentWithDetails> {
    return this.http.post<{ success: boolean; data: AppointmentWithDetails }>(
      `${this.apiUrl}/appointments`,
      appointmentData
    ).pipe(
      map(response => this.mapAppointmentData(response.data))
    );
  }

  // ✅ Explicit: Doctor schedules FOR patient
  createAppointmentByDoctor(appointmentData: CreateAppointmentByDoctor): Observable<AppointmentWithDetails> {
    return this.http.post<{ success: boolean; data: AppointmentWithDetails }>(
      `${this.apiUrl}/appointments`,
      appointmentData
    ).pipe(
      map(response => this.mapAppointmentData(response.data))
    );
  }

  // ✅ Explicit: Patient books WITH doctor
  createAppointmentByPatient(appointmentData: CreateAppointmentByPatient): Observable<AppointmentWithDetails> {
    return this.http.post<{ success: boolean; data: AppointmentWithDetails }>(
      `${this.apiUrl}/appointments`,
      appointmentData
    ).pipe(
      map(response => this.mapAppointmentData(response.data))
    );
  }

  // Get appointment by ID
  getAppointmentById(appointmentId: number): Observable<AppointmentWithDetails> {
    return this.http.get<{ success: boolean; data: AppointmentWithDetails }>(
      `${this.apiUrl}/appointments/${appointmentId}`
    ).pipe(
      map(response => this.mapAppointmentData(response.data))
    );
  }

  // Update appointment status
  updateAppointmentStatus(appointmentId: number, data: {
    status: AppointmentStatus;
    notes?: string;
  }): Observable<void> {
    // Map frontend status to backend status
    const backendData = {
      ...data,
      status: this.mapStatusToBackend(data.status)
    };
    return this.http.put<void>(`${this.apiUrl}/appointments/${appointmentId}/status`, backendData);
  }

  // Reschedule appointment
  rescheduleAppointment(appointmentId: number, date: string, time: string): Observable<AppointmentWithDetails> {
    return this.http.put<{ success: boolean; data: AppointmentWithDetails }>(
      `${this.apiUrl}/appointments/${appointmentId}/reschedule`,
      {
        appointment_date: date,
        appointment_time: time
      }
    ).pipe(
      map(response => this.mapAppointmentData(response.data))
    );
  }

  // Cancel appointment
  cancelAppointment(appointmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointments/${appointmentId}`);
  }
}
