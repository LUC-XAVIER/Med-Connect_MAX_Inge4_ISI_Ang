import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { AppointmentService } from '../../../services/appointment.service';
import { NotificationService } from '../../../services/notification.service';
import { ConnectionService } from '../../../services/connection.service';
import { MessageService } from '../../../services/message.service';
import { AppointmentWithDetails, AppointmentStatus, CreateAppointmentRequest } from '../../../models/appointment.model';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatListModule,
    MatBadgeModule,
    MatProgressSpinner,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterModule,
    SidebarComponent,
    ProfileModalComponent
  ],
  templateUrl: './doctor-appointment.component.html',
  styleUrls: ['./doctor-appointment.component.css']
})
export class DoctorAppointmentsComponent implements OnInit, OnDestroy {
  allAppointments: AppointmentWithDetails[] = [];
  filteredAppointments: AppointmentWithDetails[] = [];
  currentUser: any = null;
  isLoading = true;
  isScheduling = false;
  isLoadingPatients = false;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  // Error and success messages
  errorMessage: string = '';
  successMessage: string = '';

  // Connected patients for dropdown (only approved connections)
  connectedPatients: ConnectionWithDetails[] = [];

  // Filter states
  selectedStatus: string = 'all';
  selectedDate: Date | null = null;
  searchQuery: string = '';

  // Modal states
  showAppointmentModal = false;
  showScheduleModal = false;
  showRescheduleModal = false;
  showProfileModal = false;
  selectedAppointment: AppointmentWithDetails | null = null;
  appointmentNotes = '';
  isRescheduling = false;

  // Schedule form
  scheduleForm = {
    patient_user_id: null as number | null,
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: ''
  };

  // Time slots
  timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  // Status options for filter
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelled' }
  ];

  // Expose enum to template
  AppointmentStatus = AppointmentStatus;

  constructor(
    private appointmentService: AppointmentService,
    private notificationService: NotificationService,
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

    this.loadAppointments();
    this.loadConnectedPatients();
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

  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (appointments: AppointmentWithDetails[]) => {
        this.allAppointments = appointments;
        this.filteredAppointments = [...appointments];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading appointments:', error);
        this.allAppointments = [];
        this.filteredAppointments = [];
        this.isLoading = false;
      }
    });
  }

  loadConnectedPatients(): void {
    this.isLoadingPatients = true;
    // Get only approved connections
    this.connectionService.getDoctorConnections('approved').subscribe({
      next: (connections: ConnectionWithDetails[]) => {
        this.connectedPatients = connections;
        this.isLoadingPatients = false;
        console.log('Connected patients loaded:', connections);
      },
      error: (error: any) => {
        console.error('Error loading connected patients:', error);
        this.connectedPatients = [];
        this.isLoadingPatients = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allAppointments];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === this.selectedStatus);
    }

    // Filter by date
    if (this.selectedDate) {
      const dateStr = this.selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(apt =>
        apt.appointment_date && apt.appointment_date.toString().startsWith(dateStr)
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patient_name?.toLowerCase().includes(query) ||
        apt.reason?.toLowerCase().includes(query) ||
        apt.notes?.toLowerCase().includes(query)
      );
    }

    this.filteredAppointments = filtered;
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedDate = null;
    this.searchQuery = '';
    this.filteredAppointments = [...this.allAppointments];
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
        // Send notification to patient (optional - don't fail if notification service unavailable)
        if (this.selectedAppointment?.patient_id) {
          this.notificationService.createAppointmentNotification(
            this.selectedAppointment.patient_id,
            this.selectedAppointment,
            status === AppointmentStatus.CONFIRMED ? 'confirmed' :
              status === AppointmentStatus.COMPLETED ? 'completed' :
                status === AppointmentStatus.CANCELLED ? 'cancelled' : 'updated'
          ).subscribe({
            next: () => {
              console.log('Notification sent successfully');
            },
            error: (err) => {
              // Silently handle notification errors - status was updated successfully
              console.warn('Failed to send notification (notification service may not be available):', err);
            }
          });
        }

        alert('Appointment status updated successfully');
        this.closeAppointmentModal();
        this.loadAppointments();
      },
      error: (err: any) => {
        alert('Failed to update appointment status. Please try again.');
        console.error('Error updating status:', err);
      }
    });
  }

  // Schedule Modal Methods
  openScheduleModal(): void {
    // Check if there are connected patients
    if (this.connectedPatients.length === 0) {
      alert('You have no connected patients yet. Please wait for patients to connect with you first.');
      return;
    }

    // Set default date to today
    const today = new Date();
    this.scheduleForm.appointment_date = today.toISOString().split('T')[0];
    this.scheduleForm.appointment_time = '09:00';
    this.scheduleForm.patient_user_id = null;
    this.scheduleForm.reason = '';
    this.scheduleForm.notes = '';

    this.showScheduleModal = true;
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.scheduleForm = {
      patient_user_id: null,
      appointment_date: '',
      appointment_time: '',
      reason: '',
      notes: ''
    };
  }

  scheduleAppointment(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.scheduleForm.patient_user_id) {
      this.errorMessage = 'Please select a patient';
      return;
    }

    if (!this.scheduleForm.appointment_date || !this.scheduleForm.appointment_time) {
      this.errorMessage = 'Please select date and time';
      return;
    }

    if (!this.scheduleForm.reason.trim()) {
      this.errorMessage = 'Please provide a reason for the appointment';
      return;
    }

    this.isScheduling = true;

    // Doctor schedules appointment for patient → DO NOT send doctor_user_id
    const appointmentData: CreateAppointmentRequest = {
      patient_user_id: Number(this.scheduleForm.patient_user_id),
      appointment_date: this.scheduleForm.appointment_date,
      appointment_time: this.scheduleForm.appointment_time,
      reason: this.scheduleForm.reason,
      notes: this.scheduleForm.notes
    };
    console.log('=== APPOINTMENT DATA BEING SENT ===');
    console.log('scheduleForm.patient_user_id:', this.scheduleForm.patient_user_id);
    console.log('appointmentData:', appointmentData);
    console.log('===================================');
    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (appointment: AppointmentWithDetails) => {
        // Try to send notification, but don't fail if it doesn't work
        if (this.scheduleForm.patient_user_id) {
          this.notificationService.createAppointmentNotification(
            this.scheduleForm.patient_user_id,
            appointment,
            'created'
          ).subscribe({
            next: () => {
              console.log('Notification sent successfully');
            },
            error: (err) => {
              // Silently handle notification errors - appointment was created successfully
              console.warn('Failed to send notification (notification service may not be available):', err);
            }
          });
        }

        this.successMessage = 'Appointment scheduled successfully! Patient will be notified.';
        setTimeout(() => {
          this.successMessage = '';
          this.closeScheduleModal();
        }, 2000);
        this.loadAppointments();
        this.isScheduling = false;
      },
      error: (err: any) => {
        let errorMsg = 'Failed to schedule appointment. Please try again.';
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          errorMsg = err.error.errors.map((e: any) => e.msg).join(', ');
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.error) {
          errorMsg = err.error.error;
        }
        this.errorMessage = errorMsg;
        console.error('Error scheduling appointment:', err);
        this.isScheduling = false;
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  // Reschedule appointment
  openRescheduleModal(): void {
    if (!this.selectedAppointment) return;
    this.showRescheduleModal = true;
    // Pre-fill with current date and time
    const currentDate = new Date(this.selectedAppointment.appointment_date);
    this.rescheduleForm.appointment_date = currentDate.toISOString().split('T')[0];
    this.rescheduleForm.appointment_time = this.selectedAppointment.appointment_time;
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.rescheduleForm = {
      appointment_date: '',
      appointment_time: ''
    };
  }

  rescheduleForm = {
    appointment_date: '',
    appointment_time: ''
  };

  rescheduleAppointment(): void {
    if (!this.selectedAppointment) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.rescheduleForm.appointment_date || !this.rescheduleForm.appointment_time) {
      this.errorMessage = 'Please select both date and time';
      return;
    }

    this.isRescheduling = true;

    this.appointmentService.rescheduleAppointment(
      this.selectedAppointment.appointment_id,
      this.rescheduleForm.appointment_date,
      this.rescheduleForm.appointment_time
    ).subscribe({
      next: () => {
        // Send notification
        if (this.selectedAppointment?.patient_id) {
          this.notificationService.createAppointmentNotification(
            this.selectedAppointment.patient_id,
            { ...this.selectedAppointment, appointment_date: this.rescheduleForm.appointment_date, appointment_time: this.rescheduleForm.appointment_time },
            'updated'
          ).subscribe({
            next: () => console.log('Notification sent'),
            error: (err) => console.warn('Failed to send notification:', err)
          });
        }
        this.successMessage = 'Appointment rescheduled successfully!';
        setTimeout(() => {
          this.successMessage = '';
          this.closeRescheduleModal();
          this.closeAppointmentModal();
          this.loadAppointments();
        }, 2000);
        this.isRescheduling = false;
      },
      error: (err: any) => {
        let errorMsg = 'Failed to reschedule appointment. Please try again.';
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          errorMsg = err.error.errors.map((e: any) => e.msg).join(', ');
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.error) {
          errorMsg = err.error.error;
        }
        this.errorMessage = errorMsg;
        console.error('Error rescheduling appointment:', err);
        this.isRescheduling = false;
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  // Cancel appointment
  cancelAppointment(): void {
    if (!this.selectedAppointment) return;

    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentService.cancelAppointment(this.selectedAppointment.appointment_id).subscribe({
      next: () => {
        // Send cancellation notification
        if (this.selectedAppointment?.patient_id) {
          this.notificationService.createAppointmentNotification(
            this.selectedAppointment.patient_id,
            this.selectedAppointment,
            'cancelled'
          ).subscribe({
            next: () => console.log('Notification sent successfully'),
            error: (err) => console.warn('Failed to send notification:', err)
          });
        }
        this.successMessage = 'Appointment cancelled successfully';
        setTimeout(() => {
          this.successMessage = '';
          this.closeAppointmentModal();
          this.loadAppointments();
        }, 2000);
      },
      error: (err: any) => {
        let errorMsg = 'Failed to cancel appointment. Please try again.';
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          errorMsg = err.error.errors.map((e: any) => e.msg).join(', ');
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.error) {
          errorMsg = err.error.error;
        }
        this.errorMessage = errorMsg;
        console.error('Error:', err);
        setTimeout(() => { this.errorMessage = ''; }, 5000);
      }
    });
  }

  // Get status badge class
  getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING: return 'status-pending';
      case AppointmentStatus.CONFIRMED: return 'status-confirmed';
      case AppointmentStatus.COMPLETED: return 'status-completed';
      case AppointmentStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get patient display name from connection
  getPatientDisplayName(connection: ConnectionWithDetails): string {
    return `${connection.patient_first_name} ${connection.patient_last_name}`;
  }

  // Get patient email from connection
  getPatientEmail(connection: ConnectionWithDetails): string {
    return connection.patient_email || 'No email';
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
