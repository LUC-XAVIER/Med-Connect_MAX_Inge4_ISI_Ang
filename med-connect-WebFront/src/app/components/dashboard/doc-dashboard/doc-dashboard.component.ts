import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../services/doctor.service';
import { AppointmentService } from '../../../services/appointment.service';
import { ConnectionService } from '../../../services/connection.service';
import { AppointmentWithDetails, AppointmentStatus } from '../../../models/appointment.model';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-doc-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatListModule,
    RouterModule,
    MatBadgeModule,
    MatProgressSpinner,
    SidebarComponent,
    FormsModule,
    ProfileModalComponent
  ],
  templateUrl: './doc-dashboard.component.html',
  styleUrls: ['./doc-dashboard.component.css']
})
export class DocDashboardComponent implements OnInit, OnDestroy {
  Math = Math;
  todayAppointments: AppointmentWithDetails[] = [];
  allAppointments: AppointmentWithDetails[] = [];
  pendingConnections: ConnectionWithDetails[] = [];
  recentPrescriptions: any[] = [];
  currentUser: any = null;
  unreadCount: number = 0;
  showProfileModal = false;
  private refreshSubscription?: Subscription;

  // Modal states
  showAppointmentModal = false;
  selectedAppointment: AppointmentWithDetails | null = null;
  appointmentNotes = '';

  // Statistics
  stats = {
    totalAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    pendingRequests: 0,
    totalPrescriptions: 0,
    onlineSessions: 0
  };

  totalRevenue = 12928;
  patientTableData: any[] = [];
  isLoading = true;

  // Expose enum to template
  AppointmentStatus = AppointmentStatus;

  constructor(
    private router: Router,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private connectionService: ConnectionService,
    private authService: AuthService,
    private messageService: MessageService,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    this.loadDashboardData();
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
    this.isLoading = true;

    let completedRequests = 0;
    const totalRequests = 3;

    const checkAllCompleted = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        this.isLoading = false;
      }
    };

    // Load appointments
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (appointments: AppointmentWithDetails[]) => {
        this.allAppointments = Array.isArray(appointments) ? appointments : [];
        const today = new Date().toISOString().split('T')[0];
        this.todayAppointments = this.allAppointments.filter(apt =>
          apt && apt.appointment_date && apt.appointment_date.toString().startsWith(today)
        );
        this.stats.totalAppointments = this.allAppointments.length;
        this.stats.todayAppointments = this.todayAppointments.length;
        checkAllCompleted();
      },
      error: (error: any) => {
        console.error('Error loading appointments:', error);
        this.allAppointments = [];
        this.todayAppointments = [];
        checkAllCompleted();
      }
    });

    // Load connections
    this.connectionService.getDoctorConnections().subscribe({
      next: (connections: ConnectionWithDetails[]) => {
        const connectionsArray = Array.isArray(connections) ? connections : [];
        this.pendingConnections = connectionsArray.filter(conn => conn && conn.status === 'pending');
        const approvedConnections = connectionsArray.filter(conn => conn && conn.status === 'approved');
        this.stats.totalPatients = approvedConnections.length;
        this.stats.pendingRequests = this.pendingConnections.length;
        this.stats.onlineSessions = this.stats.pendingRequests + approvedConnections.length;

        this.patientTableData = approvedConnections.slice(0, 10).map((conn, index) => ({
          id: `#${40320 + index}`,
          name: `${conn.patient_first_name} ${conn.patient_last_name}`,
          admit: new Date(conn.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          type: 'General',
          status: 'Active'
        }));

        if (this.patientTableData.length === 0) {
          this.patientTableData = [
            { id: '#40322', name: 'Dr. Michael Smith', admit: 'Today', type: 'Routine Checkup', status: 'Active' },
            { id: '#40323', name: 'Dr. Emily Johnson', admit: 'Aug 15, 2025', type: 'Follow-up', status: 'Active' },
          ];
        }
        checkAllCompleted();
      },
      error: (error: any) => {
        console.error('Error loading connections:', error);
        this.pendingConnections = [];
        checkAllCompleted();
      }
    });

    // Load prescriptions
    this.doctorService.getPrescriptions().subscribe({
      next: (prescriptions: any[]) => {
        const prescriptionsArray = Array.isArray(prescriptions) ? prescriptions : [];
        this.recentPrescriptions = prescriptionsArray.slice(0, 5);
        this.stats.totalPrescriptions = prescriptionsArray.length;
        checkAllCompleted();
      },
      error: (error: any) => {
        console.error('Error loading prescriptions:', error);
        this.recentPrescriptions = [];
        checkAllCompleted();
      }
    });
  }

  // Appointment Modal Methods
  openAppointmentModal(appointment: AppointmentWithDetails): void {
    this.selectedAppointment = appointment;
    this.appointmentNotes = appointment.notes || '';
    this.showAppointmentModal = true;
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.selectedAppointment = null;
    this.appointmentNotes = '';
  }

  updateAppointmentStatus(status: AppointmentStatus): void {
    if (!this.selectedAppointment) return;

    const confirmMessage = `Are you sure you want to ${status} this appointment?`;
    if (!confirm(confirmMessage)) return;

    this.appointmentService.updateAppointmentStatus(
      this.selectedAppointment.appointment_id,
      {
        status: status,
        notes: this.appointmentNotes || undefined
      }
    ).subscribe({
      next: () => {
        alert('Appointment status updated successfully');
        this.closeAppointmentModal();
        this.loadDashboardData();
      },
      error: (err: any) => {
        alert('Failed to update appointment status. Please try again.');
        console.error('Error updating status:', err);
      }
    });
  }

  // Connection Methods
  approveConnection(connectionId: number): void {
    if (!confirm('Approve this connection request?')) return;

    this.connectionService.approveConnection(connectionId).subscribe({
      next: () => {
        alert('Connection approved successfully');
        this.loadDashboardData();
      },
      error: (err: any) => {
        alert('Failed to approve connection');
        console.error('Error:', err);
      }
    });
  }

  rejectConnection(connectionId: number): void {
    if (!confirm('Reject this connection request?')) return;

    this.connectionService.rejectConnection(connectionId).subscribe({
      next: () => {
        alert('Connection rejected');
        this.loadDashboardData();
      },
      error: (err: any) => {
        alert('Failed to reject connection');
        console.error('Error:', err);
      }
    });
  }

  // Navigation Methods
  navigateToSchedule(): void {
    this.router.navigate(['/doctor/appointments']);
  }

  navigateToAppointments(): void {
    this.router.navigate(['/doctor/appointments']);
  }

  navigateToPrescriptions(): void {
    this.router.navigate(['/doctor/prescriptions']);
  }

  // NEW: Navigate to connections page
  navigateToConnections(): void {
    this.router.navigate(['/doctor/connections']);
  }

  navigateToPatients(): void {
    this.router.navigate(['/doctor/connections']); // Shows patients via connections
  }

  navigateToMessages(): void {
    this.router.navigate(['/doctor/messages']);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    // Reload user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
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
}
