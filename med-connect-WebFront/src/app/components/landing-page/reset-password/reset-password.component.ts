import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../../../services/password-reset.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  message = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }


  submit(): void {
    if (!this.token) {
      this.error = 'Reset token is missing or expired.';
      return;
    }
    if (!this.password.trim() || this.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.passwordResetService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.message = 'Password reset successfully. You can now login.';
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        console.error('Reset error:', err);
        this.error = err.error?.message || 'Reset link invalid or expired.';
        this.isLoading = false;
      }
    });
  }
}

