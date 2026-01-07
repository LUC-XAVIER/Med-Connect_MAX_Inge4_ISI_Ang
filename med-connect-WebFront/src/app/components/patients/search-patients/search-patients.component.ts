import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ConnectionService } from '../../../services/connection.service';
import { MessageService } from '../../../services/message.service';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { ProfileModalComponent } from '../../profile/profile-modal.component';
import { ProfilePictureService } from '../../../services/profile-picture.service';
import { interval, Subscription, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ConnectionWithDetails } from '../../../models/connection.model';

@Component({
  selector: 'app-search-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ProfileModalComponent],
  templateUrl: './search-patients.component.html',
  styleUrls: ['./search-patients.component.css']
})
export class SearchPatientsComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;
  private searchSubject = new Subject<string>();

  patients: ConnectionWithDetails[] = [];
  filteredPatients: ConnectionWithDetails[] = [];
  isLoading = false;

  // Search & Filter
  searchQuery = '';
  selectedGender: 'all' | 'male' | 'female' | 'other' = 'all';
  selectedBloodType = 'all';

  // Modal
  showProfileModal = false;
  showPatientModal = false;
  selectedPatient: ConnectionWithDetails | null = null;

  bloodTypes = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  constructor(
    private authService: AuthService,
    private connectionService: ConnectionService,
    private messageService: MessageService,
    private router: Router,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }

    this.loadConnectedPatients();
    this.loadUnreadCount();
    
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadUnreadCount();
    });

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    this.searchSubject.complete();
  }

  loadConnectedPatients(): void {
    this.isLoading = true;
    this.connectionService.getDoctorConnections('approved').subscribe({
      next: (connections) => {
        this.patients = connections;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading connected patients:', error);
        this.patients = [];
        this.filteredPatients = [];
        this.isLoading = false;
      }
    });
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

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onGenderChange(): void {
    this.applyFilters();
  }

  onBloodTypeChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.patients];
    const query = this.searchQuery.trim().toLowerCase();

    if (query) {
      filtered = filtered.filter(p =>
        `${p.patient_first_name} ${p.patient_last_name}`.toLowerCase().includes(query) ||
        p.patient_email?.toLowerCase().includes(query)
      );
    }

    if (this.selectedGender !== 'all') {
      filtered = filtered.filter(p => p.patient_gender?.toLowerCase() === this.selectedGender);
    }

    if (this.selectedBloodType !== 'all') {
      filtered = filtered.filter(p => p.patient_bloodtype?.toUpperCase() === this.selectedBloodType.toUpperCase());
    }

    this.filteredPatients = filtered;
  }

  openPatientModal(patient: ConnectionWithDetails): void {
    this.selectedPatient = patient;
    this.showPatientModal = true;
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
  }

  navigateToMessages(patientUserId: number | undefined): void {
    if (!patientUserId) return;
    this.router.navigate(['/doctor/messages'], { queryParams: { userId: patientUserId } });
  }

  navigateToRecords(patientUserId: number | undefined): void {
    if (!patientUserId) return;
    this.router.navigate(['/doctor/records'], { queryParams: { patientId: patientUserId } });
  }

  getProfilePictureUrl(filePath: string | null | undefined): string {
    return this.profilePictureService.getProfilePictureUrl(filePath || '');
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getAvatarColor(userId: number | undefined): string {
    if (!userId) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
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

