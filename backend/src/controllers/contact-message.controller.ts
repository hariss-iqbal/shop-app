import { ContactMessageService } from '../services/contact-message.service';
import { SpamPreventionService } from '../services/spam-prevention.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateContactMessageDto,
  UpdateContactMessageDto,
  ContactMessageResponseDto,
  ContactMessageListResponseDto,
  ContactMessageFilterDto
} from '../dto/contact-message.dto';
import { CONTACT_MESSAGE_CONSTRAINTS } from '../constants/validation.constants';

/**
 * ContactMessage Controller
 * HTTP request handling for ContactMessage entity
 * Routes: /api/contact-messages
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Messages are stored as plain text without HTML interpretation.
 */
export class ContactMessageController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(
    private readonly contactMessageService: ContactMessageService,
    private readonly spamPreventionService: SpamPreventionService
  ) {}

  async getAll(filter?: ContactMessageFilterDto): Promise<ContactMessageListResponseDto> {
    return this.contactMessageService.findAll(filter);
  }

  async getById(id: string): Promise<ContactMessageResponseDto> {
    const message = await this.contactMessageService.findById(id);
    if (!message) {
      throw new Error('Contact message not found');
    }
    return message;
  }

  async create(dto: CreateContactMessageDto, clientIp?: string): Promise<ContactMessageResponseDto | null> {
    const sanitizedDto = this.sanitizeCreateDto(dto);
    this.validateCreateDto(sanitizedDto);

    const spamCheck = await this.spamPreventionService.checkSpam({
      honeypot: dto.honeypot,
      recaptchaToken: dto.recaptchaToken,
      clientIp
    });

    if (!spamCheck.allowed) {
      if (spamCheck.silent) {
        return this.contactMessageService.createSilentReject(sanitizedDto);
      }
      throw new Error(
        spamCheck.reason === 'rate_limit_exceeded'
          ? 'Too many submissions. Please wait a few minutes before trying again.'
          : 'Unable to submit message. Please try again later.'
      );
    }

    if (clientIp) {
      this.spamPreventionService.recordSubmission(clientIp);
    }

    return this.contactMessageService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateContactMessageDto): Promise<ContactMessageResponseDto> {
    return this.contactMessageService.update(id, dto);
  }

  async markAsRead(id: string): Promise<ContactMessageResponseDto> {
    return this.contactMessageService.markAsRead(id);
  }

  async markAsUnread(id: string): Promise<ContactMessageResponseDto> {
    return this.contactMessageService.markAsUnread(id);
  }

  async markAllAsRead(): Promise<void> {
    return this.contactMessageService.markAllAsRead();
  }

  async delete(id: string): Promise<void> {
    return this.contactMessageService.delete(id);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const count = await this.contactMessageService.getUnreadCount();
    return { count };
  }

  private sanitizeCreateDto(dto: CreateContactMessageDto): CreateContactMessageDto {
    return {
      ...dto,
      name: this.sanitizer.sanitizeString(dto.name),
      email: dto.email?.trim(),
      phone: dto.phone ? this.sanitizer.sanitizeString(dto.phone) : dto.phone,
      subject: dto.subject ? this.sanitizer.sanitizeString(dto.subject) : dto.subject,
      message: this.sanitizer.sanitizeString(dto.message)
    };
  }

  private validateCreateDto(dto: CreateContactMessageDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    if (dto.name.length > CONTACT_MESSAGE_CONSTRAINTS.NAME_MAX) {
      throw new Error(`Name must not exceed ${CONTACT_MESSAGE_CONSTRAINTS.NAME_MAX} characters`);
    }
    if (!dto.email || dto.email.trim().length === 0) {
      throw new Error('Email is required');
    }
    if (dto.email.length > CONTACT_MESSAGE_CONSTRAINTS.EMAIL_MAX) {
      throw new Error(`Email must not exceed ${CONTACT_MESSAGE_CONSTRAINTS.EMAIL_MAX} characters`);
    }
    if (!this.isValidEmail(dto.email)) {
      throw new Error('Invalid email format');
    }
    if (dto.phone && dto.phone.length > CONTACT_MESSAGE_CONSTRAINTS.PHONE_MAX) {
      throw new Error(`Phone must not exceed ${CONTACT_MESSAGE_CONSTRAINTS.PHONE_MAX} characters`);
    }
    if (dto.subject && dto.subject.length > CONTACT_MESSAGE_CONSTRAINTS.SUBJECT_MAX) {
      throw new Error(`Subject must not exceed ${CONTACT_MESSAGE_CONSTRAINTS.SUBJECT_MAX} characters`);
    }
    if (!dto.message || dto.message.trim().length === 0) {
      throw new Error('Message is required');
    }
    if (dto.message.length > CONTACT_MESSAGE_CONSTRAINTS.MESSAGE_MAX) {
      throw new Error(`Message must not exceed ${CONTACT_MESSAGE_CONSTRAINTS.MESSAGE_MAX} characters`);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
