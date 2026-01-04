import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { RecordService, MedicalRecord } from '../../../services/record.service';
import { ConnectionService } from '../../../services/connection.service';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './doctor-records.component.html',
  styleUrls: ['./doctor-records.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DoctorRecordsComponent implements OnInit, OnDestroy {
  // Patient records data
  patientRecords: MedicalRecord[] = [];
  filteredRecords: MedicalRecord[] = [];
  selectedPatient: ConnectionWithDetails | null = null;
  patientInfo: any = null;
  shareAll: boolean = false;

  // Connected patients list
  connectedPatients: ConnectionWithDetails[] = [];

  // UI state
  isLoading = true;
  isLoadingRecords = false;
  showPatientModal = false;
  showRecordModal = false;
  selectedRecord: MedicalRecord | null = null;
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  // Filter states
  selectedType: string = 'all';
  searchQuery: string = '';
  startDate: string = '';
  endDate: string = '';

  // Record types
  recordTypes = [
    { value: 'all', label: 'All Types' },
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
    private connectionService: ConnectionService,
    private recordService: RecordService,
    private authService: AuthService,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    this.loadUnreadCount();
    // Refresh unread count every 60 seconds to avoid rate limiting
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadUnreadCount();
    });

    // Check if patientUserId is provided in route params
    this.route.queryParams.subscribe(params => {
      if (params['patientUserId']) {
        const patientUserId = parseInt(params['patientUserId'], 10);
        this.loadConnectedPatients().then(() => {
          const connection = this.connectedPatients.find(c =>
            c.patient_user_id === patientUserId
          );
          if (connection) {
            this.viewPatientRecords(connection);
          }
        });
      } else {
        this.loadConnectedPatients();
      }
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

  loadConnectedPatients(): Promise<void> {
    return new Promise((resolve) => {
      this.isLoading = true;
      this.connectionService.getDoctorConnections('approved').subscribe({
        next: (connections) => {
          this.connectedPatients = connections.filter(c => c.status === 'approved');
          this.isLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading patients:', error);
          this.connectedPatients = [];
          this.isLoading = false;
          resolve();
        }
      });
    });
  }

  viewPatientRecords(connection: ConnectionWithDetails): void {
    if (!connection.patient_user_id) {
      alert('Patient user ID not available');
      return;
    }

    this.selectedPatient = connection;
    this.isLoadingRecords = true;
    this.patientRecords = [];
    this.filteredRecords = [];

    this.connectionService.viewPatientRecords(connection.patient_user_id).subscribe({
      next: (response) => {
        console.log('Patient records response:', response);

        // Handle response structure
        if (response.records && Array.isArray(response.records)) {
          this.patientRecords = response.records;
          this.shareAll = response.share_all || false;
        } else if (Array.isArray(response)) {
          this.patientRecords = response;
          this.shareAll = true;
        } else {
          this.patientRecords = [];
        }

        this.patientInfo = response.patient_info || {
          first_name: connection.patient_first_name,
          last_name: connection.patient_last_name,
          email: connection.patient_email,
          dob: connection.patient_dob,
          gender: connection.patient_gender,
          bloodtype: connection.patient_bloodtype
        };

        this.applyFilters();
        this.isLoadingRecords = false;
      },
      error: (error) => {
        console.error('Error loading patient records:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to load patient records';
        alert(errorMsg);
        this.isLoadingRecords = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.patientRecords];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(query) ||
        record.description?.toLowerCase().includes(query) ||
        record.record_type.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(record => record.record_type === this.selectedType);
    }

    // Date filters
    if (this.startDate) {
      filtered = filtered.filter(record => record.record_date >= this.startDate);
    }
    if (this.endDate) {
      filtered = filtered.filter(record => record.record_date <= this.endDate);
    }

    this.filteredRecords = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = 'all';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  openRecordModal(record: MedicalRecord): void {
    this.selectedRecord = record;
    this.showRecordModal = true;
  }

  closeRecordModal(): void {
    this.showRecordModal = false;
    this.selectedRecord = null;
  }

  downloadRecord(record: MedicalRecord): void {
    if (record.file_url) {
      window.open(record.file_url, '_blank');
    } else if (record.file_path) {
      window.open(record.file_path, '_blank');
    } else {
      alert('File URL not available');
    }
  }

  getPatientDisplayName(connection: any): string {
    return `${connection.patient_first_name} ${connection.patient_last_name}`;
  }

  getRecordFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
