import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environments';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private apiUrl = `${environment.apiUrl}/password-reset`;

  constructor(private http: HttpClient) {}

  requestReset(email: string): Observable<void> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/request`, { email })
      .pipe(map(() => void 0));
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/reset`, { token, new_password: newPassword })
      .pipe(map(() => void 0));
  }
}

