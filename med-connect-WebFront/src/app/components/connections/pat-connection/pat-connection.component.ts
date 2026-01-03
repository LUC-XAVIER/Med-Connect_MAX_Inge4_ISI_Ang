import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ConnectionService } from '../../../services/connection.service';
import { DoctorService } from '../../../services/doctor.service';
import { Doctor } from '../../../models/doctor.model';
import { MessageService } from '../../../services/message.service';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-pat-connections',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './pat-connection.component.html',
  styleUrl: './pat-connection.component.css'
})
export class PatConnectionsComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  stats = {
    totalDoctors: 0,
    connectedDoctors: 0,
    pendingRequests: 0,
    rejectedRequests: 0
  };

  // Doctors & Connections
  allDoctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  myConnections: any[] = [];
  isLoadingDoctors = false;
  isLoadingConnections = false;

  // Search & Filter
  doctorSearchQuery = '';
  selectedSpecialization = 'all';
  selectedTab: 'find' | 'myConnections' = 'find';

  // Modals
  showConnectionModal = false;
  selectedDoctor: Doctor | null = null;

  // Connection Request
  isSubmittingConnection = false;
  connectionSuccess = '';
  connectionError = '';

  constructor(
    private authService: AuthService,
    private connectionService: ConnectionService,
    private doctorService: DoctorService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      console.log('Current user:', this.currentUser); // Debug log
    }

    this.loadDoctors();
    this.loadMyConnections();
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

  // Load all doctors - FILTER TO SHOW ONLY VERIFIED DOCTORS
  loadDoctors(): void {
    this.isLoadingDoctors = true;
    this.doctorService.getAllDoctors().subscribe({
      next: (doctors) => {
        console.log('Loaded doctors:', doctors); // Debug log

        // Filter to show only verified doctors to prevent connection requests to unverified doctors
        this.allDoctors = Array.isArray(doctors)
          ? doctors.filter(doctor => doctor.verified)
          : [];

        this.filteredDoctors = [...this.allDoctors];
        this.stats.totalDoctors = this.allDoctors.length;
        this.isLoadingDoctors = false;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.allDoctors = [];
        this.filteredDoctors = [];
        this.isLoadingDoctors = false;
      }
    });
  }

  // Load my connections
  loadMyConnections(): void {
    this.isLoadingConnections = true;
    this.connectionService.getPatientConnections().subscribe({
      next: (connections) => {
        this.myConnections = connections;
        // Update stats
        this.stats.connectedDoctors = connections.filter(c => c.status === 'approved').length;
        this.stats.pendingRequests = connections.filter(c => c.status === 'pending').length;
        this.stats.rejectedRequests = connections.filter(c => c.status === 'rejected').length;
        this.isLoadingConnections = false;
      },
      error: (error) => {
        console.error('Error loading connections:', error);
        this.isLoadingConnections = false;
      }
    });
  }

  // Filter doctors by search query and specialization
  filterDoctors(): void {
    // Ensure allDoctors is an array
    if (!Array.isArray(this.allDoctors)) {
      console.error('allDoctors is not an array:', this.allDoctors);
      this.filteredDoctors = [];
      return;
    }

    let filtered = [...this.allDoctors];

    // Filter by specialization
    if (this.selectedSpecialization !== 'all') {
      filtered = filtered.filter(d => (d.speciality?.toLowerCase() || '') === this.selectedSpecialization.toLowerCase() ); }

    // Filter by search query
    if (this.doctorSearchQuery.trim()) {
      const query = this.doctorSearchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        (d.first_name?.toLowerCase() || '').includes(query) ||
        (d.last_name?.toLowerCase() || '').includes(query) ||
        (d.speciality?.toLowerCase() || '').includes(query)
      );
    }

    this.filteredDoctors = filtered;
    console.log('Filtered doctors:', this.filteredDoctors);
  }

  // Filter by specialization
  filterBySpecialization(specialization: string): void {
    this.selectedSpecialization = specialization;
    this.filterDoctors();
  }

  // Check if already connected to doctor
  isConnected(doctorUserId: number): boolean {
    return this.myConnections.some(c =>
      c.doctor_user_id === doctorUserId && c.status === 'approved'
    );
  }

  // Check if connection is pending
  isPending(doctorUserId: number): boolean {
    return this.myConnections.some(c =>
      c.doctor_user_id === doctorUserId && c.status === 'pending'
    );
  }

  // Get initials for avatar
  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  // Get avatar color based on ID
  getAvatarColor(userId: number): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    return colors[userId % colors.length];
  }

  // Open connection request modal
  openConnectionModal(doctor: Doctor): void {
    // Add check for doctor verification
    if (!doctor.verified) {
      alert('This doctor is not yet verified and cannot accept connection requests. Please choose a verified doctor.');
      return;
    }

    if (this.isConnected(doctor.user_id)) {
      alert('You are already connected with this doctor');
      return;
    }

    if (this.isPending(doctor.user_id)) {
      alert('Connection request is pending approval');
      return;
    }

    this.selectedDoctor = doctor;
    this.showConnectionModal = true;
    this.connectionSuccess = '';
    this.connectionError = '';
  }

  // Close connection modal
  closeConnectionModal(): void {
    this.showConnectionModal = false;
    this.selectedDoctor = null;
    this.connectionSuccess = '';
    this.connectionError = '';
  }

  // Submit connection request
  submitConnectionRequest(): void {
    if (!this.selectedDoctor) return;

    // Double-check verification before sending
    if (!this.selectedDoctor.verified) {
      this.connectionError = 'This doctor is not yet verified and cannot accept connection requests.';
      return;
    }

    this.isSubmittingConnection = true;
    this.connectionError = '';
    this.connectionSuccess = '';

    this.connectionService.requestConnection(this.selectedDoctor.user_id).subscribe({
      next: () => {
        this.connectionSuccess = 'Connection request sent successfully!';
        this.isSubmittingConnection = false;

        // Reload connections after 2 seconds and close modal
        setTimeout(() => {
          this.loadMyConnections();
          this.closeConnectionModal();
        }, 2000);
      },
      error: (err) => {
        this.connectionError = err.error?.message || 'Failed to send connection request. Please try again.';
        this.isSubmittingConnection = false;
      }
    });
  }

  // Switch tabs
  switchTab(tab: 'find' | 'myConnections'): void {
    this.selectedTab = tab;
  }

  // Get connection by doctor user ID
  getConnectionByDoctorId(doctorUserId: number): any {
    return this.myConnections.find(c => c.doctor_user_id === doctorUserId);
  }

  // Cancel connection request (for pending requests)
  cancelConnectionRequest(connection: any): void {
    if (confirm('Are you sure you want to cancel this connection request?')) {
      this.connectionService.revokeConnection(connection.connection_id).subscribe({
        next: () => {
          this.loadMyConnections();
        },
        error: (err) => {
          console.error('Error canceling request:', err);
          alert('Failed to cancel connection request');
        }
      });
    }
  }
}
