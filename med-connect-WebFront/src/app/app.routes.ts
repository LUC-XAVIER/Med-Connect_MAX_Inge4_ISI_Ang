import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { LoginComponent } from './components/landing-page/login/login.component';
import { SignupComponent } from './components/landing-page/signup/signup.component';
import { DocDashboardComponent } from './components/dashboard/doc-dashboard/doc-dashboard.component';
import { PatDashboardComponent } from './components/dashboard/pat-dashboard/pat-dashboard.component';
import { PatConnectionsComponent } from './components/connections/pat-connection/pat-connection.component';
import { DocConnectionsComponent } from './components/connections/doc-connection/doc-connection.component';
import { AdminDashboardComponent } from './components/dashboard/admin-dashboard/admin-dashboard.component';
import { DoctorAuthGuard } from './guards/doctor-auth.guards';
import { PatientAuthGuard } from './guards/patient-auth.guards';
import { AdminAuthGuard } from './guards/admin-auth.guards';
import { AuthGuard } from './guards/auth.guards';
import { DoctorAppointmentsComponent } from "./components/appointment/doctor-appointment/doctor-appointment.component";
import { PatientAppointmentsComponent } from "./components/appointment/patient-appointment/patient-appointment.component";
import { PatientRecordsComponent } from "./components/records/patient-records/patient-records.component";
import { DoctorRecordsComponent } from "./components/records/doctor-records/doctor-records.component";
import { PatientPrescriptionsComponent } from "./components/prescriptions/patient-prescriptions/patient-prescriptions.component";
import { DoctorPrescriptionsComponent } from "./components/prescriptions/doctor-prescriptions/doctor-prescriptions.component";
import { MessagesComponent } from "./components/messages/messages.component";
import { PatientRateDoctorComponent } from "./components/ratings/patient-rate-doctor/patient-rate-doctor.component";
import { DoctorViewRatingsComponent } from "./components/ratings/doctor-view-ratings/doctor-view-ratings.component";
import { ForgotPasswordComponent } from "./components/landing-page/forgot-password/forgot-password.component";
import { ResetPasswordComponent } from "./components/landing-page/reset-password/reset-password.component";
import { SearchDoctorsComponent } from "./components/doctors/search-doctors/search-doctors.component";
import { SearchPatientsComponent } from "./components/patients/search-patients/search-patients.component";

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin/login', component: LoginComponent, data: { role: 'admin' } },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Doctor routes
  {
    path: 'doctor/dashboard',
    component: DocDashboardComponent,
    canActivate: [DoctorAuthGuard]
  },
  {
    path: 'doctor/appointments',
    component: DoctorAppointmentsComponent,
    canActivate: [DoctorAuthGuard]
  },
  {
    path: 'doctor/connections',
    component: DocConnectionsComponent,
    canActivate: [DoctorAuthGuard]
  },
  {
    path: 'doctor/prescriptions',
    component: DoctorPrescriptionsComponent,
    canActivate: [DoctorAuthGuard]
  },
  {
    path: 'doctor/records',
    component: DoctorRecordsComponent,
    canActivate: [DoctorAuthGuard]
  },
  {
    path: 'doctor/messages',
    component: MessagesComponent,
    canActivate: [DoctorAuthGuard]
  },
  {
    path: 'doctor/ratings',
    component: DoctorViewRatingsComponent,
    canActivate: [DoctorAuthGuard]
  },
  {
    path: 'doctor/patients',
    component: SearchPatientsComponent,
    canActivate: [DoctorAuthGuard]
  },

  // Patient routes
  {
    path: 'patient/dashboard',
    component: PatDashboardComponent,
    canActivate: [PatientAuthGuard]
  },
  {
    path: 'patient/appointments',
    component: PatientAppointmentsComponent,
    canActivate: [PatientAuthGuard]
  },
  {
    path: 'patient/connections',
    component: PatConnectionsComponent,
    canActivate: [PatientAuthGuard]
  },
  {
    path: 'patient/records',
    component: PatientRecordsComponent,
    canActivate: [PatientAuthGuard]
  },
  {
    path: 'patient/prescriptions',
    component: PatientPrescriptionsComponent,
    canActivate: [PatientAuthGuard]
  },
  {
    path: 'patient/messages',
    component: MessagesComponent,
    canActivate: [PatientAuthGuard]
  },
  {
    path: 'patient/ratings',
    component: PatientRateDoctorComponent,
    canActivate: [PatientAuthGuard]
  },
  {
    path: 'patient/doctors',
    component: SearchDoctorsComponent,
    canActivate: [PatientAuthGuard]
  },

  // Admin routes
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [AdminAuthGuard]
  },

  // Redirect unknown routes to landing page
  { path: '**', redirectTo: '' }
];
