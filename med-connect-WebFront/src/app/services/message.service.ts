import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';

export interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  message_content: string;
  is_read: boolean;
  created_at: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_name?: string;
  receiver_first_name?: string;
  receiver_last_name?: string;
  receiver_name?: string;
}

export interface ConversationPreview {
  conversation_partner_id: number;
  conversation_partner_name: string;
  conversation_partner_profile_picture?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_last_message_from_me: boolean;
}

export interface SendMessageRequest {
  receiver_id: number;
  message_content: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private handleError(error: any): Observable<never> {
    console.error('Message service error:', error);
    const message = error.error?.message || error.message || 'An error occurred';
    return throwError(() => new Error(message));
  }

  // Send a message
  sendMessage(messageData: SendMessageRequest): Observable<Message> {
    const headers = this.getHeaders();
    return this.http.post<{ success: boolean; data: Message }>(
      `${this.apiUrl}`,
      messageData,
      { headers }
    ).pipe(
      map(response => this.mapMessageData(response.data)),
      catchError(this.handleError)
    );
  }

  // Get all conversations
  getConversations(): Observable<ConversationPreview[]> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; data: ConversationPreview[] }>(
      `${this.apiUrl}/conversations`,
      { headers }
    ).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  // Get conversation with a specific user
  getConversation(userId: number, page: number = 1, limit: number = 50): Observable<{ messages: Message[]; total: number; page: number; limit: number }> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/conversations/${userId}`,
      { headers, params }
    ).pipe(
      map(response => {
        const data = response.data;
        return {
          messages: (data.messages || []).map((m: any) => this.mapMessageData(m)),
          total: data.total || 0,
          page: data.page || page,
          limit: data.limit || limit
        };
      }),
      catchError(this.handleError)
    );
  }

  // Mark conversation as read
  markAsRead(userId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.put<{ success: boolean }>(
      `${this.apiUrl}/conversations/${userId}/read`,
      {},
      { headers }
    ).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  // Get unread message count
  getUnreadCount(): Observable<number> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; data: { unread_count: number } }>(
      `${this.apiUrl}/unread-count`,
      { headers }
    ).pipe(
      map(response => response.data?.unread_count || 0),
      catchError(this.handleError)
    );
  }

  private mapMessageData(msg: any): Message {
    const senderName = msg.sender_name ||
      (msg.sender_first_name && msg.sender_last_name
        ? `${msg.sender_first_name} ${msg.sender_last_name}`
        : undefined);

    const receiverName = msg.receiver_name ||
      (msg.receiver_first_name && msg.receiver_last_name
        ? `${msg.receiver_first_name} ${msg.receiver_last_name}`
        : undefined);

    return {
      ...msg,
      sender_name: senderName,
      receiver_name: receiverName
    };
  }
}

