import { Injectable } from '@angular/core';
import { Message } from './message.service';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environments';

export interface SocketMessage {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  message_content: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private messageSubject = new Subject<SocketMessage>();
  public message$ = this.messageSubject.asObservable();
  private connected = false;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken() || localStorage.getItem('token');
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    // Connect to the same server as the API
    const socketUrl = environment.apiUrl.replace('/api/v1', '');
    
    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    this.socket.on('receive_message', (data: { message: SocketMessage }) => {
      console.log('Received message via WebSocket:', data.message);
      this.messageSubject.next(data.message);
    });

    this.socket.on('message_sent', (data: { success: boolean; message: any }) => {
      if (data.success && data.message) {
        // Convert to Message format
        const message: Message = {
          message_id: data.message.message_id,
          sender_id: data.message.sender_id,
          receiver_id: data.message.receiver_id,
          message_content: data.message.message_content,
          created_at: data.message.created_at,
          is_read: data.message.is_read || false
        };
        this.messageSubject.next(message);
      }
    });

    this.socket.on('receive_message', (data: { message: any }) => {
      if (data.message) {
        // Convert to Message format
        const message: Message = {
          message_id: data.message.message_id,
          sender_id: data.message.sender_id,
          receiver_id: data.message.receiver_id,
          message_content: data.message.message_content,
          created_at: data.message.created_at,
          is_read: data.message.is_read || false
        };
        this.messageSubject.next(message);
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      // Don't show error to user if it's just a connection issue
      if (error.message && !error.message.includes('Authentication')) {
        console.warn('WebSocket connection issue, will retry:', error);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  sendMessage(receiverId: number, messageContent: string): void {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('send_message', {
      receiver_id: receiverId,
      message_content: messageContent
    });
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
}

