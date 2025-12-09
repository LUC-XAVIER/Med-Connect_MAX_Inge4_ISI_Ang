export interface IMedicalRecord {
  _id?: string;
  record_id?: string;
  patient_id: number;
  title: string;
  description?: string;
  record_type: 'lab_result' | 'x_ray' | 'prescription' | 'doctor_note' | 'imaging_report' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  file_format: string;
  record_date: Date;
  upload_date: Date;
  uploaded_by: number;
  tags?: string[];
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateMedicalRecord {
  patient_id: number;
  title: string;
  description?: string;
  record_type: 'lab_result' | 'x_ray' | 'prescription' | 'doctor_note' | 'imaging_report' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  file_format: string;
  record_date: Date;
  uploaded_by: number;
  tags?: string[];
}