import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() userRole: 'patient' | 'doctor' | 'admin' = 'patient';
  
  currentUser: any = null;
  unreadMessages = 3; // Default value, will be loaded from service
  isOpen = false; // For mobile menu toggle

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        
        // Set user role from current user if available
        if (this.currentUser?.role) {
          this.userRole = this.currentUser.role;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Load unread message count
    this.loadUnreadCount();
    
    // Subscribe to route changes to close mobile menu
    this.router.events.subscribe(() => {
      this.isOpen = false;
    });
  }

  loadUnreadCount(): void {
    // TODO: Implement actual message service call
    // For now, using a default value
    // Example:
    // this.messageService.getUnreadCount().subscribe({
    //   next: (count) => {
    //     this.unreadMessages = count;
    //   },
    //   error: (error) => {
    //     console.error('Error loading unread messages:', error);
    //     this.unreadMessages = 0;
    //   }
    // });
    
    this.unreadMessages = 3;
  }

  logout(): void {
    // Confirm logout
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) {
      return;
    }

    // Attempt to logout via API
    this.authService.logout().subscribe({
      next: () => {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
      },
      error: (error) => {
        console.error('Logout error:', error);
        
        // Even if API fails, clear local session
        this.authService.manualLogout();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
      }
    });
  }

  getDashboardRoute(): string {
    switch (this.userRole) {
      case 'patient':
        return '/patient/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  // Helper method to get user initials for avatar
  getUserInitials(): string {
    if (!this.currentUser) {
      return 'U';
    }
    
    const firstName = this.currentUser.first_name || '';
    const lastName = this.currentUser.last_name || '';
    
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    
    return firstInitial + lastInitial || 'U';
  }

  // Helper method to format user role
  getUserRoleDisplay(): string {
    if (!this.userRole) {
      return 'User';
    }
    
    return this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1);
  }

  // Helper method to get user full name
  getUserFullName(): string {
    if (!this.currentUser) {
      return 'User';
    }
    
    const firstName = this.currentUser.first_name || '';
    const lastName = this.currentUser.last_name || '';
    
    return `${firstName} ${lastName}`.trim() || 'User';
  }
}