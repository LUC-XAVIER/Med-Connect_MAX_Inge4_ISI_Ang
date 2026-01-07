import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';
import { Doctor } from '../../../models/doctor.model';

interface AdminStats {
  totalDoctors: number;
  verifiedDoctors: number;
  unverifiedDoctors: number;
  totalPatients: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  isLoadingStats = false;
  isLoadingDoctors = false;
  verifyInProgress: Record<number, boolean> = {};
  rejectInProgress: Record<number, boolean> = {};
  errorMessage = '';

  topRatedDoctors: Doctor[] = [];
  unverifiedDoctors: Doctor[] = [];

  // Modal states
  showRejectModal = false;
  showDetailsModal = false;
  selectedDoctor: Doctor | null = null;
  rejectionReason = '';

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadTopRated();
    this.loadUnverified();
  }

  loadStats(): void {
    this.isLoadingStats = true;
    this.doctorService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading admin stats:', error);
        this.errorMessage = 'Failed to load stats';
        this.isLoadingStats = false;
      }
    });
  }

  loadTopRated(): void {
    this.doctorService.getTopRatedDoctors(5).subscribe({
      next: (doctors) => {
        this.topRatedDoctors = doctors || [];
      },
      error: (error) => {
        console.error('Error loading top rated doctors:', error);
      }
    });
  }

  loadUnverified(): void {
    this.isLoadingDoctors = true;
    this.doctorService.searchDoctors({ verified: false, limit: 50 }).subscribe({
      next: (doctors) => {
        this.unverifiedDoctors = doctors || [];
        this.isLoadingDoctors = false;
      },
      error: (error) => {
        console.error('Error loading unverified doctors:', error);
        this.isLoadingDoctors = false;
      }
    });
  }

  verifyDoctor(doctor: Doctor): void {
    if (this.verifyInProgress[doctor.doctor_id]) {
      return;
    }
    this.verifyInProgress[doctor.doctor_id] = true;
    this.doctorService.verifyDoctor(doctor.doctor_id).subscribe({
      next: () => {
        this.verifyInProgress[doctor.doctor_id] = false;
        this.unverifiedDoctors = this.unverifiedDoctors.filter(d => d.doctor_id !== doctor.doctor_id);
        this.loadStats();
      },
      error: (error) => {
        console.error('Error verifying doctor:', error);
        this.verifyInProgress[doctor.doctor_id] = false;
        alert('Failed to verify doctor');
      }
    });
  }

  openRejectModal(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedDoctor = null;
    this.rejectionReason = '';
  }

  rejectDoctor(): void {
    if (!this.selectedDoctor || !this.rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (this.rejectInProgress[this.selectedDoctor.doctor_id]) {
      return;
    }

    this.rejectInProgress[this.selectedDoctor.doctor_id] = true;
    this.doctorService.rejectDoctor(this.selectedDoctor.doctor_id, this.rejectionReason.trim()).subscribe({
      next: () => {
        this.rejectInProgress[this.selectedDoctor!.doctor_id] = false;
        this.unverifiedDoctors = this.unverifiedDoctors.filter(d => d.doctor_id !== this.selectedDoctor!.doctor_id);
        this.closeRejectModal();
        this.loadStats();
      },
      error: (error) => {
        console.error('Error rejecting doctor:', error);
        this.rejectInProgress[this.selectedDoctor!.doctor_id] = false;
        alert('Failed to reject doctor');
      }
    });
  }

  openDetailsModal(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedDoctor = null;
  }

  logout(): void {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) {
      return;
    }

    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.authService.manualLogout();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/']);
      }
    });
  }
}
