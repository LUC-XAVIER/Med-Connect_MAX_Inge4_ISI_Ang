import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../dashboard/sidebar/sidebar.component';
import { MessageService, Message, ConversationPreview } from '../../services/message.service';
import { ConnectionService } from '../../services/connection.service';
import { ConnectionWithDetails } from '../../models/connection.model';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  userRole: 'patient' | 'doctor' = 'patient';

  // Conversations
  conversations: ConversationPreview[] = [];
  filteredConversations: ConversationPreview[] = [];
  selectedConversation: ConversationPreview | null = null;

  // Messages
  messages: Message[] = [];
  isLoading = true;
  isLoadingMessages = false;
  isSendingMessage = false;

  // Message input
  messageContent = '';

  // Connected users (for starting new conversations)
  connectedUsers: ConnectionWithDetails[] = [];
  showNewConversationModal = false;
  selectedUserForNewChat: ConnectionWithDetails | null = null;

  // Search
  searchQuery = '';

  // Unread count
  unreadCount: number = 0;

  // Auto-refresh subscription
  private refreshSubscription?: Subscription;

  constructor(
    private messageService: MessageService,
    private connectionService: ConnectionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      this.userRole = this.currentUser.role || 'patient';
    }
    this.loadConversations();
    this.loadConnectedUsers();
    this.loadUnreadCount();

    // Auto-refresh conversations every 60 seconds to avoid rate limiting
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadConversations();
      this.loadUnreadCount();
      if (this.selectedConversation) {
        this.loadMessages(this.selectedConversation.conversation_partner_id);
      }
    });
  }

  loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (count: number) => {
        this.unreadCount = count;
      },
      error: (error: any) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadConversations(): void {
    this.isLoading = true;
    this.messageService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.conversations = [];
        this.filteredConversations = [];
        this.isLoading = false;
      }
    });
  }

  loadConnectedUsers(): void {
    if (this.userRole === 'patient') {
      this.connectionService.getPatientConnections('approved').subscribe({
        next: (connections) => {
          this.connectedUsers = connections.filter(c => c.status === 'approved');
        },
        error: (error) => {
          console.error('Error loading connected doctors:', error);
          this.connectedUsers = [];
        }
      });
    } else if (this.userRole === 'doctor') {
      this.connectionService.getDoctorConnections('approved').subscribe({
        next: (connections) => {
          this.connectedUsers = connections.filter(c => c.status === 'approved');
        },
        error: (error) => {
          console.error('Error loading connected patients:', error);
          this.connectedUsers = [];
        }
      });
    }
  }

  selectConversation(conversation: ConversationPreview): void {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.conversation_partner_id);
    // Mark as read
    this.messageService.markAsRead(conversation.conversation_partner_id).subscribe({
      next: () => {
        // Update unread count locally
        conversation.unread_count = 0;
        this.loadConversations(); // Refresh to update counts
      },
      error: (error) => {
        console.error('Error marking as read:', error);
      }
    });
  }

  loadMessages(userId: number): void {
    this.isLoadingMessages = true;
    this.messageService.getConversation(userId).subscribe({
      next: (response) => {
        this.messages = response.messages;
        this.isLoadingMessages = false;
        // Scroll to bottom
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        if (error.status === 500 && error.error?.error?.includes('connected users')) {
          // Users are not connected, show empty state
          this.messages = [];
          alert('You can only view messages with connected users. Please connect with this user first.');
        } else {
          this.messages = [];
        }
        this.isLoadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.messageContent.trim() || !this.selectedConversation) {
      return;
    }

    this.isSendingMessage = true;
    const receiverId = this.selectedConversation.conversation_partner_id;

    this.messageService.sendMessage({
      receiver_id: receiverId,
      message_content: this.messageContent.trim()
    }).subscribe({
      next: (message) => {
        this.messageContent = '';
        // Add message to list
        this.messages.push(message);
        // Refresh conversations to update last message
        this.loadConversations();
        // Scroll to bottom
        setTimeout(() => this.scrollToBottom(), 100);
        this.isSendingMessage = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert(error.message || 'Failed to send message');
        this.isSendingMessage = false;
      }
    });
  }

  startNewConversation(user: ConnectionWithDetails): void {
    // Check if conversation already exists
    const existingConversation = this.conversations.find(
      c => c.conversation_partner_id === (this.userRole === 'patient' ? user.doctor_user_id : user.patient_user_id)
    );

    if (existingConversation) {
      this.selectConversation(existingConversation);
    } else {
      // Create a new conversation preview
      const partnerId = this.userRole === 'patient' ? user.doctor_user_id! : user.patient_user_id!;
      const partnerName = this.userRole === 'patient' 
        ? `Dr. ${user.doctor_first_name} ${user.doctor_last_name}`
        : `${user.patient_first_name} ${user.patient_last_name}`;

      const newConversation: ConversationPreview = {
        conversation_partner_id: partnerId,
        conversation_partner_name: partnerName,
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: 0,
        is_last_message_from_me: false
      };

      this.selectedConversation = newConversation;
      this.messages = [];
    }

    this.closeNewConversationModal();
  }

  openNewConversationModal(): void {
    this.showNewConversationModal = true;
  }

  closeNewConversationModal(): void {
    this.showNewConversationModal = false;
    this.selectedUserForNewChat = null;
  }

  getUserDisplayName(user: ConnectionWithDetails): string {
    if (this.userRole === 'patient') {
      return `Dr. ${user.doctor_first_name} ${user.doctor_last_name}`;
    } else {
      return `${user.patient_first_name} ${user.patient_last_name}`;
    }
  }

  getUserUserId(user: ConnectionWithDetails): number {
    return this.userRole === 'patient' ? user.doctor_user_id! : user.patient_user_id!;
  }

  isMyMessage(message: Message): boolean {
    return message.sender_id === this.currentUser?.user_id;
  }

  applyFilters(): void {
    if (!this.searchQuery.trim()) {
      this.filteredConversations = [...this.conversations];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredConversations = this.conversations.filter(conv =>
      conv.conversation_partner_name.toLowerCase().includes(query) ||
      conv.last_message.toLowerCase().includes(query)
    );
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  scrollToBottom(): void {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
}

