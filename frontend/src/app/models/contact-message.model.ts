/**
 * ContactMessage Model
 * Stores messages submitted via the contact form
 */
export interface ContactMessage {
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

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  honeypot?: string;
  recaptchaToken?: string | null;
}

export interface UpdateContactMessageRequest {
  isRead?: boolean;
}

export interface ContactMessageListResponse {
  data: ContactMessage[];
  total: number;
  unreadCount: number;
}

export interface ContactMessageFilter {
  isRead?: boolean;
}
