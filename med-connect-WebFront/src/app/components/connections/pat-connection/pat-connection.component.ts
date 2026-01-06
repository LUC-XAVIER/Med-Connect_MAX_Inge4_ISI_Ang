import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ConnectionService } from '../../../services/connection.service';
import { MessageService } from '../../../services/message.service';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';

@Component({
  selector: 'app-pat-connections',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule, ProfileModalComponent],
  templateUrl: './pat-connection.component.html',
  styleUrls: ['./pat-connection.component.css']
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

  myConnections: any[] = [];
  filteredConnections: any[] = [];
  isLoadingConnections = false;
  connectionSearchQuery = '';

  showProfileModal = false;
  selectedDoctor: any = null;

  isSubmittingConnection = false;
  connectionSuccess = '';
  connectionError = '';

  constructor(
    private authService: AuthService,
    private connectionService: ConnectionService,
    private messageService: MessageService,
    public router: Router,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

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

  loadMyConnections(): void {
    this.isLoadingConnections = true;
    this.connectionService.getPatientConnections().subscribe({
      next: (connections) => {
        this.myConnections = connections;
        this.stats.connectedDoctors = connections.filter(c => c.status === 'approved').length;
        this.stats.pendingRequests = connections.filter(c => c.status === 'pending').length;
        this.stats.rejectedRequests = connections.filter(c => c.status === 'rejected').length;
        this.stats.totalDoctors = this.stats.connectedDoctors;
        this.applyConnectionFilter();
        this.isLoadingConnections = false;
      },
      error: (error) => {
        console.error('Error loading connections:', error);
        this.isLoadingConnections = false;
      }
    });
  }

  applyConnectionFilter(): void {
    const approved = this.myConnections.filter(c => c.status === 'approved');
    if (!this.connectionSearchQuery.trim()) {
      this.filteredConnections = approved;
      return;
    }
    const query = this.connectionSearchQuery.toLowerCase();
    this.filteredConnections = approved.filter(c =>
      `${c.doctor_first_name} ${c.doctor_last_name}`.toLowerCase().includes(query) ||
      c.doctor_specialization?.toLowerCase().includes(query) ||
      c.doctor_hospital?.toLowerCase().includes(query)
    );
  }

  isConnected(doctorUserId: number): boolean {
    return this.myConnections.some(c =>
      c.doctor_user_id === doctorUserId && c.status === 'approved'
    );
  }

  isPending(doctorUserId: number): boolean {
    return this.myConnections.some(c =>
      c.doctor_user_id === doctorUserId && c.status === 'pending'
    );
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

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

  getConnectionByDoctorId(doctorUserId: number): any {
    return this.myConnections.find(c => c.doctor_user_id === doctorUserId);
  }

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

  navigateToMessages(doctorUserId: number): void {
    this.router.navigate(['/patient/messages'], { queryParams: { userId: doctorUserId } });
  }

  navigateToAppointments(doctorUserId: number): void {
    this.router.navigate(['/patient/appointments'], { queryParams: { doctorId: doctorUserId } });
  }

  getProfilePictureUrl(profilePicture: string | null | undefined): string {
    return this.profilePictureService.getProfilePictureUrl(profilePicture || '');
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  onProfileUpdated(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }
}
