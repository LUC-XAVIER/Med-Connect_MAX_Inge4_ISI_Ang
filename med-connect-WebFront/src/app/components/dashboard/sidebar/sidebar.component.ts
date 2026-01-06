import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() userRole: 'patient' | 'doctor' | 'admin' = 'patient';

  currentUser: any = null;
  unreadMessages = 0; // TODO: Load from message service

  constructor(private authService: AuthService) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    // TODO: Load unread message count
    this.loadUnreadCount();
  }

  loadUnreadCount(): void {
    // TODO: Implement message service call
    this.unreadMessages = 0;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        window.location.href = '/';
      },
      error: () => {
        // Even if logout fails, clear local session
        this.authService.manualLogout();
        window.location.href = '/';
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
}

