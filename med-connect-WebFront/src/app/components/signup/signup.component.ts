import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  // View state - role will be set from query params, no selection screen
  selectedRole: 'patient' | 'doctor' | null = null;
  showPassword = false;
  showConfirmPassword = false;

  // Form data
  patientForm = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  doctorForm = {
    fullName: '',
    email: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

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

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get role from query params
    this.route.queryParams.subscribe(params => {
      if (params['role'] === 'patient' || params['role'] === 'doctor') {
        this.selectedRole = params['role'];
      } else {
        // If no role specified, redirect to home
        this.router.navigate(['/']);
      }
    });
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
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    };
    this.doctorForm = {
      fullName: '',
      email: '',
      phone: '',
      specialty: '',
      licenseNumber: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    };
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  // Validation
  validatePatientForm(): boolean {
    if (this.patientForm.password !== this.patientForm.confirmPassword) {
      alert('Passwords do not match!');
      return false;
    }
    if (!this.patientForm.agreeToTerms) {
      alert('Please agree to the Terms and Conditions');
      return false;
    }
    return true;
  }

  validateDoctorForm(): boolean {
    if (this.doctorForm.password !== this.doctorForm.confirmPassword) {
      alert('Passwords do not match!');
      return false;
    }
    if (!this.doctorForm.agreeToTerms) {
      alert('Please agree to the Terms and Conditions');
      return false;
    }
    return true;
  }

  // Signup handlers
  signupAsPatient() {
    if (!this.validatePatientForm()) return;

    console.log('Patient signup:', this.patientForm);
    // Add your registration logic here
    // For now, redirect to dashboard
    this.router.navigate(['/dashboard']);
  }

  signupAsDoctor() {
    if (!this.validateDoctorForm()) return;

    console.log('Doctor signup:', this.doctorForm);
    // Add your registration logic here
    // For now, redirect to dashboard
    this.router.navigate(['/dashboard']);
  }

  // Navigate to login with role preserved
  goToLogin() {
    if (this.selectedRole) {
      this.router.navigate(['/login'], { queryParams: { role: this.selectedRole } });
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
}
