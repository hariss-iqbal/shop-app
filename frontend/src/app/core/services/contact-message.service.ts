import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SpamPreventionService } from './spam-prevention.service';
import { RecaptchaService } from './recaptcha.service';
import { InputSanitizationService } from './input-sanitization.service';
import {
  CreateContactMessageRequest,
  ContactMessage,
  ContactMessageListResponse,
  ContactMessageFilter
} from '../../models/contact-message.model';

@Injectable({
  providedIn: 'root'
})
export class ContactMessageService {
  private supabase = inject(SupabaseService);
  private spamPrevention = inject(SpamPreventionService);
  private recaptchaService = inject(RecaptchaService);
  private sanitizer = inject(InputSanitizationService);

  async getMessages(filter?: ContactMessageFilter): Promise<ContactMessageListResponse> {
    let query = this.supabase
      .from('contact_messages')
      .select('*', { count: 'exact' });

    if (filter?.isRead !== undefined) {
      query = query.eq('is_read', filter.isRead);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const { count: unreadCount, error: unreadError } = await this.supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (unreadError) throw new Error(unreadError.message);

    const messages: ContactMessage[] = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      messagePreview: row.message.length > 50
        ? row.message.substring(0, 50) + '...'
        : row.message,
      isRead: row.is_read,
      createdAt: row.created_at
    }));

    return {
      data: messages,
      total: count || 0,
      unreadCount: unreadCount || 0
    };
  }

  async toggleReadStatus(id: string, isRead: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('contact_messages')
      .update({ is_read: isRead })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async deleteMessage(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async submitContactMessage(request: CreateContactMessageRequest): Promise<void> {
    if (this.spamPrevention.isHoneypotFilled(request.honeypot)) {
      return;
    }

    if (this.spamPrevention.isRateLimited()) {
      const waitSeconds = this.spamPrevention.getRemainingWaitSeconds();
      const waitMinutes = Math.ceil(waitSeconds / 60);
      throw new Error(
        `Too many submissions. Please wait ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''} before trying again.`
      );
    }

    if (this.recaptchaService.isEnabled()) {
      const token = await this.recaptchaService.getToken('contact_form');
      if (token) {
        request.recaptchaToken = token;
      }
    }

    const { error } = await this.supabase
      .from('contact_messages')
      .insert({
        name: this.sanitizer.sanitize(request.name),
        email: request.email.trim(),
        phone: this.sanitizer.sanitizeOrNull(request.phone),
        subject: this.sanitizer.sanitizeOrNull(request.subject),
        message: this.sanitizer.sanitize(request.message),
        is_read: false
      });

    if (error) {
      throw new Error(error.message);
    }

    this.spamPrevention.recordSubmission();
  }
}
