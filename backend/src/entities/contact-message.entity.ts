/**
 * ContactMessage Entity
 * Stores messages submitted by public visitors via the contact form
 * Database table: contact_messages
 * Owner Module: M-08 Messaging
 */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ContactMessageInsert {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export interface ContactMessageUpdate {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  subject?: string | null;
  message?: string;
  is_read?: boolean;
}
