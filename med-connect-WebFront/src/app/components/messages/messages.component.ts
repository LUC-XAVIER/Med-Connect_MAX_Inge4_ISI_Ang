import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../dashboard/sidebar/sidebar.component';
import { MessageService, Message, ConversationPreview } from '../../services/message.service';
import { ConnectionService } from '../../services/connection.service';
import { ConnectionWithDetails } from '../../models/connection.model';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { interval, Subscription } from 'rxjs';
import { ProfileModalComponent } from '../profile/profile-modal.component';
import { ProfilePictureService } from '../../services/profile-picture.service';


@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, ProfileModalComponent],
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
  showProfileModal = false;
  selectedUserForNewChat: ConnectionWithDetails | null = null;

  // Search
  searchQuery = '';

  // Unread count
  unreadCount: number = 0;

  // Auto-refresh subscription
  private refreshSubscription?: Subscription;
  private websocketSubscription?: Subscription;

  constructor(
    private messageService: MessageService,
    private connectionService: ConnectionService,
    private authService: AuthService,
    private websocketService: WebSocketService,
    private route: ActivatedRoute,
    private profilePictureService: ProfilePictureService
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      this.userRole = this.currentUser.role || 'patient';
    }

    // Connect to WebSocket for realtime messaging
    this.websocketService.connect();
    
    // Subscribe to incoming messages
    this.websocketSubscription = this.websocketService.message$.subscribe((message: any) => {
      // If message is for current conversation, add it
      if (this.selectedConversation && 
          (message.sender_id === this.selectedConversation.conversation_partner_id ||
           message.receiver_id === this.selectedConversation.conversation_partner_id)) {
        // Check if message already exists by message_id or by duplicate content check
        const exists = this.messages.find(m => 
          m.message_id === message.message_id || 
          (m.sender_id === message.sender_id && 
           m.created_at === message.created_at &&
           m.message_content === message.message_content)
        );
        if (!exists) {
          this.messages.push(message);
          // Ensure messages stay sorted by timestamp
          this.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setTimeout(() => this.scrollToBottom(), 100);
        }
      }
      // Refresh conversations to update last message (lightweight refresh)
      this.messageService.getConversations().subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          this.applyFilters();
        },
        error: (error) => console.error('Error refreshing conversations:', error)
      });
      this.loadUnreadCount();
    });

    this.loadConversations();
    this.loadConnectedUsers();
    this.loadUnreadCount();

    // Check for userId query param to auto-select conversation
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        const userId = parseInt(params['userId']);
        // Find conversation or create new one
        const existingConv = this.conversations.find(c => c.conversation_partner_id === userId);
        if (existingConv) {
          this.selectConversation(existingConv);
        } else {
          // Try to find in connected users
          const connectedUser = this.connectedUsers.find(u => {
            const id = this.userRole === 'patient' ? u.doctor_user_id : u.patient_user_id;
            return id === userId;
          });
          if (connectedUser) {
            this.startNewConversation(connectedUser);
          }
        }
      }
    });

    // Auto-refresh conversations every 60 seconds as fallback
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
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    // Don't disconnect websocket - keep it connected for other components
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
        // Messages come in ASC order from backend, use them as-is (oldest to newest)
        this.messages = response.messages;
        this.isLoadingMessages = false;
        // Scroll to bottom
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        // Check if it's a connection error
        const errorMsg = error.error?.error || error.error?.message || error.message || '';
        if (errorMsg.includes('connected') || error.status === 403) {
          this.messages = [];
          // Don't show alert, just show empty state
        } else {
          this.messages = [];
          console.error('Unexpected error loading messages:', error);
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
    const messageContent = this.messageContent.trim();
    this.messageContent = '';

    // Always use HTTP for now to ensure reliability, WebSocket for receiving
    this.messageService.sendMessage({
      receiver_id: receiverId,
      message_content: messageContent
    }).subscribe({
      next: (message) => {
        // Add message to list if not already there
        const exists = this.messages.find(m => m.message_id === message.message_id);
        if (!exists) {
          this.messages.push(message);
        }
        // Refresh conversations to update last message
        this.loadConversations();
        // Scroll to bottom
        setTimeout(() => this.scrollToBottom(), 100);
        this.isSendingMessage = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert(error.error?.message || error.message || 'Failed to send message');
        this.messageContent = messageContent; // Restore message
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

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    // Reload user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  onProfileUpdated(): void {
    // Reload user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  getProfilePictureUrl(profilePicture: string | null | undefined): string {
    return this.profilePictureService.getProfilePictureUrl(profilePicture);
  }
}

