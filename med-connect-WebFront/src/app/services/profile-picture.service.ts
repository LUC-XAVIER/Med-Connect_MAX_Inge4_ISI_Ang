import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfilePictureService {
  private apiUrl = `${environment.apiUrl}/profile-picture`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Upload profile picture
  uploadProfilePicture(file: File): Observable<{ profile_picture: string }> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    const headers = this.getHeaders();

    return this.http.post<{ success: boolean; data: { profile_picture: string } }>(
      `${this.apiUrl}/upload`,
      formData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error uploading profile picture:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to upload profile picture'));
      })
    );
  }

  // Delete profile picture
  deleteProfilePicture(): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}`,
      { headers }
    ).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Error deleting profile picture:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to delete profile picture'));
      })
    );
  }

  // Get profile picture URL
  getProfilePictureUrl(profilePicture: string | null | undefined): string {
    if (!profilePicture) {
      return '';
    }
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    return `${environment.apiUrl.replace('/api/v1', '')}${profilePicture}`;
  }
}

