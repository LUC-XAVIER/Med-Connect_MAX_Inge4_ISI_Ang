import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { PrescriptionService, Prescription, PrescriptionStatus, CreatePrescriptionRequest } from '../../../services/prescription.service';
import { ConnectionService } from '../../../services/connection.service';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentWithDetails } from '../../../models/appointment.model';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { NotificationService } from '../../../services/notification.service';
import { interval, Subscription } from 'rxjs';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';


@Component({
  selector: 'app-doctor-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, ProfileModalComponent],
  templateUrl: './doctor-prescriptions.component.html',
  styleUrls: ['./doctor-prescriptions.component.css']
})
export class DoctorPrescriptionsComponent implements OnInit, OnDestroy {
  prescriptions: Prescription[] = [];
  filteredPrescriptions: Prescription[] = [];
  currentUser: any = null;
  isLoading = true;
  isCreating = false;
  isLoadingPatients = false;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  // Error and success messages
  errorMessage: string = '';
  successMessage: string = '';

  // Modal states
  showPrescriptionModal = false;
  showCreateModal = false;
  showProfileModal = false;
  selectedPrescription: Prescription | null = null;

  // Connected patients for dropdown
  connectedPatients: ConnectionWithDetails[] = [];
  recentAppointments: AppointmentWithDetails[] = [];

  // Filter states
  selectedStatus: string = 'all';
  searchQuery: string = '';

  // Create form
  createForm: any = {
    patient_user_id: null,
    appointment_id: undefined,
    diagnosis: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    notes: ''
  };

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
    private connectionService: ConnectionService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private messageService: MessageService,
    private notificationService: NotificationService,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
    this.loadPrescriptions();
    this.loadConnectedPatients();
    this.loadRecentAppointments();
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

  loadConnectedPatients(): void {
    this.isLoadingPatients = true;
    this.connectionService.getDoctorConnections().subscribe({
      next: (connections) => {
        console.log('All connections received:', connections);
        console.log('Connection details:', connections.map(c => ({
          status: c.status,
          patient_user_id: c.patient_user_id,
          patient_id: c.patient_id,
          name: `${c.patient_first_name} ${c.patient_last_name}`
        })));
        
        // Filter approved connections only - show all approved regardless of patient_user_id
        this.connectedPatients = connections.filter(c => c.status === 'approved');
        
        // Log for debugging
        console.log('Filtered connected patients:', this.connectedPatients.map(c => ({
          name: `${c.patient_first_name} ${c.patient_last_name}`,
          patient_user_id: c.patient_user_id,
          patient_id: c.patient_id,
          status: c.status
        })));
        
        this.isLoadingPatients = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.connectedPatients = [];
        this.isLoadingPatients = false;
      }
    });
  }

  loadRecentAppointments(): void {
    this.appointmentService.getMyAppointments('confirmed').subscribe({
      next: (appointments) => {
        // Get recent confirmed appointments
        this.recentAppointments = appointments
          .filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
          .slice(0, 10);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.recentAppointments = [];
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
        p.medication_name?.toLowerCase().includes(query) ||
        p.patient_name?.toLowerCase().includes(query) ||
        p.instructions?.toLowerCase().includes(query)
      );
    }

    this.filteredPrescriptions = filtered;
  }

  openCreateModal(): void {
    if (this.connectedPatients.length === 0) {
      alert('You have no connected patients yet. Please wait for patients to connect with you first.');
      return;
    }
    this.showCreateModal = true;
    this.createForm = {
      patient_user_id: null,
      appointment_id: undefined,
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.createForm = {
      patient_user_id: null,
      appointment_id: undefined,
      diagnosis: '',
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      notes: ''
    };
  }

  createPrescription(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate patient selection
    const patientUserId = this.createForm.patient_user_id;
    if (!patientUserId || patientUserId === null) {
      this.errorMessage = 'Please select a patient';
      return;
    }

    // Find the connection to get patient_id
    const connection = this.connectedPatients.find(c => 
      c.patient_user_id === patientUserId || c.patient_id === patientUserId
    );

    if (!connection || !connection.patient_id) {
      this.errorMessage = 'Invalid patient selection. Please select a valid patient.';
      return;
    }

    // Validate required fields
    if (!this.createForm.diagnosis.trim() || this.createForm.diagnosis.trim().length < 10) {
      this.errorMessage = 'Please enter a diagnosis (minimum 10 characters)';
      return;
    }

    if (!this.createForm.medication_name.trim() || !this.createForm.dosage.trim() || 
        !this.createForm.frequency.trim() || !this.createForm.duration.trim()) {
      this.errorMessage = 'Please fill in all medication fields';
      return;
    }

    // Prepare request body matching backend validation
    // Backend expects: patient_id, diagnosis, medications array
    const prescriptionData = {
      patient_id: connection.patient_id, // Backend expects patient_id, not patient_user_id
      diagnosis: this.createForm.diagnosis.trim(),
      notes: this.createForm.notes?.trim() || undefined,
      medications: [{
        medication_name: this.createForm.medication_name.trim(),
        dosage: this.createForm.dosage.trim(),
        frequency: this.createForm.frequency.trim(),
        duration: this.createForm.duration.trim(),
        instructions: this.createForm.instructions?.trim() || undefined
      }],
      appointment_id: this.createForm.appointment_id ? (typeof this.createForm.appointment_id === 'string' ? parseInt(this.createForm.appointment_id, 10) : this.createForm.appointment_id) : undefined
    };

    console.log('Creating prescription with data:', prescriptionData);

    this.errorMessage = '';
    this.successMessage = '';
    this.isCreating = true;
    this.prescriptionService.createPrescription(prescriptionData as any).subscribe({
      next: (prescription) => {
        // Send notification to patient
        if (patientUserId) {
          this.notificationService.createNotification({
            user_id: patientUserId,
            title: 'New Prescription',
            message: `Dr. ${this.currentUser?.first_name} ${this.currentUser?.last_name} has prescribed ${prescriptionData.medications[0]?.medication_name || 'medication'} for you`,
            type: 'prescription',
            data: prescription
          }).subscribe({
            next: () => console.log('Notification sent'),
            error: (err) => console.warn('Failed to send notification:', err)
          });
        }
        this.successMessage = 'Prescription created successfully! Patient will be notified.';
        setTimeout(() => {
          this.successMessage = '';
          this.closeCreateModal();
          this.loadPrescriptions();
        }, 2000);
        this.isCreating = false;
      },
      error: (err: any) => {
        let errorMsg = 'Failed to create prescription. Please try again.';
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          errorMsg = err.error.errors.map((e: any) => e.msg).join(', ');
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.error) {
          errorMsg = err.error.error;
        }
        this.errorMessage = errorMsg;
        console.error('Error creating prescription:', err);
        this.isCreating = false;
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  openPrescriptionModal(prescription: Prescription): void {
    this.selectedPrescription = prescription;
    this.showPrescriptionModal = true;
  }

  closePrescriptionModal(): void {
    this.showPrescriptionModal = false;
    this.selectedPrescription = null;
  }

  updateStatus(prescription: Prescription, status: PrescriptionStatus): void {
    if (!confirm(`Are you sure you want to mark this prescription as ${status}?`)) return;

    this.prescriptionService.updateStatus(prescription.prescription_id, status).subscribe({
      next: () => {
        alert('Prescription status updated successfully');
        this.loadPrescriptions();
        if (this.selectedPrescription?.prescription_id === prescription.prescription_id) {
          this.closePrescriptionModal();
        }
      },
      error: (err: any) => {
        const errorMessage = err.error?.message || 'Failed to update prescription status. Please try again.';
        alert(errorMessage);
        console.error('Error updating status:', err);
      }
    });
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

  getPatientDisplayName(connection: ConnectionWithDetails): string {
    return `${connection.patient_first_name} ${connection.patient_last_name}`;
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

