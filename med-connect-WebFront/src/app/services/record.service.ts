import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface MedicalRecord {
  record_id: string;
  patient_id: number;
  title: string;
  description?: string;
  record_type: string;
  file_path?: string;
  file_url?: string; // Added for download
  file_name: string;
  file_size?: number;
  record_date: string;
  created_at?: string;
  updated_at?: string;
  uploaded_at?: string; // Added for display
}

export interface CreateRecordRequest {
  title: string;
  description?: string;
  record_type: string;
  record_date: string;
}

export interface UpdateRecordRequest {
  title?: string;
  description?: string;
  record_type?: string;
  record_date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Upload medical record
  uploadRecord(file: File, recordData: CreateRecordRequest): Observable<MedicalRecord> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', recordData.title);
    if (recordData.description) formData.append('description', recordData.description);
    formData.append('record_type', recordData.record_type);
    formData.append('record_date', recordData.record_date);

    return this.http.post<{ success: boolean; data: MedicalRecord }>(
      `${this.apiUrl}/records/upload`,
      formData
    ).pipe(map(response => response.data));
  }

  // Get all my records
  getMyRecords(filters?: {
    record_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Observable<MedicalRecord[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.record_type) params = params.set('record_type', filters.record_type);
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/records`,
      { params }
    ).pipe(map(response => {
      // Backend returns { records, statistics, pagination } or just records array
      if (response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data.records && Array.isArray(response.data.records)) {
          return response.data.records;
        }
      }
      return [];
    }));
  }

  // Get record by ID
  getRecordById(recordId: string): Observable<MedicalRecord> {
    return this.http.get<{ success: boolean; data: MedicalRecord }>(
      `${this.apiUrl}/records/${recordId}`
    ).pipe(map(response => response.data));
  }

  // Search records
  searchRecords(searchTerm: string): Observable<MedicalRecord[]> {
    return this.http.get<{ success: boolean; data: MedicalRecord[] }>(
      `${this.apiUrl}/records/search`,
      { params: { q: searchTerm } }
    ).pipe(map(response => response.data || []));
  }

  // Update record
  updateRecord(recordId: string, updates: UpdateRecordRequest): Observable<MedicalRecord> {
    return this.http.put<{ success: boolean; data: MedicalRecord }>(
      `${this.apiUrl}/records/${recordId}`,
      updates
    ).pipe(map(response => response.data));
  }

  // Delete record
  deleteRecord(recordId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/records/${recordId}`);
  }

  // Get file URL
  getFileUrl(filePath: string): string {
    // Backend serves files from /uploads directory
    if (filePath.startsWith('http')) {
      return filePath;
    }
    return `${environment.apiUrl.replace('/api/v1', '')}${filePath}`;
  }
}

