export interface IPrescription {
  prescription_id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  prescribed_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IPrescriptionMedication {
  medication_id: number;
  prescription_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  created_at: Date;
}

export interface ICreatePrescription {
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  notes?: string;
  medications: ICreateMedication[];
}

export interface ICreateMedication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescriptionWithDetails extends IPrescription {
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty: string;
  patient_first_name: string;
  patient_last_name: string;
  medications: IPrescriptionMedication[];
}