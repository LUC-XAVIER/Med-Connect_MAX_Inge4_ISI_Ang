import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ConnectionService } from '../../../services/connection.service';
import { AppointmentService } from '../../../services/appointment.service';
import { MessageService } from '../../../services/message.service';
import { AppointmentWithDetails, AppointmentStatus } from '../../../models/appointment.model';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-pat-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './pat-dashboard.component.html',
  styleUrl: './pat-dashboard.component.css'
})
export class PatDashboardComponent implements OnInit, OnDestroy {
  Math = Math;
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  stats = {
    upcomingAppointments: 0,
    totalRecords: 0,
    connectedDoctors: 0,
    pendingRequests: 0
  };

  recentAppointments: any[] = [];
  recentRecords: any[] = [];

  constructor(
    private authService: AuthService,
    private connectionService: ConnectionService,
    private appointmentService: AppointmentService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    this.loadDashboardData();
    this.loadConnectionStats();
    this.loadUnreadCount();
    
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadCount = count;
      },
      error: (error: any) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  loadDashboardData(): void {
    // Load appointments
    this.appointmentService.getMyAppointments().subscribe({
      next: (appointments: AppointmentWithDetails[]) => {
        // Filter upcoming appointments (not cancelled or completed, and date >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.stats.upcomingAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          aptDate.setHours(0, 0, 0, 0);
          return apt.status !== AppointmentStatus.CANCELLED && 
                 apt.status !== AppointmentStatus.COMPLETED &&
                 aptDate >= today;
        }).length;

        // Get recent appointments (last 5, sorted by date)
        this.recentAppointments = appointments
          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
          .slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.recentAppointments = [];
      }
    });

    // TODO: Load medical records when record service is available
    this.recentRecords = [];
  }

  // Load connection statistics
  loadConnectionStats(): void {
    this.connectionService.getPatientConnections().subscribe({
      next: (connections) => {
        this.stats.connectedDoctors = connections.filter(c => c.status === 'approved').length;
        this.stats.pendingRequests = connections.filter(c => c.status === 'pending').length;
      },
      error: (error) => {
        console.error('Error loading connection stats:', error);
      }
    });
  }

  // Navigate to connections page
  navigateToConnections(): void {
    this.router.navigate(['/patient/connections']);
  }

  // Navigate to find doctors (connections page with find tab active)
  navigateToFindDoctors(): void {
    this.router.navigate(['/patient/connections']);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}
