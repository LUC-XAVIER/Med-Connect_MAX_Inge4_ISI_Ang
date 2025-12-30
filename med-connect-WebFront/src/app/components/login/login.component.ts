import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // View state
  selectedRole: 'patient' | 'doctor' | null = null;
  showPassword = false;

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

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if role is passed via query params
    this.route.queryParams.subscribe(params => {
      if (params['role'] === 'patient' || params['role'] === 'doctor') {
        this.selectedRole = params['role'];
      }
    });
  }

  // Role selection
  selectRole(role: 'patient' | 'doctor') {
    this.selectedRole = role;
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
  }

  // Login handlers
  loginAsPatient() {
    console.log('Patient login:', this.patientForm);
    // Add your authentication logic here
    // For now, redirect to dashboard
    this.router.navigate(['/dashboard']);
  }

  loginAsDoctor() {
    console.log('Doctor login:', this.doctorForm);
    // Add your authentication logic here
    // For now, redirect to dashboard
    this.router.navigate(['/dashboard']);
  }

  // Navigate to signup with role
  goToSignup(role: string) {
    console.log('Navigate to signup for:', role);
    this.router.navigate(['/signup'], { queryParams: { role: role } });
  }

  // Forgot password
  forgotPassword() {
    console.log('Forgot password clicked');
    // Implement forgot password logic
  }

  // Navigate back to home
  goToHome() {
    this.router.navigate(['/']);
  }
}
