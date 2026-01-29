import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { ToastService, ToastSeverity, ToastOptions, TOAST_DEFAULTS } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    mockMessageService = jasmine.createSpyObj('MessageService', ['add', 'clear']);

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MessageService, useValue: mockMessageService }
      ]
    });

    service = TestBed.inject(ToastService);
  });

  describe('service creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should inject MessageService', () => {
      expect(mockMessageService).toBeTruthy();
    });
  });

  describe('TOAST_DEFAULTS', () => {
    it('should have correct default life values', () => {
      expect(TOAST_DEFAULTS.life.success).toBe(3000);
      expect(TOAST_DEFAULTS.life.error).toBe(5000);
      expect(TOAST_DEFAULTS.life.warn).toBe(4000);
      expect(TOAST_DEFAULTS.life.info).toBe(3000);
    });

    it('should have correct position', () => {
      expect(TOAST_DEFAULTS.position).toBe('top-right');
    });

    it('should have closable as true by default', () => {
      expect(TOAST_DEFAULTS.closable).toBe(true);
    });
  });

  describe('success()', () => {
    it('should call MessageService.add with success severity', () => {
      service.success('Success Title', 'Success message');

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success Title',
        detail: 'Success message',
        life: 3000,
        sticky: false,
        closable: true,
        key: undefined
      });
    });

    it('should use custom life when provided', () => {
      service.success('Title', 'Message', 5000);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'success',
          life: 5000
        })
      );
    });

    it('should work without detail', () => {
      service.success('Title');

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'success',
          summary: 'Title',
          detail: undefined
        })
      );
    });
  });

  describe('error()', () => {
    it('should call MessageService.add with error severity', () => {
      service.error('Error Title', 'Error message');

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error Title',
        detail: 'Error message',
        life: 5000,
        sticky: false,
        closable: true,
        key: undefined
      });
    });

    it('should use custom life when provided', () => {
      service.error('Title', 'Message', 10000);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'error',
          life: 10000
        })
      );
    });
  });

  describe('warn()', () => {
    it('should call MessageService.add with warn severity', () => {
      service.warn('Warning Title', 'Warning message');

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning Title',
        detail: 'Warning message',
        life: 4000,
        sticky: false,
        closable: true,
        key: undefined
      });
    });

    it('should use custom life when provided', () => {
      service.warn('Title', 'Message', 6000);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'warn',
          life: 6000
        })
      );
    });
  });

  describe('info()', () => {
    it('should call MessageService.add with info severity', () => {
      service.info('Info Title', 'Info message');

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info Title',
        detail: 'Info message',
        life: 3000,
        sticky: false,
        closable: true,
        key: undefined
      });
    });

    it('should use custom life when provided', () => {
      service.info('Title', 'Message', 2000);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'info',
          life: 2000
        })
      );
    });
  });

  describe('show()', () => {
    it('should call MessageService.add with correct parameters', () => {
      const options: ToastOptions = {
        summary: 'Test Summary',
        detail: 'Test Detail',
        life: 4000
      };

      service.show('success', options);

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Test Summary',
        detail: 'Test Detail',
        life: 4000,
        sticky: false,
        closable: true,
        key: undefined
      });
    });

    it('should handle sticky option correctly', () => {
      const options: ToastOptions = {
        summary: 'Sticky Toast',
        sticky: true
      };

      service.show('error', options);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'error',
          sticky: true,
          life: undefined
        })
      );
    });

    it('should handle closable option', () => {
      const options: ToastOptions = {
        summary: 'Non-closable Toast',
        closable: false
      };

      service.show('info', options);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          closable: false
        })
      );
    });

    it('should handle key option', () => {
      const options: ToastOptions = {
        summary: 'Keyed Toast',
        key: 'custom-key'
      };

      service.show('success', options);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          key: 'custom-key'
        })
      );
    });

    it('should use default life when not provided and not sticky', () => {
      const options: ToastOptions = {
        summary: 'Default Life Toast'
      };

      service.show('warn', options);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          life: 4000 // warn default
        })
      );
    });

    it('should handle all severity types', () => {
      const severities: ToastSeverity[] = ['success', 'error', 'warn', 'info'];
      const expectedLives = [3000, 5000, 4000, 3000];

      severities.forEach((severity, index) => {
        mockMessageService.add.calls.reset();
        service.show(severity, { summary: 'Test' });

        expect(mockMessageService.add).toHaveBeenCalledWith(
          jasmine.objectContaining({
            severity,
            life: expectedLives[index]
          })
        );
      });
    });
  });

  describe('clear()', () => {
    it('should call MessageService.clear without key', () => {
      service.clear();

      expect(mockMessageService.clear).toHaveBeenCalledWith(undefined);
    });

    it('should call MessageService.clear with key when provided', () => {
      service.clear('custom-key');

      expect(mockMessageService.clear).toHaveBeenCalledWith('custom-key');
    });
  });

  describe('multiple toasts', () => {
    it('should allow multiple toasts to be added', () => {
      service.success('Success 1', 'Message 1');
      service.error('Error 1', 'Message 2');
      service.warn('Warning 1', 'Message 3');
      service.info('Info 1', 'Message 4');

      expect(mockMessageService.add).toHaveBeenCalledTimes(4);
    });
  });

  describe('toast stacking behavior', () => {
    it('should add toasts sequentially for stacking', () => {
      const calls: Array<{ severity: string | undefined; summary: string | undefined }> = [];
      mockMessageService.add.and.callFake((msg) => {
        calls.push({ severity: msg.severity, summary: msg.summary });
      });

      service.success('First', 'First message');
      service.error('Second', 'Second message');
      service.info('Third', 'Third message');

      expect(calls.length).toBe(3);
      expect(calls[0].summary).toBe('First');
      expect(calls[1].summary).toBe('Second');
      expect(calls[2].summary).toBe('Third');
    });
  });

  describe('edge cases', () => {
    it('should handle empty summary', () => {
      service.success('', 'Detail only');

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          summary: '',
          detail: 'Detail only'
        })
      );
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.info('Long Message', longMessage);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          detail: longMessage
        })
      );
    });

    it('should handle special characters in messages', () => {
      service.success('Special <script>alert("xss")</script>', 'Message with & < > "');

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          summary: 'Special <script>alert("xss")</script>',
          detail: 'Message with & < > "'
        })
      );
    });

    it('should handle zero life value', () => {
      service.success('Zero Life', 'Should not auto-dismiss', 0);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          life: 0
        })
      );
    });
  });
});
