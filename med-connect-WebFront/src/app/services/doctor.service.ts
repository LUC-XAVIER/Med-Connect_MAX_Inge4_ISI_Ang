import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { Doctor } from '../models/doctor.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/doctors`;

  constructor(private http: HttpClient) {}

  /**
   * Get all doctors (for patient to browse/select)
   */
  getAllDoctors(): Observable<Doctor[]> {
    return this.http.get<ApiResponse<{ doctors: Doctor[], pagination: any }>>(this.apiUrl).pipe(
      map(response => {
        console.log('Doctor API Response:', response); // Debug log
        if (response && response.data && Array.isArray(response.data.doctors)) {
          return response.data.doctors; // ✅ unwrap doctors array
        }
        console.warn('Unexpected response format:', response);
        return [];
      }),
      catchError(error => {
        console.error('Error in getAllDoctors:', error);
        throw error;
      })
    );
  }

  /**
   * Search doctors by various criteria
   */
  searchDoctors(params: {
    q?: string;
    specialty?: string;
    verified?: boolean;
    hospital?: string;
    limit?: number;
  }): Observable<Doctor[]> {
    let httpParams = new HttpParams();

    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params.specialty) {
      httpParams = httpParams.set('specialty', params.specialty);
    }
    if (params.verified !== undefined) {
      httpParams = httpParams.set('verified', params.verified.toString());
    }
    if (params.hospital) {
      httpParams = httpParams.set('hospital', params.hospital);
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiResponse<Doctor[]>>(`${this.apiUrl}/search`, { params: httpParams })
      .pipe(map(response => response.data || []));
  }

  /**
   * Get current doctor's profile
   */
  getProfile(): Observable<Doctor> {
    return this.http.get<ApiResponse<Doctor>>(`${this.apiUrl}/profile`)
      .pipe(map(response => response.data));
  }

  /**
   * Update doctor profile
   */
  updateProfile(updates: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<ApiResponse<Doctor>>(`${this.apiUrl}/profile`, updates)
      .pipe(map(response => response.data));
  }

  /**
   * Delete doctor profile
   */
  deleteProfile(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/profile`);
  }

  /**
   * Get doctor's appointments
   */
  getAppointments(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/appointments`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get doctor's prescriptions
   */
  getPrescriptions(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/prescriptions`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Create prescription (doctor only)
   */
  createPrescription(prescriptionData: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/prescriptions`, prescriptionData);
  }

  /**
   * Get doctor by ID
   */
  getDoctorById(doctorId: number): Observable<Doctor> {
    return this.http.get<ApiResponse<Doctor>>(`${this.apiUrl}/${doctorId}`)
      .pipe(map(response => response.data));
  }

  /**
   * Get doctor ratings
   */
  getDoctorRatings(doctorUserId: number): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${doctorUserId}/ratings`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get doctor statistics
   */
  getStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistics`)
      .pipe(map(response => response.data));
  }
}
