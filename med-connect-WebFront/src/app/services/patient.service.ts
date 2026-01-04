import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface Patient {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  blood_type?: string;
  address?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get doctor's patients
  getDoctorPatients(doctorId: number): Observable<Patient[]> {
    return this.http.get<{ success: boolean; data: Patient[] }>(
      `${this.apiUrl}/doctors/${doctorId}/patients`
    ).pipe(map(response => response.data || []));
  }

  // Search patients
  searchPatients(query: string): Observable<Patient[]> {
    return this.http.get<{ success: boolean; data: Patient[] }>(
      `${this.apiUrl}/patients/search`,
      { params: { q: query } }
    ).pipe(map(response => response.data || []));
  }

  // Get patient by ID
  getPatientById(patientId: number): Observable<Patient> {
    return this.http.get<{ success: boolean; data: Patient }>(
      `${this.apiUrl}/patients/${patientId}`
    ).pipe(map(response => response.data));
  }

  getProfile(): Observable<Patient> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<{ success: boolean; data: Patient }>(
      `${this.apiUrl}/patients/profile`,
      { headers }
    ).pipe(map(response => response.data));
  }

  updateProfile(updates: {
    first_name?: string;
    last_name?: string;
    contact?: string;
    address?: string;
    gender?: string;
    blood_type?: string;
    date_of_birth?: string;
  }): Observable<Patient> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    // Map frontend field names to backend field names
    const backendUpdates: any = { ...updates };
    if (updates.blood_type) {
      backendUpdates.bloodtype = updates.blood_type;
      delete backendUpdates.blood_type;
    }
    if (updates.date_of_birth) {
      backendUpdates.dob = updates.date_of_birth;
      delete backendUpdates.date_of_birth;
    }
    return this.http.put<{ success: boolean; data: Patient }>(
      `${this.apiUrl}/patients/profile`,
      backendUpdates,
      { headers }
    ).pipe(map(response => response.data));
  }
}
