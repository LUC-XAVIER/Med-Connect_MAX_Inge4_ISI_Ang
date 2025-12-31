import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { DoctorService } from '../../services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import { ConnectionService } from '../../services/connection.service';
import { AppointmentWithDetails } from '../../models/appointment.model';
import { ConnectionWithDetails } from '../../models/connection.model';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

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
    RouterLink,
    MatProgressSpinner,
    SidebarComponent
  ],
  templateUrl: './doc-dashboard.component.html',
  styleUrls: ['./doc-dashboard.component.css']
})
export class DocDashboardComponent implements OnInit {
  Math = Math; // Make Math available in template
  todayAppointments: AppointmentWithDetails[] = [];
  pendingConnections: ConnectionWithDetails[] = [];
  recentPrescriptions: any[] = [];
  currentUser: any = null;

  // Statistics
  stats = {
    totalAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    pendingRequests: 0,
    totalPrescriptions: 0
  };

  totalRevenue = 12928;
  
  patientTableData: any[] = [];

  isLoading = true;

  constructor(
    private router: Router,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private connectionService: ConnectionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
    
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Load appointments
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (appointments) => {
        const appointmentsArray = Array.isArray(appointments) ? appointments : [];
        const today = new Date().toISOString().split('T')[0];
        this.todayAppointments = appointmentsArray.filter(apt =>
          apt && apt.appointment_date && apt.appointment_date.toString().startsWith(today)
        );
        this.stats.totalAppointments = appointmentsArray.length;
        this.stats.todayAppointments = this.todayAppointments.length;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.todayAppointments = [];
        this.stats.totalAppointments = 0;
        this.stats.todayAppointments = 0;
      }
    });

    // Load connections
    this.connectionService.getDoctorConnections().subscribe({
      next: (connections) => {
        const connectionsArray = Array.isArray(connections) ? connections : [];
        this.pendingConnections = connectionsArray.filter(conn => conn && conn.status === 'pending');
        const approvedConnections = connectionsArray.filter(conn => conn && conn.status === 'approved');
        this.stats.totalPatients = approvedConnections.length;
        this.stats.pendingRequests = this.pendingConnections.length;
        
        // Populate patient table data from approved connections
        this.patientTableData = approvedConnections.slice(0, 10).map((conn, index) => ({
          id: `#${40320 + index}`,
          name: `${conn.patient_first_name} ${conn.patient_last_name}`,
          admit: new Date(conn.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
          type: 'General',
          status: 'Active'
        }));
        
        // If no data, use default sample data
        if (this.patientTableData.length === 0) {
          this.patientTableData = [
            { id: '#40322', name: 'Dr. Michael Smith', admit: 'Today', type: 'Routine Checkup', status: 'Active' },
            { id: '#40323', name: 'Dr. Emily Johnson', admit: 'Aug 15, 2025', type: 'Follow-up', status: 'Active' },
            { id: '#40324', name: 'Sarah Williams', admit: '09/12/24', type: 'Consultation', status: 'Active' },
            { id: '#40325', name: 'James Brown', admit: '08/28/24', type: 'Physical Exam', status: 'Active' },
            { id: '#40326', name: 'Patricia Davis', admit: '08/15/24', type: 'Lab Review', status: 'Active' }
          ];
        }
      },
      error: (error) => {
        console.error('Error loading connections:', error);
        this.pendingConnections = [];
        this.stats.totalPatients = 0;
        this.stats.pendingRequests = 0;
        // Use default sample data on error
        this.patientTableData = [
          { id: '#40322', name: 'Dr. Michael Smith', admit: 'Today', type: 'Routine Checkup', status: 'Active' },
          { id: '#40323', name: 'Dr. Emily Johnson', admit: 'Aug 15, 2025', type: 'Follow-up', status: 'Active' },
          { id: '#40324', name: 'Sarah Williams', admit: '09/12/24', type: 'Consultation', status: 'Active' },
          { id: '#40325', name: 'James Brown', admit: '08/28/24', type: 'Physical Exam', status: 'Active' },
          { id: '#40326', name: 'Patricia Davis', admit: '08/15/24', type: 'Lab Review', status: 'Active' }
        ];
      }
    });

    // Load prescriptions
    this.doctorService.getPrescriptions().subscribe({
      next: (prescriptions) => {
        const prescriptionsArray = Array.isArray(prescriptions) ? prescriptions : [];
        this.recentPrescriptions = prescriptionsArray.slice(0, 5);
        this.stats.totalPrescriptions = prescriptionsArray.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.recentPrescriptions = [];
        this.stats.totalPrescriptions = 0;
        this.isLoading = false;
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  navigateToSchedule(): void {
    this.router.navigate(['/doctor/appointments']);
  }

  navigateToAppointments(): void {
    this.router.navigate(['/doctor/appointments']);
  }

  navigateToPrescriptions(): void {
    this.router.navigate(['/doctor/prescriptions']);
  }

  navigateToPatients(): void {
    this.router.navigate(['/doctor/patients']);
  }

  navigateToMessages(): void {
    this.router.navigate(['/doctor/messages']);
  }

  approveConnection(connectionId: number): void {
    // TODO: Implement connection approval
    console.log('Approve connection:', connectionId);
  }

  rejectConnection(connectionId: number): void {
    // TODO: Implement connection rejection
    console.log('Reject connection:', connectionId);
  }
}