import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DoctorService } from '../../../services/doctor.service';
import { Doctor } from '../../../models/doctor.model';
import { MessageService } from '../../../services/message.service';
import { ConnectionService } from '../../../services/connection.service';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';
import { interval, Subscription, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-search-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ProfileModalComponent],
  templateUrl: './search-doctors.component.html',
  styleUrls: ['./search-doctors.component.css']
})
export class SearchDoctorsComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;
  private searchSubject = new Subject<string>();

  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  isLoading = false;
  connectedDoctorIds: Set<number> = new Set();

  // Search & Filter
  searchQuery = '';
  selectedspeciality = 'all';
  selectedVerified: 'all' | 'verified' | 'unverified' = 'all';
  selectedHospital = '';

  // Modal
  showProfileModal = false;
  showDoctorModal = false;
  selectedDoctor: Doctor | null = null;

  // Unverified connection warning modal
  showUnverifiedWarning = false;
  pendingConnectionDoctor: Doctor | null = null;

  specialties: string[] = [
    'All Specialties',
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Psychiatrist',
    'Orthopedic Surgeon',
    'Neurologist',
    'Oncologist',
    'Gynecologist',
    'Ophthalmologist',
    'Other'
  ];

  constructor(
    private authService: AuthService,
    private doctorService: DoctorService,
    private messageService: MessageService,
    private connectionService: ConnectionService,
    private router: Router,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    this.loadConnectedDoctors();
    this.loadTopRatedDoctors();
    this.loadUnreadCount();
    
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadUnreadCount();
    });

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.searchDoctors();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    this.searchSubject.complete();
  }

  loadConnectedDoctors(): void {
    this.connectionService.getPatientConnections('approved').subscribe({
      next: (connections) => {
        this.connectedDoctorIds = new Set(
          connections.map(c => c.doctor_user_id)
        );
      },
      error: (error) => {
        console.error('Error loading connected doctors:', error);
        this.connectedDoctorIds = new Set();
      }
    });
  }

  isDoctorConnected(doctorUserId: number): boolean {
    return this.connectedDoctorIds.has(doctorUserId);
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

  loadTopRatedDoctors(): void {
    this.isLoading = true;
    this.doctorService.getTopRatedDoctors(10).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading top rated doctors:', error);
        this.doctors = [];
        this.filteredDoctors = [];
        this.isLoading = false;
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  searchDoctors(): void {
    if (!this.searchQuery.trim() && this.selectedspeciality === 'all' && this.selectedVerified === 'all' && !this.selectedHospital.trim()) {
      // When there is no search text and no filters, show all doctors
      // (including unverified) so that patients can browse the full list.
      this.isLoading = true;
      this.doctorService.getAllDoctors().subscribe({
        next: (doctors) => {
          this.doctors = doctors;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.doctors = [];
          this.filteredDoctors = [];
          this.isLoading = false;
        }
      });
      return;
    }

    this.isLoading = true;
    const filters: any = {};
    
    if (this.selectedspeciality !== 'all') {
      // Map specialty filter to the backend's expected `specialty` query param.
      filters.specialty = this.selectedspeciality;
    }
    if (this.selectedVerified === 'verified') {
      filters.verified = true;
    } else if (this.selectedVerified === 'unverified') {
      filters.verified = false;
    }
    if (this.selectedHospital.trim()) {
      filters.hospital = this.selectedHospital;
    }

    this.doctorService.searchDoctors({
      q: this.searchQuery.trim(),
      specialty: filters?.specialty,
      verified: filters?.verified,
      hospital: filters?.hospital,
      limit: 50
    }).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching doctors:', error);
        this.doctors = [];
        this.filteredDoctors = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.doctors];
    const query = this.searchQuery.trim().toLowerCase();

    if (this.selectedspeciality !== 'all') {
      filtered = filtered.filter(d =>
        (d.speciality || (d as any).specialty || '').toLowerCase() === this.selectedspeciality.toLowerCase()
      );
    }

    if (this.selectedVerified === 'verified') {
      filtered = filtered.filter(d => d.verified === true);
    } else if (this.selectedVerified === 'unverified') {
      filtered = filtered.filter(d => d.verified === false);
    }

    if (this.selectedHospital.trim()) {
      filtered = filtered.filter(d =>
        d.hospital_affiliation?.toLowerCase().includes(this.selectedHospital.toLowerCase())
      );
    }

    if (query) {
      filtered = filtered.filter(d =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(query) ||
        (d.speciality || (d as any).specialty || '').toLowerCase().includes(query) ||
        d.hospital_affiliation?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    this.filteredDoctors = filtered;
  }

  /**
   * Safely get a numeric rating value for a doctor.
   * Backend may return rating as string or null, so we normalize here.
   */
  getDoctorRating(doctor: Doctor): number {
    const raw = (doctor as any).rating;
    const value = Number(raw ?? 0);
    return isNaN(value) ? 0 : value;
  }

  onspecialityChange(): void {
    this.applyFilters();
  }

  onVerifiedChange(): void {
    this.applyFilters();
  }

  onHospitalChange(): void {
    this.applyFilters();
  }

  openDoctorModal(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.showDoctorModal = true;
  }

  closeDoctorModal(): void {
    this.showDoctorModal = false;
    this.selectedDoctor = null;
  }

  navigateToMessages(doctorUserId: number): void {
    this.router.navigate(['/patient/messages'], { queryParams: { userId: doctorUserId } });
  }

  navigateToAppointments(doctorUserId: number): void {
    this.router.navigate(['/patient/appointments'], { queryParams: { doctorId: doctorUserId } });
  }

  requestConnection(doctor: Doctor): void {
    // If the doctor is unverified (anything other than explicit true),
    // open a custom warning modal instead of using the native confirm.
    if (doctor.verified !== true) {
      this.pendingConnectionDoctor = doctor;
      this.showUnverifiedWarning = true;
      return;
    }

    this.sendConnectionRequest(doctor);
  }

  /**
   * Actually send the connection request after the user confirms
   * (used by both verified doctors and confirmed unverified ones).
   */
  private sendConnectionRequest(doctor: Doctor): void {
    this.connectionService.requestConnection(doctor.user_id).subscribe({
      next: () => {
        alert('Connection request sent successfully!');
        this.loadConnectedDoctors();
        this.showUnverifiedWarning = false;
        this.pendingConnectionDoctor = null;
      },
      error: (error) => {
        console.error('Error requesting connection:', error);
        alert(error.error?.message || 'Failed to send connection request');
        this.showUnverifiedWarning = false;
        this.pendingConnectionDoctor = null;
      }
    });
  }

  confirmUnverifiedConnection(): void {
    if (!this.pendingConnectionDoctor) return;
    this.sendConnectionRequest(this.pendingConnectionDoctor);
  }

  cancelUnverifiedConnection(): void {
    this.showUnverifiedWarning = false;
    this.pendingConnectionDoctor = null;
  }

  getProfilePictureUrl(filePath: string | null | undefined): string {
    return this.profilePictureService.getProfilePictureUrl(filePath || '');
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];
    return colors[userId % colors.length];
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

