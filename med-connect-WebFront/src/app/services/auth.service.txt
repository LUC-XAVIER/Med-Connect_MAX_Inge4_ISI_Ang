import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environments';

export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
  profile?: any;
}

export interface PatientRegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact?: string;
  address?: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  bloodtype?: string;
}

export interface DoctorRegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact?: string;
  address?: string;
  specialty: string;
  license_number: string;
  hospital_affiliation?: string;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
    this.setupAutoLogout();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        // Verify token is still valid
        const tokenData = this.parseJwt(token);
        if (!tokenData) {
          console.log('Invalid token format, clearing session');
          this.clearSession();
          return;
        }

        // Check if token is expired
        if (tokenData.exp) {
          const isExpired = tokenData.exp * 1000 <= Date.now();
          if (isExpired) {
            console.log('Token expired, clearing session');
            this.clearSession();
            return;
          }
        }

        // Load user data
        const user = JSON.parse(userStr);
        if (!user || !user.role) {
          console.log('Invalid user data, clearing session');
          this.clearSession();
          return;
        }

        this.currentUserSubject.next(user);

        // Set up auto logout based on token expiration
        if (tokenData.exp) {
          const expiresIn = tokenData.exp * 1000 - Date.now();
          if (expiresIn > 0) {
            this.setAutoLogout(expiresIn);
          } else {
            this.clearSession();
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        this.clearSession();
      }
    } else {
      // No token or user data, ensure session is cleared
      this.clearSession();
    }
  }

  // Parse JWT token to get expiration (public for login component)
  parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  // Setup auto logout
  private setupAutoLogout(): void {
    const expiration = localStorage.getItem('tokenExpiration');
    if (expiration) {
      const expiresIn = new Date(expiration).getTime() - Date.now();
      if (expiresIn > 0) {
        this.setAutoLogout(expiresIn);
      } else {
        this.clearSession();
      }
    }
  }

  private setAutoLogout(expirationDuration: number): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  // Login
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<{ success: boolean; message: string; data: AuthResponse }>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      map(response => response.data), // Extract data from backend response
      tap(authData => {
        this.setSession(authData);
        // Set expiration (assuming 7 days from now)
        const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiration', expirationDate.toISOString());
        this.setAutoLogout(7 * 24 * 60 * 60 * 1000);
      }),
      catchError(error => {
        console.error('Login error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          fullError: error
        });

        let errorMessage = 'Login failed. Please try again.';
        if (error.status === 401) {
          // Backend returns { success: false, error: "message" }
          errorMessage = error.error?.error || error.error?.message || 'Invalid email or password. Please check your credentials.';
          console.error('401 Unauthorized - Invalid credentials');
        } else if (error.status === 403) {
          errorMessage = error.error?.error || error.error?.message || 'Account is deactivated. Please contact support.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => ({
          message: errorMessage,
          status: error.status,
          error: error.error
        }));
      })
    );
  }

  // Register patient
  registerPatient(data: PatientRegisterData): Observable<AuthResponse> {
    console.log('AuthService.registerPatient called');
    console.log('API URL:', `${this.apiUrl}/register/patient`);
    console.log('Request data:', data);

    return this.http.post<{
      success: boolean;
      message: string;
      data: AuthResponse
    }>(`${this.apiUrl}/register/patient`, data).pipe(
      map(response => response.data), // Extract data from backend response
      tap(authData => {
        this.setSession(authData);
      }),
      catchError(error => {
        let errorMessage = 'Registration failed. Please try again.';
        if (error.status === 409) {
          errorMessage = error.error?.message || 'Email already exists';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid data provided';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => ({
          message: errorMessage,
          status: error.status
        }));
      })
    );
  }

  // Register doctor
  registerDoctor(data: DoctorRegisterData): Observable<AuthResponse> {
    console.log('AuthService.registerDoctor called');
    console.log('API URL:', `${this.apiUrl}/register/doctor`);
    console.log('Request data:', data);

    return this.http.post<{
      success: boolean;
      message: string;
      data: AuthResponse
    }>(`${this.apiUrl}/register/doctor`, data).pipe(
      map(response => response.data), // Extract data from backend response
      tap(authData => {
        this.setSession(authData);
      }),
      catchError(error => {
        let errorMessage = 'Registration failed. Please try again.';
        if (error.status === 409) {
          if (error.error?.message?.includes('License number')) {
            errorMessage = 'License number already registered';
          } else {
            errorMessage = error.error?.message || 'Email already exists';
          }
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid data provided';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => ({
          message: errorMessage,
          status: error.status
        }));
      })
    );
  }

  // Get current user from API
  getCurrentUser(): Observable<User> {
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/me`).pipe(
      map(response => response.data), // Extract data from backend response
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          this.clearSession();
        }
        return throwError(() => error);
      })
    );
  }

  // Refresh token (if you implement token refresh)
  refreshToken(): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/refresh-token`, {}).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        // Update expiration
        const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiration', expirationDate.toISOString());
        this.setAutoLogout(7 * 24 * 60 * 60 * 1000);
      })
    );
  }

  // Logout
  logout(): Observable<any> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      }),
      catchError(() => {
        // Even if the API call fails, clear local session
        this.clearSession();
        return throwError(() => ({message: 'Logout failed but session cleared'}));
      })
    );
  }

  // Manual logout (without API call)
  manualLogout(): void {
    this.clearSession();
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return false;
    }

    // Check if token is expired
    const tokenData = this.parseJwt(token);
    if (tokenData && tokenData.exp) {
      const isExpired = tokenData.exp * 1000 <= Date.now();
      if (isExpired) {
        console.log('Token is expired');
        this.clearSession();
        return false;
      }
      return true;
    }

    console.log('Token data invalid or missing expiration');
    return false;
  }

  // Check user role
  getUserRole(): string | null {
    if (!this.isLoggedIn()) {
      return null;
    }

    // First try to get from currentUserSubject
    const user = this.currentUserSubject.value;
    if (user?.role) {
      return user.role;
    }

    // Fallback to localStorage if subject is empty
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      return storedRole;
    }

    return null;
  }

  // Get user ID
  getUserId(): number | null {
    if (this.isLoggedIn()) {
      const user = this.currentUserSubject.value;
      return user?.user_id || null;
    }
    return null;
  }

  // Check specific roles
  isDoctor(): boolean {
    return this.getUserRole() === 'doctor';
  }

  isPatient(): boolean {
    return this.getUserRole() === 'patient';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Private methods
  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    localStorage.setItem('userRole', authResponse.user.role);
    localStorage.setItem('userId', authResponse.user.user_id.toString());
    this.currentUserSubject.next(authResponse.user);
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('tokenExpiration');

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Update user profile
  updateUserProfile(updates: Partial<User>): void {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      const updatedUser = {...currentUser, ...updates};
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  // Validate password strength
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
//         break;
