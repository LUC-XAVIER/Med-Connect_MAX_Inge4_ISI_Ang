import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfilePictureService } from '../../services/profile-picture.service';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.css']
})
export class ProfileModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  currentUser: any = null;
  userRole: 'patient' | 'doctor' = 'patient';
  
  // Profile data
  profileData: any = {};
  originalProfileData: any = {};
  
  // Profile picture
  selectedFile: File | null = null;
  profilePicturePreview: string | null = null;
  isUploadingPicture = false;
  isDeletingPicture = false;
  
  // Form state
  isSaving = false;
  saveError = '';
  saveSuccess = '';

  constructor(
    private authService: AuthService,
    private profilePictureService: ProfilePictureService,
    private doctorService: DoctorService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      this.userRole = this.currentUser.role;
      
      // Initialize profile data
      this.profileData = {
        first_name: this.currentUser.first_name || '',
        last_name: this.currentUser.last_name || '',
        email: this.currentUser.email || '',
        contact: this.currentUser.contact || '',
        address: this.currentUser.address || ''
      };
      
      // Add role-specific fields
      if (this.userRole === 'doctor') {
        this.profileData.specialty = this.currentUser.specialty || '';
        this.profileData.hospital_affiliation = this.currentUser.hospital_affiliation || '';
        this.profileData.bio = this.currentUser.bio || '';
      } else if (this.userRole === 'patient') {
        this.profileData.gender = this.currentUser.gender || '';
        this.profileData.blood_type = this.currentUser.blood_type || '';
        this.profileData.date_of_birth = this.currentUser.date_of_birth || '';
      }
      
      this.originalProfileData = { ...this.profileData };
      this.profilePicturePreview = this.currentUser.profile_picture || null;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePicturePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUploadingPicture = true;
    this.profilePictureService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (response) => {
        this.profilePicturePreview = response.profile_picture;
        this.currentUser.profile_picture = response.profile_picture;
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        this.selectedFile = null;
        this.isUploadingPicture = false;
        this.profileUpdated.emit();
      },
      error: (error) => {
        console.error('Error uploading profile picture:', error);
        alert(error.message || 'Failed to upload profile picture');
        this.isUploadingPicture = false;
      }
    });
  }

  deleteProfilePicture(): void {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    this.isDeletingPicture = true;
    this.profilePictureService.deleteProfilePicture().subscribe({
      next: () => {
        this.profilePicturePreview = null;
        this.currentUser.profile_picture = null;
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        this.isDeletingPicture = false;
        this.profileUpdated.emit();
      },
      error: (error) => {
        console.error('Error deleting profile picture:', error);
        alert(error.message || 'Failed to delete profile picture');
        this.isDeletingPicture = false;
      }
    });
  }

  saveProfile(): void {
    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = '';

    const updateData: any = {
      first_name: this.profileData.first_name,
      last_name: this.profileData.last_name,
      contact: this.profileData.contact,
      address: this.profileData.address
    };

    // Remove empty / unchanged fields so backend validation (express-validator) ignores them
    Object.keys(updateData).forEach((key) => {
      const val = updateData[key];
      if (val === '' || val === null || val === undefined) {
        delete updateData[key];
      }
    });

    if (this.userRole === 'doctor') {
      updateData.specialty = this.profileData.specialty;
      updateData.hospital_affiliation = this.profileData.hospital_affiliation;
      updateData.bio = this.profileData.bio;
      
      this.doctorService.updateProfile(updateData).subscribe({
        next: (updatedProfile) => {
          this.currentUser = { ...this.currentUser, ...updatedProfile };
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          this.saveSuccess = 'Profile updated successfully';
          this.isSaving = false;
          this.profileUpdated.emit();
          setTimeout(() => {
            this.saveSuccess = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.saveError = error.error?.message || error.message || 'Failed to update profile';
          this.isSaving = false;
        }
      });
    } else if (this.userRole === 'patient') {
      if (this.profileData.gender) updateData.gender = this.profileData.gender;
      if (this.profileData.blood_type) updateData.blood_type = this.profileData.blood_type;
      if (this.profileData.date_of_birth) updateData.date_of_birth = this.profileData.date_of_birth;
      
      this.patientService.updateProfile(updateData).subscribe({
        next: (updatedProfile) => {
          // Merge updated profile with current user
          const updatedUser = { ...this.currentUser };
          if (updatedProfile.first_name) updatedUser.first_name = updatedProfile.first_name;
          if (updatedProfile.last_name) updatedUser.last_name = updatedProfile.last_name;
          if (updatedProfile.address) updatedUser.address = updatedProfile.address;
          if (updatedProfile.gender) updatedUser.gender = updatedProfile.gender;
          // Map both bloodtype and blood_type from response
          if (updatedProfile.blood_type) updatedUser.blood_type = updatedProfile.blood_type;
          if (updatedProfile.blood_type) updatedUser.blood_type = updatedProfile.blood_type;
          // Map both dob and date_of_birth
          if (updatedProfile.dob) updatedUser.date_of_birth = updatedProfile.dob;
          if (updatedProfile.dob) updatedUser.date_of_birth = updatedProfile.dob;
          
          this.currentUser = updatedUser;
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          this.saveSuccess = 'Profile updated successfully';
          this.isSaving = false;
          this.profileUpdated.emit();
          setTimeout(() => {
            this.saveSuccess = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.saveError = error.error?.message || error.message || 'Failed to update profile';
          this.isSaving = false;
        }
      });
    }
  }


  closeModal(): void {
    this.close.emit();
    // Reset form
    this.loadUserProfile();
    this.selectedFile = null;
    this.saveError = '';
    this.saveSuccess = '';
  }

  getProfilePictureUrl(profilePicture: string | null | undefined): string {
    return this.profilePictureService.getProfilePictureUrl(profilePicture);
  }
}

