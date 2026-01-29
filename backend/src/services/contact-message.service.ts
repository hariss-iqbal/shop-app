import { ContactMessageRepository } from '../repositories/contact-message.repository';
import { ContactMessage, ContactMessageInsert } from '../entities/contact-message.entity';
import {
  CreateContactMessageDto,
  UpdateContactMessageDto,
  ContactMessageResponseDto,
  ContactMessageListResponseDto,
  ContactMessageFilterDto
} from '../dto/contact-message.dto';

/**
 * ContactMessage Service
 * Business logic for ContactMessage entity
 * Owner Module: M-08 Messaging
 */
export class ContactMessageService {
  constructor(private readonly contactMessageRepository: ContactMessageRepository) {}

  async findAll(filter?: ContactMessageFilterDto): Promise<ContactMessageListResponseDto> {
    const messages = await this.contactMessageRepository.findAll({
      isRead: filter?.isRead
    });

    const total = await this.contactMessageRepository.count(filter?.isRead);
    const unreadCount = await this.contactMessageRepository.getUnreadCount();

    return {
      data: messages.map(this.toResponseDto),
      total,
      unreadCount
    };
  }

  async findById(id: string): Promise<ContactMessageResponseDto | null> {
    const message = await this.contactMessageRepository.findById(id);
    return message ? this.toResponseDto(message) : null;
  }

  async create(dto: CreateContactMessageDto): Promise<ContactMessageResponseDto> {
    const messageInsert: ContactMessageInsert = {
      name: dto.name.trim(),
      email: dto.email.trim(),
      phone: dto.phone?.trim() || null,
      subject: dto.subject?.trim() || null,
      message: dto.message.trim(),
      is_read: false
    };

    const message = await this.contactMessageRepository.create(messageInsert);
    return this.toResponseDto(message);
  }

  createSilentReject(dto: CreateContactMessageDto): ContactMessageResponseDto {
    return {
      id: crypto.randomUUID(),
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      subject: dto.subject ?? null,
      message: dto.message,
      messagePreview: dto.message.length > 50
        ? dto.message.substring(0, 50) + '...'
        : dto.message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
  }

  async update(id: string, dto: UpdateContactMessageDto): Promise<ContactMessageResponseDto> {
    const existing = await this.contactMessageRepository.findById(id);
    if (!existing) {
      throw new Error(`Contact message with id "${id}" not found`);
    }

    if (dto.isRead !== undefined) {
      const message = dto.isRead
        ? await this.contactMessageRepository.markAsRead(id)
        : await this.contactMessageRepository.markAsUnread(id);
      return this.toResponseDto(message);
    }

    return this.toResponseDto(existing);
  }

  async markAsRead(id: string): Promise<ContactMessageResponseDto> {
    const existing = await this.contactMessageRepository.findById(id);
    if (!existing) {
      throw new Error(`Contact message with id "${id}" not found`);
    }

    const message = await this.contactMessageRepository.markAsRead(id);
    return this.toResponseDto(message);
  }

  async markAsUnread(id: string): Promise<ContactMessageResponseDto> {
    const existing = await this.contactMessageRepository.findById(id);
    if (!existing) {
      throw new Error(`Contact message with id "${id}" not found`);
    }

    const message = await this.contactMessageRepository.markAsUnread(id);
    return this.toResponseDto(message);
  }

  async markAllAsRead(): Promise<void> {
    await this.contactMessageRepository.markAllAsRead();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.contactMessageRepository.findById(id);
    if (!existing) {
      throw new Error(`Contact message with id "${id}" not found`);
    }

    await this.contactMessageRepository.delete(id);
  }

  async getUnreadCount(): Promise<number> {
    return this.contactMessageRepository.getUnreadCount();
  }

  private toResponseDto(message: ContactMessage): ContactMessageResponseDto {
    return {
      id: message.id,
      name: message.name,
      email: message.email,
      phone: message.phone,
      subject: message.subject,
      message: message.message,
      messagePreview: message.message.length > 50
        ? message.message.substring(0, 50) + '...'
        : message.message,
      isRead: message.is_read,
      createdAt: message.created_at
    };
  }
}
