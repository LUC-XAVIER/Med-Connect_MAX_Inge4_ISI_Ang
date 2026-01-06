import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { PrescriptionService, Prescription, PrescriptionStatus } from '../../../services/prescription.service';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { interval, Subscription } from 'rxjs';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';


@Component({
  selector: 'app-patient-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, ProfileModalComponent],
  templateUrl: './patient-prescriptions.component.html',
  styleUrls: ['./patient-prescriptions.component.css']
})
export class PatientPrescriptionsComponent implements OnInit, OnDestroy {
  prescriptions: Prescription[] = [];
  filteredPrescriptions: Prescription[] = [];
  currentUser: any = null;
  isLoading = true;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  // Modal states
  showPrescriptionModal = false;
  showProfileModal = false;
  selectedPrescription: Prescription | null = null;

  // Filter states
  selectedStatus: string = 'all';
  searchQuery: string = '';

  // Status options
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: PrescriptionStatus.ACTIVE, label: 'Active' },
    { value: PrescriptionStatus.COMPLETED, label: 'Completed' },
    { value: PrescriptionStatus.CANCELLED, label: 'Cancelled' }
  ];

  // Expose enum to template
  PrescriptionStatus = PrescriptionStatus;

  constructor(
    private prescriptionService: PrescriptionService,
    private authService: AuthService,
    private messageService: MessageService,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
    this.loadPrescriptions();
    this.loadUnreadCount();
    
    // Refresh unread count every 60 seconds to avoid rate limiting
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
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  loadPrescriptions(): void {
    this.isLoading = true;
    this.prescriptionService.getMyPrescriptions().subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.prescriptions = [];
        this.filteredPrescriptions = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.prescriptions];

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === this.selectedStatus);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.medication_name?.toLowerCase() || '').includes(query) ||
        (p.doctor_name?.toLowerCase() || '').includes(query) ||
        (p.instructions?.toLowerCase() || '').includes(query)
      );
    }

    this.filteredPrescriptions = filtered;
  }

  openPrescriptionModal(prescription: Prescription): void {
    this.selectedPrescription = prescription;
    this.showPrescriptionModal = true;
  }

  closePrescriptionModal(): void {
    this.showPrescriptionModal = false;
    this.selectedPrescription = null;
  }

  getStatusClass(status: PrescriptionStatus): string {
    switch (status) {
      case PrescriptionStatus.ACTIVE: return 'status-active';
      case PrescriptionStatus.COMPLETED: return 'status-completed';
      case PrescriptionStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-active';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

