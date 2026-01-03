import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'message' | 'system';
  read: boolean;
  data?: any;
  created_at: string;
}

export interface CreateNotificationRequest {
  user_id: number;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'message' | 'system';
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;
  private notificationSubject = new Subject<Notification>();
  public notifications$ = this.notificationSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get user notifications
  getUserNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<{ success: boolean; data: Notification[] }>(
      `${this.apiUrl}/users/${userId}/notifications`
    ).pipe(map(response => response.data || []));
  }

  // Create notification
  createNotification(notificationData: CreateNotificationRequest): Observable<Notification> {
    return this.http.post<{ success: boolean; data: Notification }>(
      `${this.apiUrl}/notifications`,
      notificationData
    ).pipe(map(response => response.data));
  }

  // Mark notification as read
  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  // Mark all as read
  markAllAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${userId}/notifications/read-all`, {});
  }

  // Delete notification
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notifications/${notificationId}`);
  }

  // Push new notification in real-time (for WebSocket/Socket.io)
  pushNotification(notification: Notification): void {
    this.notificationSubject.next(notification);
  }

  // Create appointment notification
  createAppointmentNotification(
    userId: number,
    appointmentData: any,
    action: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'completed'
  ): Observable<Notification> {
    const messages = {
      created: `New appointment scheduled for ${appointmentData.appointment_date} at ${appointmentData.appointment_time}`,
      updated: `Your appointment has been updated`,
      cancelled: `Your appointment on ${appointmentData.appointment_date} has been cancelled`,
      confirmed: `Your appointment on ${appointmentData.appointment_date} has been confirmed`,
      completed: `Your appointment on ${appointmentData.appointment_date} has been marked as completed`
    };

    const titles = {
      created: 'New Appointment Scheduled',
      updated: 'Appointment Updated',
      cancelled: 'Appointment Cancelled',
      confirmed: 'Appointment Confirmed',
      completed: 'Appointment Completed'
    };

    return this.createNotification({
      user_id: userId,
      title: titles[action],
      message: messages[action],
      type: 'appointment',
      data: appointmentData
    });
  }
}
