import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { ConnectionWithDetails } from '../models/connection.model';
import { AuthService } from './auth.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private apiUrl = `${environment.apiUrl}/connections`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get authorization headers with JWT token
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('Connection service error:', error);
    const message = error.error?.message || error.message || 'An error occurred';
    return throwError(() => new Error(message));
  }

  // ==================== PATIENT METHODS ====================

  /**
   * Patient requests connection with a doctor
   */
  requestConnection(doctorUserId: number): Observable<any> {
    console.log('Requesting connection with doctor:', doctorUserId);

    const body = { doctor_user_id: doctorUserId };
    const headers = this.getHeaders();

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/request`, body, { headers }).pipe(
      map(response => {
        console.log('Connection request response:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get patient's connections with optional status filter
   */
  getPatientConnections(status?: string): Observable<ConnectionWithDetails[]> {
    const params: any = {};
    if (status) {
      params.status = status;
    }

    const headers = this.getHeaders();

    return this.http.get<ApiResponse<ConnectionWithDetails[]>>(this.apiUrl, { params, headers }).pipe(
      map(response => {
        console.log('Patient connections response:', response);
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        console.warn('Unexpected connections response format:', response);
        return [];
      }),
      catchError(error => {
        console.error('Error loading patient connections:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Share specific records with doctor (patient only)
   */
  shareRecords(connectionId: number, recordIds: string[]): Observable<any> {
    const body = { record_ids: recordIds };
    const headers = this.getHeaders();

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${connectionId}/share`,
      body,
      { headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Unshare specific records from doctor (patient only)
   */
  unshareRecords(connectionId: number, recordIds: string[]): Observable<any> {
    const body = { record_ids: recordIds };
    const headers = this.getHeaders();

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${connectionId}/unshare`,
      body,
      { headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Share all records with doctor (patient only)
   */
  shareAllRecords(connectionId: number): Observable<any> {
    const headers = this.getHeaders();

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${connectionId}/share-all`,
      {},
      { headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  // ==================== DOCTOR METHODS ====================

  /**
   * Get doctor's connections with optional status filter
   */
  getDoctorConnections(status?: string): Observable<ConnectionWithDetails[]> {
    const params: any = {};
    if (status) {
      params.status = status;
    }

    const headers = this.getHeaders();

    return this.http.get<ApiResponse<ConnectionWithDetails[]>>(this.apiUrl, { params, headers }).pipe(
      map(response => {
        console.log('Doctor connections response:', response);
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        console.warn('Unexpected connections response format:', response);
        return [];
      }),
      catchError(error => {
        console.error('Error loading doctor connections:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Doctor approves a connection request
   */
  approveConnection(connectionId: number): Observable<any> {
    console.log('Approving connection:', connectionId);
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${connectionId}/approve`,
      {},
      { headers }
    ).pipe(
      map(response => {
        console.log('Approve connection response:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Doctor rejects a connection request
   */
  rejectConnection(connectionId: number): Observable<any> {
    console.log('Rejecting connection:', connectionId);
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${connectionId}/reject`,
      {},
      { headers }
    ).pipe(
      map(response => {
        console.log('Reject connection response:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Doctor revokes an approved connection
   */
  revokeConnection(connectionId: number): Observable<any> {
    console.log('Revoking connection:', connectionId);
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${connectionId}/revoke`,
      {},
      { headers }
    ).pipe(
      map(response => {
        console.log('Revoke connection response:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Doctor views patient records (requires approved connection)
   */
  viewPatientRecords(patientUserId: number): Observable<any> {
    console.log('Viewing patient records:', patientUserId);
    const headers = this.getHeaders();

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/patient/${patientUserId}/records`,
      { headers }
    ).pipe(
      map(response => {
        console.log('Patient records response:', response);
        return response.data || response;
      }),
      catchError(this.handleError)
    );
  }

  // ==================== SHARED METHODS ====================

  /**
   * Get shared records for a connection (patient or doctor)
   */
  getSharedRecords(connectionId: number): Observable<any> {
    const headers = this.getHeaders();

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/${connectionId}/shared-records`,
      { headers }
    ).pipe(
      map(response => {
        console.log('Shared records response:', response);
        return response.data || response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get connection by ID
   */
  getConnectionById(connectionId: number): Observable<ConnectionWithDetails> {
    const headers = this.getHeaders();

    return this.http.get<ApiResponse<ConnectionWithDetails>>(
      `${this.apiUrl}/${connectionId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Get all connections (both patient and doctor) - for dashboard
   */
  getAllConnections(): Observable<ConnectionWithDetails[]> {
    const headers = this.getHeaders();

    return this.http.get<ApiResponse<ConnectionWithDetails[]>>(this.apiUrl, { headers }).pipe(
      map(response => {
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading all connections:', error);
        return throwError(() => error);
      })
    );
  }
}
