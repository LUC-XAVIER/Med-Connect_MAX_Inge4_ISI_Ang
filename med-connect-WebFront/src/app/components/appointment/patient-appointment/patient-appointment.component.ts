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
import { AppointmentWithDetails, AppointmentStatus } from '../../../models/appointment.model';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-patient-appointments',
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
    SidebarComponent
  ],
  templateUrl: './patient-appointment.component.html',
  styleUrls: ['./patient-appointment.component.css']
})
export class PatientAppointmentsComponent implements OnInit, OnDestroy {
  allAppointments: AppointmentWithDetails[] = [];
  filteredAppointments: AppointmentWithDetails[] = [];
  currentUser: any = null;
  isLoading = true;
  isBooking = false;
  isLoadingDoctors = false;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  // Connected doctors for dropdown (only approved connections)
  connectedDoctors: ConnectionWithDetails[] = [];

  // Filter states
  selectedStatus: string = 'all';
  selectedDate: Date | null = null;
  searchQuery: string = '';

  // Modal states
  showAppointmentModal = false;
  showBookingModal = false;
  showRescheduleModal = false;
  selectedAppointment: AppointmentWithDetails | null = null;
  appointmentNotes = '';
  isRescheduling = false;

  // Booking form - PATIENT books WITH doctor
  bookingForm = {
    doctor_user_id: null as number | null,
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

  // Stats for KPI cards
  stats = {
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0
  };

  constructor(
    private appointmentService: AppointmentService,
    private notificationService: NotificationService,
    private connectionService: ConnectionService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    this.loadAppointments();
    this.loadConnectedDoctors();
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
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  loadAppointments(): void {
    this.isLoading = true;
    // This method works for both patient and doctor based on token
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (appointments: AppointmentWithDetails[]) => {
        this.allAppointments = appointments;
        this.filteredAppointments = [...appointments];
        this.updateStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading appointments:', error);
        this.allAppointments = [];
        this.filteredAppointments = [];
        this.updateStats();
        this.isLoading = false;
      }
    });
  }

  updateStats(): void {
    this.stats.totalAppointments = this.allAppointments.length;
    this.stats.pendingAppointments = this.allAppointments.filter(apt => apt.status === AppointmentStatus.PENDING).length;
    this.stats.confirmedAppointments = this.allAppointments.filter(apt => apt.status === AppointmentStatus.CONFIRMED).length;
    this.stats.completedAppointments = this.allAppointments.filter(apt => apt.status === AppointmentStatus.COMPLETED).length;
  }

  loadConnectedDoctors(): void {
    this.isLoadingDoctors = true;
    // Get only approved connections
    this.connectionService.getPatientConnections('approved').subscribe({
      next: (connections: ConnectionWithDetails[]) => {
        this.connectedDoctors = connections;
        this.isLoadingDoctors = false;
        console.log('Connected doctors loaded:', this.connectedDoctors);
      },
      error: (error: any) => {
        console.error('Error loading connected doctors:', error);
        this.connectedDoctors = [];
        this.isLoadingDoctors = false;
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
        apt.doctor_name?.toLowerCase().includes(query) ||
        apt.doctor_specialty?.toLowerCase().includes(query) ||
        apt.reason?.toLowerCase().includes(query) ||
        apt.notes?.toLowerCase().includes(query)
      );
    }

    this.filteredAppointments = filtered;
  }

  // Get appointment card color based on status
  getAppointmentCardClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING: return 'appointment-card-pending';
      case AppointmentStatus.CONFIRMED: return 'appointment-card-confirmed';
      case AppointmentStatus.COMPLETED: return 'appointment-card-completed';
      case AppointmentStatus.CANCELLED: return 'appointment-card-cancelled';
      default: return 'appointment-card-pending';
    }
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedDate = null;
    this.searchQuery = '';
    this.filteredAppointments = [...this.allAppointments];
  }

  onDateFilterChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedDate = target.value ? new Date(target.value) : null;
    this.applyFilters();
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

  // Booking Modal Methods
  openBookingModal(): void {
    // Check if there are connected doctors
    if (this.connectedDoctors.length === 0) {
      alert('You have no connected doctors yet. Please connect with a doctor first.');
      return;
    }

    // Set default date to today
    const today = new Date();
    this.bookingForm.appointment_date = today.toISOString().split('T')[0];
    this.bookingForm.appointment_time = '09:00';
    this.bookingForm.doctor_user_id = null;
    this.bookingForm.reason = '';
    this.bookingForm.notes = '';

    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.bookingForm = {
      doctor_user_id: null,
      appointment_date: '',
      appointment_time: '',
      reason: '',
      notes: ''
    };
  }

  bookAppointment(): void {
    // Validation
    if (!this.bookingForm.doctor_user_id) {
      alert('Please select a doctor');
      return;
    }

    if (!this.bookingForm.appointment_date || !this.bookingForm.appointment_time) {
      alert('Please select date and time');
      return;
    }

    if (!this.bookingForm.reason.trim()) {
      alert('Please provide a reason for the appointment');
      return;
    }

    this.isBooking = true;

    // ✅ PATIENT books appointment WITH doctor → send doctor_user_id
    const appointmentData = {
      doctor_user_id: this.bookingForm.doctor_user_id,  // ✅ Correct for patient role
      appointment_date: this.bookingForm.appointment_date,
      appointment_time: this.bookingForm.appointment_time,
      reason: this.bookingForm.reason,
      notes: this.bookingForm.notes
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (appointment: AppointmentWithDetails) => {
        alert('Appointment booked successfully! Your doctor will be notified.');
        this.closeBookingModal();
        this.loadAppointments();
        this.isBooking = false;
      },
      error: (err: any) => {
        const errorMessage = err.error?.message || 'Failed to book appointment. Please try again.';
        alert(errorMessage);
        console.error('Error booking appointment:', err);
        this.isBooking = false;
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

    if (!this.rescheduleForm.appointment_date || !this.rescheduleForm.appointment_time) {
      alert('Please select both date and time');
      return;
    }

    this.isRescheduling = true;

    this.appointmentService.rescheduleAppointment(
      this.selectedAppointment.appointment_id,
      this.rescheduleForm.appointment_date,
      this.rescheduleForm.appointment_time
    ).subscribe({
      next: () => {
        alert('Appointment rescheduled successfully!');
        this.closeRescheduleModal();
        this.closeAppointmentModal();
        this.loadAppointments();
        this.isRescheduling = false;
      },
      error: (err: any) => {
        const errorMessage = err.error?.message || 'Failed to reschedule appointment. Please try again.';
        alert(errorMessage);
        console.error('Error rescheduling appointment:', err);
        this.isRescheduling = false;
      }
    });
  }

  // Cancel appointment
  cancelAppointment(): void {
    if (!this.selectedAppointment) return;

    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    this.appointmentService.cancelAppointment(this.selectedAppointment.appointment_id).subscribe({
      next: () => {
        alert('Appointment cancelled successfully');
        this.closeAppointmentModal();
        this.loadAppointments();
      },
      error: (err: any) => {
        alert('Failed to cancel appointment');
        console.error('Error:', err);
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

  // Get doctor display name from connection
  getDoctorDisplayName(connection: ConnectionWithDetails): string {
    return `Dr. ${connection.doctor_first_name} ${connection.doctor_last_name}`;
  }

  // Get doctor specialty from connection
  getDoctorSpecialty(connection: ConnectionWithDetails): string {
    return connection.doctor_specialty || 'General Practice';
  }
}
