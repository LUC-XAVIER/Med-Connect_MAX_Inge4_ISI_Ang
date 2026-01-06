import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasswordResetService } from '../../../services/password-reset.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  message = '';
  error = '';

  constructor(
    private passwordResetService: PasswordResetService,
    private router: Router
  ) {}

  submit(): void {
    if (!this.email.trim()) {
      this.error = 'Email is required';
      return;
    }
    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.passwordResetService.requestReset(this.email.trim()).subscribe({
      next: () => {
        this.message = 'If the email exists, a reset link has been sent.';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Reset request error:', err);
        this.error = err.error?.message || 'Failed to send reset email';
        this.isLoading = false;
      }
    });
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}

