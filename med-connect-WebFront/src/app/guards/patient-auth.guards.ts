import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const PatientAuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // Simple check: token exists and role is patient
  if (token && userRole === 'patient') {
    return true;
  }

  // Redirect to login
  router.navigate(['/login'], {
    queryParams: { 
      returnUrl: router.url,
      role: 'patient'
    }
  });
  return false;
};
