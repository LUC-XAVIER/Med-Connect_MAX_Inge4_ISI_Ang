import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminAuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  const isLoggedIn = authService.isLoggedIn();
  
  // Check role from localStorage directly as well
  const userRole = authService.getUserRole();
  const isAdmin = userRole === 'admin';
  
  console.log('AdminAuthGuard check:', { 
    isLoggedIn, 
    isAdmin, 
    role: userRole,
    token: !!localStorage.getItem('token')
  });

  // Only allow access if logged in AND has admin role
  if (isLoggedIn && isAdmin) {
    return true;
  }

  // Clear invalid session if token exists but user is not logged in or wrong role
  if (!isLoggedIn || !isAdmin) {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Invalid session detected, clearing...');
      authService.manualLogout();
    }
  }

  // Redirect to login with return URL
  router.navigate(['/login'], {
    queryParams: { 
      returnUrl: router.url,
      role: 'admin'
    }
  });
  return false;
};
