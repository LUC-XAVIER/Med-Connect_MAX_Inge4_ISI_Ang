import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export enum PrescriptionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface PrescriptionMedication {
  medication_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  prescription_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  diagnosis?: string;
  notes?: string;
  status: PrescriptionStatus;
  prescribed_date: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  doctor_name?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  // For backward compatibility - use first medication if medications array exists
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  // Backend returns medications array
  medications?: PrescriptionMedication[];
}

export interface CreatePrescriptionRequest {
  patient_user_id: number | null;
  appointment_id?: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Helper to map backend prescription data to frontend format
  private mapPrescriptionData(pres: any): Prescription {
    // Construct names from first_name and last_name if needed
    const patientName = pres.patient_name || 
      (pres.patient_first_name && pres.patient_last_name 
        ? `${pres.patient_first_name} ${pres.patient_last_name}` 
        : undefined);
    
    const doctorName = pres.doctor_name || 
      (pres.doctor_first_name && pres.doctor_last_name 
        ? `${pres.doctor_first_name} ${pres.doctor_last_name}` 
        : undefined);

    // Flatten first medication for backward compatibility
    const firstMed = pres.medications && pres.medications.length > 0 ? pres.medications[0] : null;

    return {
      ...pres,
      patient_name: patientName,
      doctor_name: doctorName,
      // Flatten first medication if exists
      medication_name: pres.medication_name || firstMed?.medication_name,
      dosage: pres.dosage || firstMed?.dosage,
      frequency: pres.frequency || firstMed?.frequency,
      duration: pres.duration || firstMed?.duration,
      instructions: pres.instructions || firstMed?.instructions,
    };
  }

  // Create prescription (doctor only)
  createPrescription(prescriptionData: CreatePrescriptionRequest): Observable<Prescription> {
    return this.http.post<{ success: boolean; data: Prescription }>(
      `${this.apiUrl}/prescriptions`,
      prescriptionData
    ).pipe(map(response => this.mapPrescriptionData(response.data)));
  }

  // Get my prescriptions (works for both patient and doctor)
  getMyPrescriptions(): Observable<Prescription[]> {
    return this.http.get<{ success: boolean; data: Prescription[] }>(
      `${this.apiUrl}/prescriptions`
    ).pipe(
      map(response => {
        const prescriptions = response.data || [];
        return prescriptions.map(pres => this.mapPrescriptionData(pres));
      })
    );
  }

  // Get prescription by ID
  getPrescriptionById(prescriptionId: number): Observable<Prescription> {
    return this.http.get<{ success: boolean; data: Prescription }>(
      `${this.apiUrl}/prescriptions/${prescriptionId}`
    ).pipe(map(response => this.mapPrescriptionData(response.data)));
  }

  // Update prescription status (doctor only)
  updateStatus(prescriptionId: number, status: PrescriptionStatus): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/prescriptions/${prescriptionId}/status`,
      { status }
    );
  }
}

