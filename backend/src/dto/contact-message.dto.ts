/**
 * ContactMessage DTOs
 * Data Transfer Objects for ContactMessage entity
 */

export interface CreateContactMessageDto {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  honeypot?: string;
  recaptchaToken?: string;
}

export interface UpdateContactMessageDto {
  isRead?: boolean;
}

export interface ContactMessageResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  messagePreview: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContactMessageListResponseDto {
  data: ContactMessageResponseDto[];
  total: number;
  unreadCount: number;
}

export interface ContactMessageFilterDto {
  isRead?: boolean;
}
