import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { DoctorRatingService, CreateRatingRequest } from '../../../services/doctor-rating.service';
import { ConnectionService } from '../../../services/connection.service';
import { ConnectionWithDetails } from '../../../models/connection.model';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-patient-rate-doctor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './patient-rate-doctor.component.html',
  styleUrls: ['./patient-rate-doctor.component.css']
})
export class PatientRateDoctorComponent implements OnInit, OnDestroy {
  connectedDoctors: ConnectionWithDetails[] = [];
  selectedDoctor: ConnectionWithDetails | null = null;
  currentRating: number = 0;
  review: string = '';
  existingRating: any = null;
  isLoading = true;
  isSubmitting = false;
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  constructor(
    private ratingService: DoctorRatingService,
    private connectionService: ConnectionService,
    private authService: AuthService,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
    
    this.loadConnectedDoctors();
    this.loadUnreadCount();
    
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadUnreadCount();
    });
    
    this.route.queryParams.subscribe(params => {
      if (params['doctorUserId']) {
        const doctorUserId = parseInt(params['doctorUserId'], 10);
        this.loadConnectedDoctors().then(() => {
          const doctor = this.connectedDoctors.find(d => d.doctor_user_id === doctorUserId);
          if (doctor) {
            this.selectDoctor(doctor);
          }
        });
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

  loadConnectedDoctors(): Promise<void> {
    return new Promise((resolve) => {
      this.isLoading = true;
      this.connectionService.getPatientConnections('approved').subscribe({
        next: (connections) => {
          this.connectedDoctors = connections.filter(c => c.status === 'approved');
          this.isLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.connectedDoctors = [];
          this.isLoading = false;
          resolve();
        }
      });
    });
  }

  selectDoctor(doctor: ConnectionWithDetails): void {
    this.selectedDoctor = doctor;
    this.currentRating = 0;
    this.review = '';
    this.existingRating = null;

    if (doctor.doctor_user_id) {
      this.ratingService.getMyRating(doctor.doctor_user_id).subscribe({
        next: (rating) => {
          if (rating) {
            this.existingRating = rating;
            this.currentRating = rating.rating;
            this.review = rating.review || '';
          }
        },
        error: (error) => {
          console.error('Error loading existing rating:', error);
        }
      });
    }
  }

  setRating(rating: number): void {
    this.currentRating = rating;
  }

  submitRating(): void {
    if (!this.selectedDoctor || !this.selectedDoctor.doctor_user_id || this.currentRating === 0) {
      alert('Please select a doctor and provide a rating');
      return;
    }

    this.isSubmitting = true;
    const ratingData: CreateRatingRequest = {
      rating: this.currentRating,
      review: this.review.trim() || undefined
    };

    this.ratingService.rateDoctor(this.selectedDoctor.doctor_user_id, ratingData).subscribe({
      next: () => {
        alert('Rating submitted successfully!');
        this.existingRating = { rating: this.currentRating, review: this.review };
        this.isSubmitting = false;
      },
      error: (error) => {
        const errorMsg = error.error?.message || error.message || 'Failed to submit rating';
        alert(errorMsg);
        this.isSubmitting = false;
      }
    });
  }

  getDoctorDisplayName(doctor: ConnectionWithDetails): string {
    return `Dr. ${doctor.doctor_first_name} ${doctor.doctor_last_name}`;
  }
}

