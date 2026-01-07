import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, PatientRegisterData, DoctorRegisterData } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // View state - role will be set from query params
  selectedRole: 'patient' | 'doctor' | null = null;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Field-specific errors
  fieldErrors: {
    patient?: { [key: string]: string };
    doctor?: { [key: string]: string };
  } = {};

  // Form data
  patientForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    bloodtype: '' as string | undefined,
    address: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  doctorForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    hospitalAffiliation: '',
    bio: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  successAlert = '';
  infoAlert = '';

  // Medical specialties for doctor dropdown
  specialties = [
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Psychiatrist',
    'Orthopedic Surgeon',
    'Neurologist',
    'Oncologist',
    'Gynecologist',
    'Ophthalmologist',
    'Other'
  ];

  // Blood types
  bloodTypes = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get role from query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['role'] === 'patient' || params['role'] === 'doctor') {
          this.selectedRole = params['role'];
        } else {
          // If no role specified, redirect to home
          this.router.navigate(['/']);
        }
      });

    // Load remembered email if any
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      if (this.selectedRole === 'patient') {
        this.patientForm.email = rememberedEmail;
      } else if (this.selectedRole === 'doctor') {
        this.doctorForm.email = rememberedEmail;
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Reset forms
  resetForms() {
    this.patientForm = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      bloodtype: '',
      address: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    };

    this.doctorForm = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialty: '',
      licenseNumber: '',
      hospitalAffiliation: '',
      bio: '',
      address: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    };

    this.showPassword = false;
    this.showConfirmPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = false;
  }

  // Field-specific error helpers
  private setFieldError(role: 'patient' | 'doctor', field: string, message: string): void {
    if (!this.fieldErrors[role]) {
      this.fieldErrors[role] = {};
    }
    this.fieldErrors[role]![field] = message;
  }

  private clearFieldErrors(role: 'patient' | 'doctor'): void {
    this.fieldErrors[role] = {};
    this.errorMessage = '';
  }

  getFieldError(role: 'patient' | 'doctor', field: string): string | undefined {
    return this.fieldErrors[role]?.[field];
  }

  // Validation methods
  validatePatientForm(): { valid: boolean; errors: string[] } {
    this.clearFieldErrors('patient');
    const errors: string[] = [];

    // Required fields
    if (!this.patientForm.firstName.trim()) {
      this.setFieldError('patient', 'firstName', 'First name is required');
      errors.push('First name is required');
    }
    if (!this.patientForm.lastName.trim()) {
      this.setFieldError('patient', 'lastName', 'Last name is required');
      errors.push('Last name is required');
    }
    if (!this.patientForm.email.trim()) {
      this.setFieldError('patient', 'email', 'Email is required');
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.patientForm.email)) {
      this.setFieldError('patient', 'email', 'Please enter a valid email');
      errors.push('Please enter a valid email');
    }
    if (!this.patientForm.dateOfBirth) {
      this.setFieldError('patient', 'dateOfBirth', 'Date of birth is required');
      errors.push('Date of birth is required');
    }
    if (!this.patientForm.phone.trim()) {
      this.setFieldError('patient', 'phone', 'Phone number is required');
      errors.push('Phone number is required');
    }
    if (!this.patientForm.password) {
      this.setFieldError('patient', 'password', 'Password is required');
      errors.push('Password is required');
    }
    if (!this.patientForm.confirmPassword) {
      this.setFieldError('patient', 'confirmPassword', 'Confirm password is required');
      errors.push('Confirm password is required');
    }

    // Password validation
    if (this.patientForm.password && this.patientForm.confirmPassword) {
      if (this.patientForm.password !== this.patientForm.confirmPassword) {
        this.setFieldError('patient', 'confirmPassword', 'Passwords do not match');
        errors.push('Passwords do not match');
      }

      const passwordValidation = this.authService.validatePassword(this.patientForm.password);
      if (!passwordValidation.valid) {
        this.setFieldError('patient', 'password', passwordValidation.errors.join(', '));
        errors.push(...passwordValidation.errors);
      }
    }

    // Date validation
    if (this.patientForm.dateOfBirth) {
      const dob = new Date(this.patientForm.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      if (age < 0 || age > 150) {
        this.setFieldError('patient', 'dateOfBirth', 'Invalid date of birth');
        errors.push('Invalid date of birth');
      } else if (age < 13) {
        this.setFieldError('patient', 'dateOfBirth', 'You must be at least 13 years old to register');
        errors.push('You must be at least 13 years old to register');
      }
    }

    // Terms agreement
    if (!this.patientForm.agreeToTerms) {
      this.setFieldError('patient', 'agreeToTerms', 'You must agree to the Terms and Conditions');
      errors.push('You must agree to the Terms and Conditions');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateDoctorForm(): { valid: boolean; errors: string[] } {
    this.clearFieldErrors('doctor');
    const errors: string[] = [];

    // Required fields
    if (!this.doctorForm.firstName.trim()) {
      this.setFieldError('doctor', 'firstName', 'First name is required');
      errors.push('First name is required');
    }
    if (!this.doctorForm.lastName.trim()) {
      this.setFieldError('doctor', 'lastName', 'Last name is required');
      errors.push('Last name is required');
    }
    if (!this.doctorForm.email.trim()) {
      this.setFieldError('doctor', 'email', 'Email is required');
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.doctorForm.email)) {
      this.setFieldError('doctor', 'email', 'Please enter a valid email');
      errors.push('Please enter a valid email');
    }
    if (!this.doctorForm.phone.trim()) {
      this.setFieldError('doctor', 'phone', 'Phone number is required');
      errors.push('Phone number is required');
    }
    if (!this.doctorForm.specialty) {
      this.setFieldError('doctor', 'specialty', 'Specialty is required');
      errors.push('Specialty is required');
    }
    if (!this.doctorForm.licenseNumber.trim()) {
      this.setFieldError('doctor', 'licenseNumber', 'License number is required');
      errors.push('License number is required');
    }
    if (!this.doctorForm.password) {
      this.setFieldError('doctor', 'password', 'Password is required');
      errors.push('Password is required');
    }
    if (!this.doctorForm.confirmPassword) {
      this.setFieldError('doctor', 'confirmPassword', 'Confirm password is required');
      errors.push('Confirm password is required');
    }

    // Password validation
    if (this.doctorForm.password && this.doctorForm.confirmPassword) {
      if (this.doctorForm.password !== this.doctorForm.confirmPassword) {
        this.setFieldError('doctor', 'confirmPassword', 'Passwords do not match');
        errors.push('Passwords do not match');
      }

      const passwordValidation = this.authService.validatePassword(this.doctorForm.password);
      if (!passwordValidation.valid) {
        this.setFieldError('doctor', 'password', passwordValidation.errors.join(', '));
        errors.push(...passwordValidation.errors);
      }
    }

    // Terms agreement
    if (!this.doctorForm.agreeToTerms) {
      this.setFieldError('doctor', 'agreeToTerms', 'You must agree to the Terms and Conditions');
      errors.push('You must agree to the Terms and Conditions');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Signup handlers
  signupAsPatient() {
    console.log('signupAsPatient called');
    console.log('Patient form data:', this.patientForm);

    const validation = this.validatePatientForm();
    console.log('Validation result:', validation);

    if (!validation.valid) {
      this.errorMessage = validation.errors.join(', ');
      this.successMessage = '';
      this.successAlert = '';
      this.infoAlert = '';
      console.error('Form validation failed:', validation.errors);
      return;
    }

    console.log('Form is valid, proceeding with registration...');

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.successAlert = '';
    this.infoAlert = '';
    this.clearFieldErrors('patient');

    const patientData: PatientRegisterData = {
      first_name: this.patientForm.firstName,
      last_name: this.patientForm.lastName,
      email: this.patientForm.email,
      password: this.patientForm.password,
      contact: this.patientForm.phone,
      address: this.patientForm.address || undefined,
      dob: this.patientForm.dateOfBirth,
      gender: this.patientForm.gender,
      bloodtype: this.patientForm.bloodtype || undefined
    };

    this.authService.registerPatient(patientData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Registration successful! Your account has been created.';
          this.successAlert = this.successMessage;
          localStorage.setItem('rememberedEmail', this.patientForm.email);
          this.autoLoginAfterRegistration(this.patientForm.email, this.patientForm.password);
        },
        error: (error) => {
          let errorMsg = 'Registration failed. Please check inputs and try again.';
          if (error.error) {
            if (error.error.error) {
              errorMsg = error.error.error;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            } else if (Array.isArray(error.error.errors)) {
              errorMsg = error.error.errors.map((e: any) => e.msg || e.message).join(', ');
            }
          } else if (error.message) {
            errorMsg = error.message;
          }
          this.errorMessage = errorMsg;
          this.isLoading = false;
        }
      });
  }

  signupAsDoctor() {
    console.log('signupAsDoctor called');
    console.log('Doctor form data:', this.doctorForm);

    const validation = this.validateDoctorForm();
    console.log('Validation result:', validation);

    if (!validation.valid) {
      this.errorMessage = validation.errors.join(', ');
      this.successMessage = '';
      this.successAlert = '';
      this.infoAlert = '';
      console.error('Form validation failed:', validation.errors);
      return;
    }

    console.log('Form is valid, proceeding with registration...');

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.successAlert = '';
    this.infoAlert = '';
    this.clearFieldErrors('doctor');

    const doctorData: DoctorRegisterData = {
      first_name: this.doctorForm.firstName,
      last_name: this.doctorForm.lastName,
      email: this.doctorForm.email,
      password: this.doctorForm.password,
      contact: this.doctorForm.phone,
      address: this.doctorForm.address || undefined,
      specialty: this.doctorForm.specialty,
      license_number: this.doctorForm.licenseNumber,
      hospital_affiliation: this.doctorForm.hospitalAffiliation || undefined,
      bio: this.doctorForm.bio || undefined
    };

    this.authService.registerDoctor(doctorData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Registration successful! Your account is pending verification. You will receive an email once verified.';
          this.successAlert = this.successMessage;
          this.infoAlert = 'Admin must verify you for better experience.';
          localStorage.setItem('rememberedEmail', this.doctorForm.email);
          this.autoLoginAfterRegistration(this.doctorForm.email, this.doctorForm.password);
        },
        error: (error) => {
          let errorMsg = 'Registration failed. Please check inputs and try again.';
          if (error.error) {
            if (error.error.error) {
              errorMsg = error.error.error;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            } else if (Array.isArray(error.error.errors)) {
              errorMsg = error.error.errors.map((e: any) => e.msg || e.message).join(', ');
            }
          } else if (error.message) {
            errorMsg = error.message;
          }
          this.errorMessage = errorMsg;
          this.isLoading = false;
        }
      });
  }

  private autoLoginAfterRegistration(email: string, password: string) {
    this.authService.login(email, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          setTimeout(() => {
            this.redirectBasedOnRole();
          }, 500);
        },
        error: (error) => {
          this.isLoading = false;
          const message = error?.message || 'Login failed after registration. Please sign in.';
          this.infoAlert = message;
          this.router.navigate(['/login'], {
            queryParams: {
              role: this.selectedRole,
              email: email
            }
          });
        }
      });
  }

  private redirectBasedOnRole() {
    const role = this.authService.getUserRole();

    switch (role) {
      case 'patient':
        this.router.navigate(['/patient/dashboard']);
        break;
      case 'doctor':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  // Navigate to login with role preserved
  goToLogin() {
    if (this.selectedRole) {
      this.router.navigate(['/login'], {
        queryParams: {
          role: this.selectedRole
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Navigate back to home
  goToHome() {
    this.router.navigate(['/']);
  }

  // Back to home (replaces back to selection)
  backToHome() {
    this.router.navigate(['/']);
  }

  // Add this method to debug the form
  debugForm() {
    console.log('=== DEBUG FORM ===');
    console.log('Selected role:', this.selectedRole);
    console.log('IsLoading:', this.isLoading);

    if (this.selectedRole === 'patient') {
      console.log('Patient Form Data:', this.patientForm);
      console.log('Form Validation:', this.validatePatientForm());

      // Check if form is complete
      const isComplete =
        this.patientForm.firstName &&
        this.patientForm.lastName &&
        this.patientForm.email &&
        this.patientForm.phone &&
        this.patientForm.dateOfBirth &&
        this.patientForm.password &&
        this.patientForm.confirmPassword &&
        this.patientForm.agreeToTerms;

      console.log('Form Complete:', isComplete);
      console.log('Passwords match:', this.patientForm.password === this.patientForm.confirmPassword);
    } else if (this.selectedRole === 'doctor') {
      console.log('Doctor Form Data:', this.doctorForm);
      console.log('Form Validation:', this.validateDoctorForm());

      // Check if form is complete
      const isComplete =
        this.doctorForm.firstName &&
        this.doctorForm.lastName &&
        this.doctorForm.email &&
        this.doctorForm.phone &&
        this.doctorForm.specialty &&
        this.doctorForm.licenseNumber &&
        this.doctorForm.password &&
        this.doctorForm.confirmPassword &&
        this.doctorForm.agreeToTerms;

      console.log('Form Complete:', isComplete);
      console.log('Passwords match:', this.doctorForm.password === this.doctorForm.confirmPassword);
    }

    // Try to manually trigger the signup
    if (this.selectedRole === 'patient') {
      console.log('Attempting to trigger patient signup...');
      this.signupAsPatient();
    } else if (this.selectedRole === 'doctor') {
      console.log('Attempting to trigger doctor signup...');
      this.signupAsDoctor();
    }
  }
}
