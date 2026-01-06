import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { RecordService, MedicalRecord, CreateRecordRequest } from '../../../services/record.service';
import { ConnectionService } from '../../../services/connection.service';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { interval, Subscription } from 'rxjs';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';

@Component({
  selector: 'app-patient-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, ProfileModalComponent],
  templateUrl: './patient-records.component.html',
  styleUrls: ['./patient-records.component.css']
})
export class PatientRecordsComponent implements OnInit, OnDestroy {
  records: MedicalRecord[] = [];
  filteredRecords: MedicalRecord[] = [];
  currentUser: any = null;
  isLoading = true;
  isUploading = false;
  unreadCount: number = 0;
  errorMessage: string = '';
  successMessage: string = '';
  private refreshSubscription?: Subscription;

  // Modal states
  showUploadModal = false;
  showRecordModal = false;
  showProfileModal = false;
  showShareModal = false;
  selectedRecord: MedicalRecord | null = null;
  selectedConnection: ConnectionWithDetails | null = null;

  // Connected doctors for sharing
  connectedDoctors: ConnectionWithDetails[] = [];

  // Filter states
  selectedType: string = 'all';
  searchQuery: string = '';
  startDate: string = '';
  endDate: string = '';

  // Upload form
  uploadForm: CreateRecordRequest = {
    title: '',
    description: '',
    record_type: 'lab_result',
    record_date: new Date().toISOString().split('T')[0]
  };
  selectedFile: File | null = null;

  // Record types
  recordTypes = [
    { value: 'lab_result', label: 'Lab Result' },
    { value: 'x_ray', label: 'X-Ray' },
    { value: 'xray', label: 'X-Ray (Alt)' },
    { value: 'mri', label: 'MRI' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'doctor_note', label: 'Doctor Note' },
    { value: 'imaging_report', label: 'Imaging Report' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private recordService: RecordService,
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
    this.loadRecords();
    this.loadConnectedDoctors();
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
      next: (count: number) => {
        this.unreadCount = count;
      },
      error: (error: any) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  loadRecords(): void {
    this.isLoading = true;
    const filters: any = {};
    if (this.selectedType !== 'all') filters.record_type = this.selectedType;
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;

    this.recordService.getMyRecords(filters).subscribe({
      next: (records) => {
        // Ensure records is always an array
        this.records = Array.isArray(records) ? records : [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading records:', error);
        this.records = [];
        this.filteredRecords = [];
        this.isLoading = false;
      }
    });
  }

  loadConnectedDoctors(): void {
    this.connectionService.getPatientConnections().subscribe({
      next: (connections) => {
        this.connectedDoctors = connections.filter(c => c.status === 'approved');
      },
      error: (error) => {
        console.error('Error loading connections:', error);
        this.connectedDoctors = [];
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.records];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(query) ||
        record.description?.toLowerCase().includes(query) ||
        record.record_type.toLowerCase().includes(query)
      );
    }

    this.filteredRecords = filtered;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
      
      if (!isValidType) {
        alert('Invalid file type. Only PDF, JPG, and PNG files are allowed.');
        input.value = ''; // Clear the input
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (10MB = 10485760 bytes)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File size exceeds 10MB limit. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        input.value = ''; // Clear the input
        this.selectedFile = null;
        return;
      }
      
      this.selectedFile = file;
    }
  }

  openUploadModal(): void {
    this.showUploadModal = true;
    this.uploadForm = {
      title: '',
      description: '',
      record_type: 'lab_result',
      record_date: new Date().toISOString().split('T')[0]
    };
    this.selectedFile = null;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedFile = null;
  }

  uploadRecord(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      return;
    }

    if (!this.uploadForm.title.trim()) {
      this.errorMessage = 'Please enter a title';
      return;
    }

    this.isUploading = true;
    this.recordService.uploadRecord(this.selectedFile, this.uploadForm).subscribe({
      next: () => {
        this.successMessage = 'Record uploaded successfully!';
        setTimeout(() => {
          this.successMessage = '';
          this.closeUploadModal();
          this.loadRecords();
        }, 2000);
        this.isUploading = false;
      },
      error: (error: any) => {
        let errorMsg = 'Failed to upload record. Please try again.';
        if (error.error?.errors && Array.isArray(error.error.errors)) {
          errorMsg = error.error.errors.map((e: any) => e.msg).join(', ');
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error?.error) {
          errorMsg = error.error.error;
        }
        this.errorMessage = errorMsg;
        console.error('Error uploading record:', error);
        this.isUploading = false;
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  openRecordModal(record: MedicalRecord): void {
    this.selectedRecord = record;
    this.showRecordModal = true;
  }

  closeRecordModal(): void {
    this.showRecordModal = false;
    this.selectedRecord = null;
  }

  openShareModal(record: MedicalRecord): void {
    this.selectedRecord = record;
    this.showShareModal = true;
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedRecord = null;
    this.selectedConnection = null;
  }

  shareRecord(connection: ConnectionWithDetails): void {
    if (!this.selectedRecord) return;

    this.errorMessage = '';
    this.successMessage = '';

    // Ensure record_id is a string
    const recordId = String(this.selectedRecord.record_id);
    
    this.connectionService.shareRecords(connection.connection_id, [recordId]).subscribe({
      next: () => {
        this.successMessage = 'Record shared successfully!';
        setTimeout(() => {
          this.successMessage = '';
          this.closeShareModal();
        }, 2000);
      },
      error: (error: any) => {
        let errorMsg = 'Failed to share record. Please try again.';
        if (error.error?.errors && Array.isArray(error.error.errors)) {
          errorMsg = error.error.errors.map((e: any) => e.msg || e.message).join(', ');
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error?.error) {
          errorMsg = error.error.error;
        }
        this.errorMessage = errorMsg;
        console.error('Error sharing record:', error);
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  deleteRecord(record: MedicalRecord): void {
    if (!confirm(`Are you sure you want to delete "${record.title}"?`)) return;

    this.recordService.deleteRecord(record.record_id).subscribe({
      next: () => {
        alert('Record deleted successfully');
        this.loadRecords();
        if (this.selectedRecord?.record_id === record.record_id) {
          this.closeRecordModal();
        }
      },
      error: (error: any) => {
        const errorMessage = error.error?.message || 'Failed to delete record. Please try again.';
        alert(errorMessage);
        console.error('Error deleting record:', error);
      }
    });
  }

  downloadRecord(record: MedicalRecord): void {
    if (record.file_url) {
      window.open(record.file_url, '_blank');
    } else if (record.file_path) {
      const fileUrl = this.recordService.getFileUrl(record.file_path);
      window.open(fileUrl, '_blank');
    } else {
      alert('File URL not available');
    }
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRecordTypeLabel(type: string): string {
    const recordType = this.recordTypes.find(rt => rt.value === type);
    return recordType?.label || type;
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

