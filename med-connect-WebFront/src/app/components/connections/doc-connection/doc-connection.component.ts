import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConnectionService } from '../../../services/connection.service';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { interval, Subscription } from 'rxjs';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';


@Component({
  selector: 'app-doc-connections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SidebarComponent,
    ProfileModalComponent
  ],
  templateUrl: './doc-connection.component.html',
  styleUrls: ['./doc-connection.component.css']
})
export class DocConnectionsComponent implements OnInit, OnDestroy {
  // Connection lists
  pendingConnections: ConnectionWithDetails[] = [];
  approvedConnections: ConnectionWithDetails[] = [];
  rejectedConnections: ConnectionWithDetails[] = [];
  allConnections: ConnectionWithDetails[] = [];

  // UI state
  isLoading = true;
  selectedTab = 0;
  searchQuery = '';
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  // Modal state
  showPatientDetailsModal = false;
  showProfileModal = false;
  selectedConnection: ConnectionWithDetails | null = null;

  constructor(
    private connectionService: ConnectionService,
    private messageService: MessageService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
    
    this.loadAllConnections();
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

  loadAllConnections(): void {
    this.isLoading = true;

    this.connectionService.getDoctorConnections().subscribe({
      next: (connections) => {
        this.allConnections = connections;
        this.filterConnections();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading connections:', error);
        this.showNotification('Failed to load connections', 'error');
        this.isLoading = false;
      }
    });
  }

  filterConnections(): void {
    this.pendingConnections = this.allConnections.filter(c => c.status === 'pending');
    this.approvedConnections = this.allConnections.filter(c => c.status === 'approved');
    this.rejectedConnections = this.allConnections.filter(c => c.status === 'rejected' || c.status === 'revoked');
  }

  get filteredPendingConnections(): ConnectionWithDetails[] {
    return this.filterBySearch(this.pendingConnections);
  }

  get filteredApprovedConnections(): ConnectionWithDetails[] {
    return this.filterBySearch(this.approvedConnections);
  }

  get filteredRejectedConnections(): ConnectionWithDetails[] {
    return this.filterBySearch(this.rejectedConnections);
  }

  filterBySearch(connections: ConnectionWithDetails[]): ConnectionWithDetails[] {
    if (!this.searchQuery.trim()) {
      return connections;
    }

    const query = this.searchQuery.toLowerCase();
    return connections.filter(conn =>
      `${conn.patient_first_name} ${conn.patient_last_name}`.toLowerCase().includes(query) ||
      conn.patient_email.toLowerCase().includes(query)
    );
  }

  approveConnection(connection: ConnectionWithDetails, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const confirmMessage = `Approve connection request from ${connection.patient_first_name} ${connection.patient_last_name}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.connectionService.approveConnection(connection.connection_id).subscribe({
      next: () => {
        this.showNotification('Connection approved successfully', 'success');
        this.loadAllConnections();
      },
      error: (error) => {
        console.error('Error approving connection:', error);
        this.showNotification('Failed to approve connection', 'error');
      }
    });
  }

  rejectConnection(connection: ConnectionWithDetails, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const confirmMessage = `Reject connection request from ${connection.patient_first_name} ${connection.patient_last_name}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.connectionService.rejectConnection(connection.connection_id).subscribe({
      next: () => {
        this.showNotification('Connection rejected', 'success');
        this.loadAllConnections();
      },
      error: (error) => {
        console.error('Error rejecting connection:', error);
        this.showNotification('Failed to reject connection', 'error');
      }
    });
  }

  revokeConnection(connection: ConnectionWithDetails, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const confirmMessage = `Revoke access for ${connection.patient_first_name} ${connection.patient_last_name}? They will lose access to shared records.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.connectionService.revokeConnection(connection.connection_id).subscribe({
      next: () => {
        this.showNotification('Connection revoked successfully', 'success');
        this.loadAllConnections();
      },
      error: (error) => {
        console.error('Error revoking connection:', error);
        this.showNotification('Failed to revoke connection', 'error');
      }
    });
  }

  viewPatientRecords(connection: ConnectionWithDetails): void {
    this.router.navigate(['/doctor/patient-records', connection.patient_id]);
  }

  openPatientDetails(connection: ConnectionWithDetails): void {
    this.selectedConnection = connection;
    this.showPatientDetailsModal = true;
  }

  closePatientDetails(): void {
    this.showPatientDetailsModal = false;
    this.selectedConnection = null;
  }

  getPatientAge(dob: Date): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warn';
      case 'approved': return 'primary';
      case 'rejected': return 'accent';
      case 'revoked': return 'accent';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'schedule';
      case 'approved': return 'check_circle';
      case 'rejected': return 'cancel';
      case 'revoked': return 'block';
      default: return 'help';
    }
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  refreshConnections(): void {
    this.loadAllConnections();
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
