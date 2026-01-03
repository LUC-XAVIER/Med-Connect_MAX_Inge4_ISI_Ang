import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';

export interface DoctorRating {
  rating_id: number;
  doctor_id: number;
  patient_id: number;
  rating: number; // 1-5
  review?: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  patient_first_name?: string;
  patient_last_name?: string;
}

export interface CreateRatingRequest {
  rating: number; // 1-5
  review?: string;
}

export interface DoctorRatingStats {
  average_rating: number;
  total_ratings: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DoctorRatingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private handleError(error: any): Observable<never> {
    console.error('Doctor rating service error:', error);
    const message = error.error?.message || error.message || 'An error occurred';
    return throwError(() => new Error(message));
  }

  // Rate a doctor (patient only)
  rateDoctor(doctorUserId: number, ratingData: CreateRatingRequest): Observable<DoctorRating> {
    const headers = this.getHeaders();
    return this.http.post<{ success: boolean; data: DoctorRating }>(
      `${this.apiUrl}/doctors/${doctorUserId}/rate`,
      ratingData,
      { headers }
    ).pipe(
      map(response => {
        const rating = response.data;
        // Construct patient name if needed
        if (rating.patient_first_name && rating.patient_last_name) {
          rating.patient_name = `${rating.patient_first_name} ${rating.patient_last_name}`;
        }
        return rating;
      }),
      catchError(this.handleError)
    );
  }

  // Get all ratings for a doctor
  getDoctorRatings(doctorUserId: number): Observable<{ ratings: DoctorRating[]; stats: DoctorRatingStats }> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/doctors/${doctorUserId}/ratings`,
      { headers }
    ).pipe(
      map(response => {
        const data = response.data;
        // Map ratings to include patient names
        const ratings = (data.ratings || []).map((r: any) => ({
          ...r,
          patient_name: r.patient_name || 
            (r.patient_first_name && r.patient_last_name 
              ? `${r.patient_first_name} ${r.patient_last_name}` 
              : 'Anonymous')
        }));
        return {
          ratings,
          stats: data.stats || {
            average_rating: 0,
            total_ratings: 0,
            rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
          }
        };
      }),
      catchError(this.handleError)
    );
  }

  // Get my rating for a doctor (patient only)
  getMyRating(doctorUserId: number): Observable<DoctorRating | null> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; data: DoctorRating | null }>(
      `${this.apiUrl}/doctors/${doctorUserId}/my-rating`,
      { headers }
    ).pipe(
      map(response => response.data || null),
      catchError(this.handleError)
    );
  }
}

