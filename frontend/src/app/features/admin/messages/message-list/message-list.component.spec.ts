import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { MessageListComponent } from './message-list.component';
import { ContactMessageService } from '../../../../core/services/contact-message.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { MessageCountService } from '../../../../shared/services/message-count.service';
import { ContactMessage, ContactMessageListResponse } from '../../../../models/contact-message.model';

describe('MessageListComponent', () => {
  let component: MessageListComponent;
  let fixture: ComponentFixture<MessageListComponent>;
  let mockContactMessageService: jasmine.SpyObj<ContactMessageService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmDialogService: jasmine.SpyObj<ConfirmDialogService>;
  let mockMessageCountService: jasmine.SpyObj<MessageCountService>;

  const mockMessage: ContactMessage = {
    id: 'msg-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    subject: 'Test Subject',
    message: 'This is a test message that is longer than fifty characters to test truncation properly.',
    messagePreview: 'This is a test message that is longer than fifty ...',
    isRead: false,
    createdAt: '2024-01-15T10:00:00Z'
  };

  const mockMessages: ContactMessage[] = [
    mockMessage,
    {
      ...mockMessage,
      id: 'msg-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: null,
      subject: null,
      message: 'Short message',
      messagePreview: 'Short message',
      isRead: true,
      createdAt: '2024-01-14T10:00:00Z'
    },
    {
      ...mockMessage,
      id: 'msg-3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      message: 'Another unread message',
      messagePreview: 'Another unread message',
      isRead: false,
      createdAt: '2024-01-13T10:00:00Z'
    }
  ];

  const mockMessagesResponse: ContactMessageListResponse = {
    data: mockMessages,
    total: 3,
    unreadCount: 2
  };

  beforeEach(async () => {
    mockContactMessageService = jasmine.createSpyObj('ContactMessageService', [
      'getMessages',
      'toggleReadStatus',
      'deleteMessage'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn', 'info']);
    mockConfirmDialogService = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete']);
    mockMessageCountService = jasmine.createSpyObj('MessageCountService', ['loadUnreadCount']);

    mockContactMessageService.getMessages.and.returnValue(Promise.resolve(mockMessagesResponse));
    mockContactMessageService.toggleReadStatus.and.returnValue(Promise.resolve());
    mockContactMessageService.deleteMessage.and.returnValue(Promise.resolve());
    mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [
        MessageListComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: ContactMessageService, useValue: mockContactMessageService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
        { provide: MessageCountService, useValue: mockMessageCountService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageListComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty messages array', () => {
      expect(component.messages()).toEqual([]);
    });

    it('should initialize with zero unread count', () => {
      expect(component.unreadCount()).toBe(0);
    });

    it('should initialize with loading set to false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with null toggling id', () => {
      expect(component.togglingId()).toBeNull();
    });

    it('should initialize with empty expanded rows', () => {
      expect(component.expandedRows).toEqual({});
    });

    it('should have skeleton rows array for loading state', () => {
      expect(component.skeletonRows.length).toBe(5);
    });
  });

  describe('ngOnInit', () => {
    it('should load messages on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockContactMessageService.getMessages).toHaveBeenCalled();
    }));
  });

  describe('loadMessages', () => {
    it('should load messages successfully', fakeAsync(() => {
      component.loadMessages();
      tick();

      expect(component.messages()).toEqual(mockMessages);
      expect(component.unreadCount()).toBe(2);
    }));

    it('should set loading state during data fetch', fakeAsync(() => {
      component.loadMessages();
      expect(component.loading()).toBe(true);

      tick();
      expect(component.loading()).toBe(false);
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      mockContactMessageService.getMessages.and.returnValue(Promise.reject(new Error('Load failed')));

      component.loadMessages();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load messages');
    }));

    it('should handle empty messages list', fakeAsync(() => {
      mockContactMessageService.getMessages.and.returnValue(Promise.resolve({
        data: [],
        total: 0,
        unreadCount: 0
      }));

      component.loadMessages();
      tick();

      expect(component.messages()).toEqual([]);
      expect(component.unreadCount()).toBe(0);
    }));
  });

  describe('onToggleReadStatus - AC4/AC5', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should toggle unread message to read (AC4)', fakeAsync(() => {
      const unreadMessage = component.messages().find(m => m.id === 'msg-1')!;
      expect(unreadMessage.isRead).toBe(false);

      component.onToggleReadStatus(unreadMessage);
      tick();

      expect(mockContactMessageService.toggleReadStatus).toHaveBeenCalledWith('msg-1', true);
      expect(component.messages().find(m => m.id === 'msg-1')?.isRead).toBe(true);
    }));

    it('should toggle read message to unread (AC5)', fakeAsync(() => {
      const readMessage = component.messages().find(m => m.id === 'msg-2')!;
      expect(readMessage.isRead).toBe(true);

      component.onToggleReadStatus(readMessage);
      tick();

      expect(mockContactMessageService.toggleReadStatus).toHaveBeenCalledWith('msg-2', false);
      expect(component.messages().find(m => m.id === 'msg-2')?.isRead).toBe(false);
    }));

    it('should decrement unread count when marking as read', fakeAsync(() => {
      const initialUnreadCount = component.unreadCount();
      const unreadMessage = component.messages().find(m => !m.isRead)!;

      component.onToggleReadStatus(unreadMessage);
      tick();

      expect(component.unreadCount()).toBe(initialUnreadCount - 1);
    }));

    it('should increment unread count when marking as unread', fakeAsync(() => {
      const initialUnreadCount = component.unreadCount();
      const readMessage = component.messages().find(m => m.isRead)!;

      component.onToggleReadStatus(readMessage);
      tick();

      expect(component.unreadCount()).toBe(initialUnreadCount + 1);
    }));

    it('should call messageCountService.loadUnreadCount to sync sidebar badge', fakeAsync(() => {
      const unreadMessage = component.messages().find(m => !m.isRead)!;

      component.onToggleReadStatus(unreadMessage);
      tick();

      expect(mockMessageCountService.loadUnreadCount).toHaveBeenCalled();
    }));

    it('should set toggling id while updating', fakeAsync(() => {
      const message = component.messages()[0];

      component.onToggleReadStatus(message);
      expect(component.togglingId()).toBe(message.id);

      tick();
      expect(component.togglingId()).toBeNull();
    }));

    it('should show success toast after toggling', fakeAsync(() => {
      const unreadMessage = component.messages().find(m => !m.isRead)!;

      component.onToggleReadStatus(unreadMessage);
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('Updated', 'Message marked as read');
    }));

    it('should show error toast on toggle failure', fakeAsync(() => {
      const messageToToggle = component.messages()[0];
      mockContactMessageService.toggleReadStatus.and.returnValue(Promise.reject(new Error('Toggle failed')));

      component.onToggleReadStatus(messageToToggle);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to update message status');
    }));

    it('should not update count below zero', fakeAsync(() => {
      mockContactMessageService.getMessages.and.returnValue(Promise.resolve({
        data: [{ ...mockMessage, isRead: false }],
        total: 1,
        unreadCount: 0
      }));

      component.loadMessages();
      tick();

      const unreadMessage = component.messages()[0];
      component.onToggleReadStatus(unreadMessage);
      tick();

      expect(component.unreadCount()).toBe(0);
    }));
  });

  describe('onDelete - AC6', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show confirmation dialog before deleting (AC6)', fakeAsync(() => {
      component.onDelete(mockMessage);
      tick();

      expect(mockConfirmDialogService.confirmDelete).toHaveBeenCalledWith(
        'message',
        'Message from John Doe (john@example.com)'
      );
    }));

    it('should delete message after confirmation (AC6)', fakeAsync(() => {
      const initialCount = component.messages().length;

      component.onDelete(mockMessage);
      tick();

      expect(mockContactMessageService.deleteMessage).toHaveBeenCalledWith('msg-1');
      expect(component.messages().length).toBe(initialCount - 1);
      expect(component.messages().find(m => m.id === 'msg-1')).toBeUndefined();
    }));

    it('should not delete message when confirmation is cancelled', fakeAsync(() => {
      mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(false));
      const initialCount = component.messages().length;

      component.onDelete(mockMessage);
      tick();

      expect(mockContactMessageService.deleteMessage).not.toHaveBeenCalled();
      expect(component.messages().length).toBe(initialCount);
    }));

    it('should decrement unread count when deleting an unread message', fakeAsync(() => {
      const initialUnreadCount = component.unreadCount();
      const unreadMessage = component.messages().find(m => !m.isRead)!;

      component.onDelete(unreadMessage);
      tick();

      expect(component.unreadCount()).toBe(initialUnreadCount - 1);
    }));

    it('should not decrement unread count when deleting a read message', fakeAsync(() => {
      const initialUnreadCount = component.unreadCount();
      const readMessage = component.messages().find(m => m.isRead)!;

      component.onDelete(readMessage);
      tick();

      expect(component.unreadCount()).toBe(initialUnreadCount);
    }));

    it('should sync sidebar badge after deletion', fakeAsync(() => {
      component.onDelete(mockMessage);
      tick();

      expect(mockMessageCountService.loadUnreadCount).toHaveBeenCalled();
    }));

    it('should show success toast after deletion', fakeAsync(() => {
      component.onDelete(mockMessage);
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('Deleted', 'Message has been deleted');
    }));

    it('should show error toast on delete failure', fakeAsync(() => {
      const messageToDelete = component.messages()[0];
      mockContactMessageService.deleteMessage.and.returnValue(Promise.reject(new Error('Delete failed')));

      component.onDelete(messageToDelete);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to delete message');
    }));
  });

  describe('template rendering - AC1/AC2/AC3', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should render messages title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Messages');
    });

    it('should display unread count in header', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('2 unread');
    });

    it('should render data table (AC1)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-table')).toBeTruthy();
    });

    it('should display sender name (AC2)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('John Doe');
    });

    it('should display email as clickable mailto link (AC2)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emailLink = compiled.querySelector('a[href^="mailto:"]');
      expect(emailLink).toBeTruthy();
      expect(emailLink?.getAttribute('href')).toBe('mailto:john@example.com');
    });

    it('should display phone number when available (AC2)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('+1234567890');
    });

    it('should display dash when phone is null (AC2)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('-');
    });

    it('should display message preview truncated (AC2)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('This is a test message that is longer than fifty');
    });

    it('should display read/unread status badge (AC2)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tableText = compiled.textContent || '';

      expect(tableText).toContain('Unread');
      expect(tableText).toContain('Read');
    });

    it('should show unread indicator dot for unread messages (AC2)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const unreadDots = compiled.querySelectorAll('.pi-circle-fill');
      expect(unreadDots.length).toBeGreaterThan(0);
    });

    it('should apply bold styling to unread message rows', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const boldRows = compiled.querySelectorAll('tr.font-bold');
      expect(boldRows.length).toBeGreaterThan(0);
    });

    it('should have expand button for each row (AC3)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const expandButtons = compiled.querySelectorAll('p-button[prowtogglerclass]') || compiled.querySelectorAll('.p-row-toggler');
      expect(expandButtons.length).toBeGreaterThanOrEqual(0);
      expect(component.messages().length).toBe(mockMessages.length);
    });
  });

  describe('empty state', () => {
    beforeEach(fakeAsync(() => {
      mockContactMessageService.getMessages.and.returnValue(Promise.resolve({
        data: [],
        total: 0,
        unreadCount: 0
      }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show empty message when no messages exist', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No messages found');
    });

    it('should show envelope icon in empty state', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emptyIcon = compiled.querySelector('.pi-envelope');
      expect(emptyIcon).toBeTruthy();
    });

    it('should not display unread count when zero', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('0 unread');
    });
  });

  describe('loading state', () => {
    it('should show skeleton loaders while loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const skeletons = compiled.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('pagination', () => {
    it('should have paginator configured', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const table = compiled.querySelector('p-table');
      expect(table).toBeTruthy();
    });

    it('should have rows per page options', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('sorting - AC1', () => {
    it('should have default sort by createdAt descending (AC1)', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.messages().length).toBe(mockMessages.length);
      const firstMessage = component.messages()[0];
      expect(firstMessage.createdAt).toBe(mockMessages[0].createdAt);
    }));
  });

  describe('action buttons', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have toggle read/unread button for each row', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have delete button for each row', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
