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
}
