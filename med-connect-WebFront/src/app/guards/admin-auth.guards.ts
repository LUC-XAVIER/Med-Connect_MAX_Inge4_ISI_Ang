import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminAuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (token && userRole === 'admin') {
    return true;
  }

  if (token && userRole !== 'admin') {
    authService.manualLogout();
  }

  router.navigate(['/admin/login'], {
    queryParams: {
      returnUrl: router.url,
      role: 'admin'
    }
  });
  return false;
};
