import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { DoctorRatingService, DoctorRating, DoctorRatingStats } from '../../../services/doctor-rating.service';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-view-ratings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './doctor-view-ratings.component.html',
  styleUrls: ['./doctor-view-ratings.component.css']
})
export class DoctorViewRatingsComponent implements OnInit, OnDestroy {
  ratings: DoctorRating[] = [];
  stats: DoctorRatingStats | null = null;
  isLoading = true;
  currentUser: any = null;
  unreadCount: number = 0;
  private refreshSubscription?: Subscription;

  constructor(
    private ratingService: DoctorRatingService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
    this.loadRatings();
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

  loadRatings(): void {
    if (!this.currentUser?.user_id) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.ratingService.getDoctorRatings(this.currentUser.user_id).subscribe({
      next: (response) => {
        this.ratings = response.ratings;
        this.stats = response.stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ratings:', error);
        this.ratings = [];
        this.isLoading = false;
      }
    });
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getRoundedRating(rating: number): number {
    return Math.round(rating);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

