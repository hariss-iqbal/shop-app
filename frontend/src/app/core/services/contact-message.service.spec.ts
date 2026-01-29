import { TestBed } from '@angular/core/testing';
import { ContactMessageService } from './contact-message.service';
import { SupabaseService } from './supabase.service';
import { SpamPreventionService } from './spam-prevention.service';
import { RecaptchaService } from './recaptcha.service';
import { InputSanitizationService } from './input-sanitization.service';
import { CreateContactMessageRequest } from '../../models/contact-message.model';

describe('ContactMessageService', () => {
  let service: ContactMessageService;
  let mockSupabaseService: any;
  let mockSpamPreventionService: jasmine.SpyObj<SpamPreventionService>;
  let mockRecaptchaService: jasmine.SpyObj<RecaptchaService>;
  let mockInputSanitizationService: jasmine.SpyObj<InputSanitizationService>;

  const mockDbRows = [
    {
      id: 'msg-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      subject: 'Test Subject',
      message: 'This is a test message that is longer than fifty characters to test truncation.',
      is_read: false,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'msg-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: null,
      subject: null,
      message: 'Short message',
      is_read: true,
      created_at: '2024-01-14T10:00:00Z'
    }
  ];

  beforeEach(() => {
    mockSupabaseService = {
      from: jasmine.createSpy('from')
    };

    mockSpamPreventionService = jasmine.createSpyObj('SpamPreventionService', [
      'isHoneypotFilled',
      'isRateLimited',
      'getRemainingWaitSeconds',
      'recordSubmission'
    ]);

    mockRecaptchaService = jasmine.createSpyObj('RecaptchaService', [
      'isEnabled',
      'getToken'
    ]);

    mockInputSanitizationService = jasmine.createSpyObj('InputSanitizationService', [
      'sanitize',
      'sanitizeOrNull'
    ]);

    mockSpamPreventionService.isHoneypotFilled.and.returnValue(false);
    mockSpamPreventionService.isRateLimited.and.returnValue(false);
    mockRecaptchaService.isEnabled.and.returnValue(false);
    mockInputSanitizationService.sanitize.and.callFake((value: string) => value.trim());
    mockInputSanitizationService.sanitizeOrNull.and.callFake((value: string | null | undefined) =>
      value ? value.trim() : null
    );

    TestBed.configureTestingModule({
      providers: [
        ContactMessageService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: SpamPreventionService, useValue: mockSpamPreventionService },
        { provide: RecaptchaService, useValue: mockRecaptchaService },
        { provide: InputSanitizationService, useValue: mockInputSanitizationService }
      ]
    });

    service = TestBed.inject(ContactMessageService);
  });

  describe('getMessages', () => {
    it('should fetch messages and return mapped ContactMessage objects', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq'),
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: mockDbRows, count: 2, error: null })
        )
      });

      const unreadSelectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 1, error: null })
        )
      });

      let callCount = 0;
      mockSupabaseService.from.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: selectMock };
        }
        return { select: unreadSelectMock };
      });

      const result = await service.getMessages();

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.unreadCount).toBe(1);
    });

    it('should map database row to ContactMessage with correct field names', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq'),
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: [mockDbRows[0]], count: 1, error: null })
        )
      });

      const unreadSelectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 1, error: null })
        )
      });

      let callCount = 0;
      mockSupabaseService.from.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: selectMock };
        }
        return { select: unreadSelectMock };
      });

      const result = await service.getMessages();
      const message = result.data[0];

      expect(message.id).toBe('msg-1');
      expect(message.name).toBe('John Doe');
      expect(message.email).toBe('john@example.com');
      expect(message.phone).toBe('+1234567890');
      expect(message.subject).toBe('Test Subject');
      expect(message.isRead).toBe(false);
      expect(message.createdAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should truncate message preview to 50 characters with ellipsis', async () => {
      const longMessage = 'This is a test message that is longer than fifty characters to test truncation.';
      const selectMock = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({
            data: [{
              ...mockDbRows[0],
              message: longMessage
            }],
            count: 1,
            error: null
          })
        )
      });

      const unreadSelectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 0, error: null })
        )
      });

      let callCount = 0;
      mockSupabaseService.from.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: selectMock };
        }
        return { select: unreadSelectMock };
      });

      const result = await service.getMessages();
      const message = result.data[0];

      expect(message.messagePreview.length).toBe(53);
      expect(message.messagePreview.endsWith('...')).toBe(true);
    });

    it('should not truncate short messages', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: [mockDbRows[1]], count: 1, error: null })
        )
      });

      const unreadSelectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 0, error: null })
        )
      });

      let callCount = 0;
      mockSupabaseService.from.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: selectMock };
        }
        return { select: unreadSelectMock };
      });

      const result = await service.getMessages();
      const message = result.data[0];

      expect(message.messagePreview).toBe('Short message');
      expect(message.messagePreview.endsWith('...')).toBe(false);
    });

    it('should filter by isRead when filter is provided', async () => {
      const eqMock = jasmine.createSpy('eq').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: [], count: 0, error: null })
        )
      });

      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: eqMock,
        order: jasmine.createSpy('order')
      });

      const unreadSelectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 0, error: null })
        )
      });

      let callCount = 0;
      mockSupabaseService.from.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: selectMock };
        }
        return { select: unreadSelectMock };
      });

      await service.getMessages({ isRead: false });

      expect(eqMock).toHaveBeenCalledWith('is_read', false);
    });

    it('should throw error when database query fails', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: null, count: 0, error: { message: 'Database error' } })
        )
      });

      mockSupabaseService.from.and.returnValue({ select: selectMock });

      await expectAsync(service.getMessages()).toBeRejectedWithError('Database error');
    });

    it('should order messages by created_at descending', async () => {
      const orderMock = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: [], count: 0, error: null })
      );

      const selectMock = jasmine.createSpy('select').and.returnValue({
        order: orderMock
      });

      const unreadSelectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 0, error: null })
        )
      });

      let callCount = 0;
      mockSupabaseService.from.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: selectMock };
        }
        return { select: unreadSelectMock };
      });

      await service.getMessages();

      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('toggleReadStatus', () => {
    it('should update is_read status for message', async () => {
      const eqMock = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: null })
      );

      const updateMock = jasmine.createSpy('update').and.returnValue({
        eq: eqMock
      });

      mockSupabaseService.from.and.returnValue({ update: updateMock });

      await service.toggleReadStatus('msg-1', true);

      expect(mockSupabaseService.from).toHaveBeenCalledWith('contact_messages');
      expect(updateMock).toHaveBeenCalledWith({ is_read: true });
      expect(eqMock).toHaveBeenCalledWith('id', 'msg-1');
    });

    it('should set is_read to false when toggling to unread', async () => {
      const eqMock = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: null })
      );

      const updateMock = jasmine.createSpy('update').and.returnValue({
        eq: eqMock
      });

      mockSupabaseService.from.and.returnValue({ update: updateMock });

      await service.toggleReadStatus('msg-2', false);

      expect(updateMock).toHaveBeenCalledWith({ is_read: false });
    });

    it('should throw error when update fails', async () => {
      const eqMock = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: { message: 'Update failed' } })
      );

      const updateMock = jasmine.createSpy('update').and.returnValue({
        eq: eqMock
      });

      mockSupabaseService.from.and.returnValue({ update: updateMock });

      await expectAsync(service.toggleReadStatus('msg-1', true))
        .toBeRejectedWithError('Update failed');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message by id', async () => {
      const eqMock = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: null })
      );

      const deleteMock = jasmine.createSpy('delete').and.returnValue({
        eq: eqMock
      });

      mockSupabaseService.from.and.returnValue({ delete: deleteMock });

      await service.deleteMessage('msg-1');

      expect(mockSupabaseService.from).toHaveBeenCalledWith('contact_messages');
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'msg-1');
    });

    it('should throw error when delete fails', async () => {
      const eqMock = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: { message: 'Delete failed' } })
      );

      const deleteMock = jasmine.createSpy('delete').and.returnValue({
        eq: eqMock
      });

      mockSupabaseService.from.and.returnValue({ delete: deleteMock });

      await expectAsync(service.deleteMessage('msg-1'))
        .toBeRejectedWithError('Delete failed');
    });
  });

  describe('submitContactMessage', () => {
    const validRequest: CreateContactMessageRequest = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      subject: 'Test Subject',
      message: 'This is a test message'
    };

    it('should submit valid contact message', async () => {
      const insertMock = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: null })
      );

      mockSupabaseService.from.and.returnValue({ insert: insertMock });

      await service.submitContactMessage(validRequest);

      expect(mockSupabaseService.from).toHaveBeenCalledWith('contact_messages');
      expect(insertMock).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        subject: 'Test Subject',
        message: 'This is a test message',
        is_read: false
      });
    });

    it('should sanitize input fields', async () => {
      const insertMock = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: null })
      );

      mockSupabaseService.from.and.returnValue({ insert: insertMock });

      await service.submitContactMessage(validRequest);

      expect(mockInputSanitizationService.sanitize).toHaveBeenCalledWith('Test User');
      expect(mockInputSanitizationService.sanitize).toHaveBeenCalledWith('This is a test message');
      expect(mockInputSanitizationService.sanitizeOrNull).toHaveBeenCalledWith('+1234567890');
      expect(mockInputSanitizationService.sanitizeOrNull).toHaveBeenCalledWith('Test Subject');
    });

    it('should record submission after successful insert', async () => {
      const insertMock = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: null })
      );

      mockSupabaseService.from.and.returnValue({ insert: insertMock });

      await service.submitContactMessage(validRequest);

      expect(mockSpamPreventionService.recordSubmission).toHaveBeenCalled();
    });

    it('should silently return when honeypot is filled (spam detection)', async () => {
      mockSpamPreventionService.isHoneypotFilled.and.returnValue(true);

      await service.submitContactMessage({ ...validRequest, honeypot: 'spam content' });

      expect(mockSupabaseService.from).not.toHaveBeenCalled();
    });

    it('should throw error when rate limited', async () => {
      mockSpamPreventionService.isRateLimited.and.returnValue(true);
      mockSpamPreventionService.getRemainingWaitSeconds.and.returnValue(120);

      await expectAsync(service.submitContactMessage(validRequest))
        .toBeRejectedWithError('Too many submissions. Please wait 2 minutes before trying again.');
    });

    it('should throw error with singular minute when wait time is less than 60 seconds', async () => {
      mockSpamPreventionService.isRateLimited.and.returnValue(true);
      mockSpamPreventionService.getRemainingWaitSeconds.and.returnValue(45);

      await expectAsync(service.submitContactMessage(validRequest))
        .toBeRejectedWithError('Too many submissions. Please wait 1 minute before trying again.');
    });

    it('should add recaptcha token when recaptcha is enabled', async () => {
      mockRecaptchaService.isEnabled.and.returnValue(true);
      mockRecaptchaService.getToken.and.returnValue(Promise.resolve('test-token'));

      const insertMock = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: null })
      );

      mockSupabaseService.from.and.returnValue({ insert: insertMock });

      const requestWithToken = { ...validRequest };
      await service.submitContactMessage(requestWithToken);

      expect(mockRecaptchaService.getToken).toHaveBeenCalledWith('contact_form');
    });

    it('should throw error when insert fails', async () => {
      const insertMock = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: { message: 'Insert failed' } })
      );

      mockSupabaseService.from.and.returnValue({ insert: insertMock });

      await expectAsync(service.submitContactMessage(validRequest))
        .toBeRejectedWithError('Insert failed');
    });

    it('should handle null phone and subject', async () => {
      const insertMock = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: null })
      );

      mockSupabaseService.from.and.returnValue({ insert: insertMock });

      const requestWithNulls: CreateContactMessageRequest = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      };

      await service.submitContactMessage(requestWithNulls);

      expect(insertMock).toHaveBeenCalledWith(jasmine.objectContaining({
        phone: null,
        subject: null
      }));
    });
  });
});
