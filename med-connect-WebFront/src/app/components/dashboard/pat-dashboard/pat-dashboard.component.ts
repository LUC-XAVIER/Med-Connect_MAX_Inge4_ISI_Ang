import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ConnectionService } from '../../../services/connection.service';
import { AppointmentService } from '../../../services/appointment.service';
import { MessageService } from '../../../services/message.service';
import { RecordService } from '../../../services/record.service';
import { PrescriptionService } from '../../../services/prescription.service';
import { AppointmentWithDetails, AppointmentStatus } from '../../../models/appointment.model';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-pat-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, ProfileModalComponent],
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
  healthActivities: any[] = [];

  showProfileModal = false;

  constructor(
    private authService: AuthService,
    private connectionService: ConnectionService,
    private appointmentService: AppointmentService,
    private messageService: MessageService,
    private recordService: RecordService,
    private prescriptionService: PrescriptionService,
    private router: Router,
    private profilePictureService: ProfilePictureService
  ) {}

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  onProfileUpdated(): void {
    // Reload user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  getProfilePictureUrl(profilePicture: string | null | undefined): string {
    return this.profilePictureService.getProfilePictureUrl(profilePicture);
  }

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    this.loadDashboardData();
    this.loadConnectionStats();
    this.loadUnreadCount();
    this.loadRecentRecords();
    this.loadHealthActivities();
    
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

    // Load medical records
    this.loadRecentRecords();
  }

  loadRecentRecords(): void {
    this.recordService.getMyRecords({ limit: 2 }).subscribe({
      next: (records) => {
        // Handle both array and paginated response
        const recordsArray = Array.isArray(records) ? records : (records || []);
        this.recentRecords = recordsArray
          .sort((a: any, b: any) => {
            const dateA = new Date(a.record_date || a.created_at).getTime();
            const dateB = new Date(b.record_date || b.created_at).getTime();
            return dateB - dateA;
          })
          .slice(0, 2);
      },
      error: (error) => {
        console.error('Error loading recent records:', error);
        this.recentRecords = [];
      }
    });
  }

  loadHealthActivities(): void {
    // Load recent prescriptions as health activities
    this.prescriptionService.getMyPrescriptions().subscribe({
      next: (prescriptions) => {
        const activities = prescriptions.slice(0, 5).map((pres: any) => ({
          type: 'prescription',
          title: `New Prescription from ${pres.doctor_name || 'Doctor'}`,
          description: `${pres.medications?.length || 0} medication(s) prescribed`,
          date: pres.created_at || pres.prescription_date
        }));
        this.healthActivities = activities.sort((a: any, b: any) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      },
      error: (error) => {
        console.error('Error loading health activities:', error);
        this.healthActivities = [];
      }
    });
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

  // Navigate to search doctors page
  navigateToSearchDoctors(): void {
    this.router.navigate(['/patient/doctors']);
  }

  // Navigate to appointments page
  navigateToAppointments(): void {
    this.router.navigate(['/patient/appointments']);
  }

  // Navigate to records page
  navigateToRecords(): void {
    this.router.navigate(['/patient/records']);
  }

  // Navigate to messages page
  navigateToMessages(): void {
    this.router.navigate(['/patient/messages']);
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
