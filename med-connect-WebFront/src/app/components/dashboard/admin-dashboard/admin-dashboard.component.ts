import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DoctorService } from '../../../services/doctor.service';
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
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  isLoadingStats = false;
  isLoadingDoctors = false;
  verifyInProgress: Record<number, boolean> = {};
  errorMessage = '';

  topRatedDoctors: Doctor[] = [];
  unverifiedDoctors: Doctor[] = [];

  constructor(private doctorService: DoctorService) {}

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
}
