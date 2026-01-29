import { SupabaseClient } from '@supabase/supabase-js';
import { ContactMessage, ContactMessageInsert, ContactMessageUpdate } from '../entities/contact-message.entity';

/**
 * ContactMessage Repository
 * Handles database operations for ContactMessage entity
 * Table: contact_messages
 */
export class ContactMessageRepository {
  private readonly tableName = 'contact_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ContactMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*');

    if (options?.isRead !== undefined) {
      query = query.eq('is_read', options.isRead);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<ContactMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(message: ContactMessageInsert): Promise<ContactMessage> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, message: ContactMessageUpdate): Promise<ContactMessage> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(message)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async count(isRead?: boolean): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (isRead !== undefined) {
      query = query.eq('is_read', isRead);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async getUnreadCount(): Promise<number> {
    return this.count(false);
  }

  async markAsRead(id: string): Promise<ContactMessage> {
    return this.update(id, { is_read: true });
  }

  async markAsUnread(id: string): Promise<ContactMessage> {
    return this.update(id, { is_read: false });
  }

  async markAllAsRead(): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw error;
  }
}
