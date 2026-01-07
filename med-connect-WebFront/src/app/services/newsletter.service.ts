import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environments';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private apiUrl = `${environment.apiUrl}/newsletter`;

  constructor(private http: HttpClient) {}

  subscribe(email: string): Observable<string> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/subscribe`, { email })
      .pipe(map(response => response.message || 'If the email is valid, a subscription confirmation has been sent.'));
  }
}


