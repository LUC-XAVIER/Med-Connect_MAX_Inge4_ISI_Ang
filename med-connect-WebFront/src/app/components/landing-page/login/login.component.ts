import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedRole: 'patient' | 'doctor' | 'admin' | null = null;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/';

  // Form data
  patientForm = {
    email: '',
    password: '',
    rememberMe: false
  };

  doctorForm = {
    email: '',
    password: '',
    rememberMe: false
  };

  adminForm = {
    email: '',
    password: '',
    rememberMe: false
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const presetRole = this.route.snapshot.data['role'];
    if (presetRole === 'admin') {
      this.selectedRole = 'admin';
    }

    // Get return URL from route parameters or default to '/'
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.returnUrl = params['returnUrl'] || '/';

        if (params['role'] === 'patient' || params['role'] === 'doctor' || params['role'] === 'admin') {
          this.selectedRole = params['role'];
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Role selection
  selectRole(role: 'patient' | 'doctor' | 'admin') {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  // Back to role selection
  backToSelection() {
    this.selectedRole = null;
    this.resetForms();
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Reset forms
  resetForms() {
    this.patientForm = { email: '', password: '', rememberMe: false };
    this.doctorForm = { email: '', password: '', rememberMe: false };
    this.showPassword = false;
    this.errorMessage = '';
    this.isLoading = false;
    this.adminForm = { email: '', password: '', rememberMe: false };
  }

  // Patient login
  loginAsPatient() {
    if (!this.validateForm(this.patientForm)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.patientForm.email, this.patientForm.password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          console.log('User role from response:', response?.user?.role);

          // Validate that the user is actually a patient
          if (response?.user?.role !== 'patient') {
            console.error('Invalid role: User is not a patient');
            this.errorMessage = 'This account is not registered as a patient. Please use the doctor login form.';
            this.authService.manualLogout();
            this.isLoading = false;
            return;
          }

          // Store remember me preference
          if (this.patientForm.rememberMe) {
            localStorage.setItem('rememberedEmail', this.patientForm.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }

          // Redirect based on ACTUAL role from backend response
          this.handleSuccessfulLogin();
        },
        error: (error) => {
          console.error('Patient login error:', error);
          console.error('Error details:', {
            status: error.status,
            message: error.message,
            error: error.error
          });

          // Extract error message from backend response
          let errorMsg = 'Login failed. Please try again.';
          if (error.error) {
            if (error.error.error) {
              errorMsg = error.error.error;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error.message) {
            errorMsg = error.message;
          }

          this.errorMessage = errorMsg;
          this.isLoading = false;
        }
      });
  }

  // Doctor login
  loginAsDoctor() {
    if (!this.validateForm(this.doctorForm)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('Attempting doctor login with email:', this.doctorForm.email);

    this.authService.login(this.doctorForm.email, this.doctorForm.password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          console.log('User role from response:', response?.user?.role);

          // Validate that the user is actually a doctor
          if (response?.user?.role !== 'doctor') {
            console.error('Invalid role: User is not a doctor');
            this.errorMessage = 'This account is not registered as a doctor. Please use the patient login form.';
            this.authService.manualLogout();
            this.isLoading = false;
            return;
          }

          // Store remember me preference
          if (this.doctorForm.rememberMe) {
            localStorage.setItem('rememberedEmail', this.doctorForm.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }

          // Redirect based on ACTUAL role from backend response
          this.handleSuccessfulLogin();
        },
        error: (error) => {
          console.error('Doctor login error:', error);
          console.error('Error details:', {
            status: error.status,
            message: error.message,
            error: error.error
          });

          // Extract error message from backend response
          let errorMsg = 'Login failed. Please try again.';
          if (error.error) {
            if (error.error.error) {
              errorMsg = error.error.error;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error.message) {
            errorMsg = error.message;
          }

          this.errorMessage = errorMsg;
          this.isLoading = false;
        }
      });
  }

  // Admin login
  loginAsAdmin() {
    if (!this.validateForm(this.adminForm)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.adminForm.email, this.adminForm.password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.user?.role !== 'admin') {
            this.errorMessage = 'This account is not an admin.';
            this.authService.manualLogout();
            this.isLoading = false;
            return;
          }
          if (this.adminForm.rememberMe) {
            localStorage.setItem('rememberedEmail', this.adminForm.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          this.handleSuccessfulLogin();
        },
        error: (error) => {
          console.error('Admin login error:', error);
          let errorMsg = 'Login failed. Please try again.';
          if (error.error?.error) {
            errorMsg = error.error.error;
          } else if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.message) {
            errorMsg = error.message;
          }
          this.errorMessage = errorMsg;
          this.isLoading = false;
        }
      });
  }

  // Form validation
  private validateForm(form: { email: string; password: string }): boolean {
    if (!form.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }

    if (!this.isValidEmail(form.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    if (!form.password.trim()) {
      this.errorMessage = 'Password is required';
      return false;
    }

    if (form.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Handle successful login
  private handleSuccessfulLogin() {
    this.isLoading = false;

    // Wait a moment for the auth service to set the user data in localStorage
    // Then redirect based on the ACTUAL role from the backend response
    setTimeout(() => {
      this.redirectBasedOnRole();
    }, 100);
  }

  // Redirect based on user role (from actual user data, not form selection)
  private redirectBasedOnRole() {
    // Get the actual role from the authenticated user, not from form selection
    const role = this.authService.getUserRole();
    const token = localStorage.getItem('token');

    console.log('Redirecting based on actual user role:', role);

    // Only redirect if user is actually logged in and has a valid role
    if (!token || !role) {
      console.log('User not properly authenticated, staying on login page');
      return;
    }

    // Redirect based on ACTUAL role from backend, not which form was used
    switch (role) {
      case 'patient':
        console.log('User is a patient, redirecting to patient dashboard');
        this.router.navigate(['/patient/dashboard']).catch(err => {
          console.error('Navigation error:', err);
        });
        break;
      case 'doctor':
        console.log('User is a doctor, redirecting to doctor dashboard');
        this.router.navigate(['/doctor/dashboard']).catch(err => {
          console.error('Navigation error:', err);
        });
        break;
      case 'admin':
        console.log('User is an admin, redirecting to admin dashboard');
        this.router.navigate(['/admin/dashboard']).catch(err => {
          console.error('Navigation error:', err);
        });
        break;
      default:
        console.log('Unknown role, redirecting to home');
        this.router.navigate(['/']).catch(err => {
          console.error('Navigation error:', err);
        });
    }
  }

  // Navigate to signup with role
  goToSignup(role: string) {
    this.router.navigate(['/signup'], { queryParams: { role: role } });
  }

  // Forgot password
  forgotPassword() {
    console.log('Forgot password clicked');
    this.router.navigate(['/forgot-password'], {
      queryParams: {
        role: this.selectedRole,
        email: this.selectedRole === 'patient' ? this.patientForm.email : this.doctorForm.email
      }
    });
  }

  // Navigate back to home
  goToHome() {
    this.router.navigate(['/']);
  }
}
