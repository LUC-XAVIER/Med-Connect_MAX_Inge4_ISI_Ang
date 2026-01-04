export interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  message_content: string;
  is_read: boolean;
  created_at: Date;
}

export interface CreateMessageDTO {
  sender_id: number;
  receiver_id: number;
  message_content: string;
}

export interface MessageWithUserInfo extends Message {
  sender_first_name: string;
  sender_last_name: string;
  sender_profile_picture?: string;
  receiver_first_name: string;
  receiver_last_name: string;
  receiver_profile_picture?: string;
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