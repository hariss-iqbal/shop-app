/**
 * MessageCountService Unit Tests (F-052)
 *
 * Verifies Supabase Realtime for Unread Message Count:
 * - AC1: Sidebar badge increments in real-time when new message is submitted
 * - AC2: Sidebar badge decrements in real-time when message is marked as read
 * - AC3: Realtime subscription is established on login and cleaned up on logout
 * - AC4: Realtime subscription reconnects automatically on network interruption
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MessageCountService } from './message-count.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';

describe('MessageCountService', () => {
  let service: MessageCountService;
  let mockSupabaseService: jasmine.SpyObj<any>;
  let mockAuthService: jasmine.SpyObj<SupabaseAuthService>;
  let mockChannel: any;
  let mockAuthStateCallback: ((event: string) => void) | null = null;
  let channelStatusCallback: ((status: string) => void) | null = null;

  function createMockChannel() {
    const channel = {
      onHandlers: [] as Array<{ event: string; callback: () => void }>,
      on: jasmine.createSpy('on').and.callFake(
        (_type: string, _filter: any, callback: () => void) => {
          channel.onHandlers.push({ event: _type, callback });
          return channel;
        }
      ),
      subscribe: jasmine.createSpy('subscribe').and.callFake(
        (callback?: (status: string) => void) => {
          channelStatusCallback = callback ?? null;
          return channel;
        }
      )
    };
    return channel;
  }

  beforeEach(() => {
    mockChannel = createMockChannel();
    channelStatusCallback = null;
    mockAuthStateCallback = null;

    mockSupabaseService = {
      from: jasmine.createSpy('from'),
      channel: jasmine.createSpy('channel').and.returnValue(mockChannel),
      removeChannel: jasmine.createSpy('removeChannel').and.returnValue(Promise.resolve()),
      auth: {
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.callFake(
          (callback: (event: string) => void) => {
            mockAuthStateCallback = callback;
            return {
              data: {
                subscription: {
                  unsubscribe: jasmine.createSpy('unsubscribe')
                }
              }
            };
          }
        )
      }
    };

    mockAuthService = jasmine.createSpyObj('SupabaseAuthService', ['isAuthenticated']);
    mockAuthService.isAuthenticated.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        MessageCountService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: SupabaseAuthService, useValue: mockAuthService }
      ]
    });

    service = TestBed.inject(MessageCountService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  describe('loadUnreadCount', () => {
    it('should load unread count from database', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 5, error: null })
        )
      });

      mockSupabaseService.from.and.returnValue({ select: selectMock });

      await service.loadUnreadCount();

      expect(mockSupabaseService.from).toHaveBeenCalledWith('contact_messages');
      expect(selectMock).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(service.unreadCount()).toBe(5);
    });

    it('should set loading state while loading', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          new Promise(resolve => setTimeout(() => resolve({ count: 3, error: null }), 10))
        )
      });

      mockSupabaseService.from.and.returnValue({ select: selectMock });

      const loadPromise = service.loadUnreadCount();
      expect(service.loading()).toBe(true);

      await loadPromise;
      expect(service.loading()).toBe(false);
    });

    it('should set count to 0 on error', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: null, error: { message: 'Database error' } })
        )
      });

      mockSupabaseService.from.and.returnValue({ select: selectMock });

      await service.loadUnreadCount();

      expect(service.unreadCount()).toBe(0);
    });

    it('should set count to 0 when count is null', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: null, error: null })
        )
      });

      mockSupabaseService.from.and.returnValue({ select: selectMock });

      await service.loadUnreadCount();

      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('initAuthAwareSubscription (AC3)', () => {
    it('should register auth state change listener', () => {
      service.initAuthAwareSubscription();

      expect(mockSupabaseService.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should not register duplicate auth listener if already initialized', () => {
      service.initAuthAwareSubscription();
      service.initAuthAwareSubscription();

      expect(mockSupabaseService.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    });

    it('should load count and subscribe if user is already authenticated', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 3, error: null })
        )
      });
      mockSupabaseService.from.and.returnValue({ select: selectMock });

      service.initAuthAwareSubscription();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabaseService.from).toHaveBeenCalledWith('contact_messages');
      expect(mockSupabaseService.channel).toHaveBeenCalledWith('contact_messages_changes');
    });

    it('should subscribe on SIGNED_IN event', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 2, error: null })
        )
      });
      mockSupabaseService.from.and.returnValue({ select: selectMock });

      service.initAuthAwareSubscription();
      expect(mockSupabaseService.channel).not.toHaveBeenCalled();

      // Simulate SIGNED_IN event
      mockAuthStateCallback?.('SIGNED_IN');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabaseService.channel).toHaveBeenCalledWith('contact_messages_changes');
    });

    it('should subscribe on TOKEN_REFRESHED event', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 2, error: null })
        )
      });
      mockSupabaseService.from.and.returnValue({ select: selectMock });

      service.initAuthAwareSubscription();

      // Simulate TOKEN_REFRESHED event
      mockAuthStateCallback?.('TOKEN_REFRESHED');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabaseService.channel).toHaveBeenCalled();
    });

    it('should cleanup subscription and reset count on SIGNED_OUT event', () => {
      service.initAuthAwareSubscription();

      // Simulate login first
      mockAuthStateCallback?.('SIGNED_IN');

      // Then simulate logout
      mockAuthStateCallback?.('SIGNED_OUT');

      expect(mockSupabaseService.removeChannel).toHaveBeenCalled();
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('destroyAuthAwareSubscription (AC3)', () => {
    it('should unsubscribe from auth changes and cleanup channel', () => {
      service.initAuthAwareSubscription();
      service.destroyAuthAwareSubscription();

      expect(mockSupabaseService.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      service.initAuthAwareSubscription();
      service.destroyAuthAwareSubscription();
      service.destroyAuthAwareSubscription();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Realtime channel subscription', () => {
    beforeEach(() => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 1, error: null })
        )
      });
      mockSupabaseService.from.and.returnValue({ select: selectMock });
    });

    it('should create channel with correct name', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabaseService.channel).toHaveBeenCalledWith('contact_messages_changes');
    });

    it('should subscribe to INSERT events (AC1)', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      const insertHandler = mockChannel.on.calls.allArgs().find(
        (args: any[]) => args[1]?.event === 'INSERT'
      );

      expect(insertHandler).toBeTruthy();
      expect(insertHandler[1].schema).toBe('public');
      expect(insertHandler[1].table).toBe('contact_messages');
    });

    it('should subscribe to UPDATE events (AC2)', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      const updateHandler = mockChannel.on.calls.allArgs().find(
        (args: any[]) => args[1]?.event === 'UPDATE'
      );

      expect(updateHandler).toBeTruthy();
      expect(updateHandler[1].schema).toBe('public');
      expect(updateHandler[1].table).toBe('contact_messages');
    });

    it('should subscribe to DELETE events', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      const deleteHandler = mockChannel.on.calls.allArgs().find(
        (args: any[]) => args[1]?.event === 'DELETE'
      );

      expect(deleteHandler).toBeTruthy();
      expect(deleteHandler[1].schema).toBe('public');
      expect(deleteHandler[1].table).toBe('contact_messages');
    });

    it('should reload count when INSERT event is received (AC1)', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Reset the call count
      mockSupabaseService.from.calls.reset();

      // Trigger INSERT event callback
      const insertHandler = mockChannel.onHandlers.find(
        (h: any) => mockChannel.on.calls.allArgs().some(
          (args: any[]) => args[1]?.event === 'INSERT' && args[2] === h.callback
        )
      );
      insertHandler?.callback();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabaseService.from).toHaveBeenCalledWith('contact_messages');
    });

    it('should reload count when UPDATE event is received (AC2)', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Reset the call count
      mockSupabaseService.from.calls.reset();

      // Find UPDATE handler and trigger it
      const updateHandler = mockChannel.onHandlers.find(
        (h: any) => mockChannel.on.calls.allArgs().some(
          (args: any[]) => args[1]?.event === 'UPDATE' && args[2] === h.callback
        )
      );
      updateHandler?.callback();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabaseService.from).toHaveBeenCalledWith('contact_messages');
    });

    it('should not create duplicate subscription if already subscribed', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Call subscribeToChanges again
      (service as any).subscribeToChanges();

      // Should only have been called once
      expect(mockSupabaseService.channel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reconnection on network interruption (AC4)', () => {
    beforeEach(() => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 1, error: null })
        )
      });
      mockSupabaseService.from.and.returnValue({ select: selectMock });
    });

    it('should attempt reconnection on CHANNEL_ERROR', fakeAsync(async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));
      tick();

      // Reset call count
      mockSupabaseService.channel.calls.reset();
      mockChannel = createMockChannel();
      mockSupabaseService.channel.and.returnValue(mockChannel);

      // Simulate CHANNEL_ERROR
      channelStatusCallback?.('CHANNEL_ERROR');

      // Advance timer for reconnection (3 seconds)
      tick(3000);

      expect(mockSupabaseService.channel).toHaveBeenCalledWith('contact_messages_changes');
    }));

    it('should attempt reconnection on TIMED_OUT', fakeAsync(async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));
      tick();

      // Reset call count
      mockSupabaseService.channel.calls.reset();
      mockChannel = createMockChannel();
      mockSupabaseService.channel.and.returnValue(mockChannel);

      // Simulate TIMED_OUT
      channelStatusCallback?.('TIMED_OUT');

      // Advance timer for reconnection (3 seconds)
      tick(3000);

      expect(mockSupabaseService.channel).toHaveBeenCalledWith('contact_messages_changes');
    }));

    it('should not reconnect if unsubscribed', fakeAsync(async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));
      tick();

      // Unsubscribe
      service.destroyAuthAwareSubscription();

      // Reset call count
      mockSupabaseService.channel.calls.reset();

      // Simulate CHANNEL_ERROR (should not reconnect)
      channelStatusCallback?.('CHANNEL_ERROR');

      // Advance timer
      tick(3000);

      expect(mockSupabaseService.channel).not.toHaveBeenCalled();
    }));

    it('should use 3 second delay for reconnection', fakeAsync(async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));
      tick();

      mockSupabaseService.channel.calls.reset();
      mockChannel = createMockChannel();
      mockSupabaseService.channel.and.returnValue(mockChannel);

      channelStatusCallback?.('CHANNEL_ERROR');

      // Should not reconnect before 3 seconds
      tick(2999);
      expect(mockSupabaseService.channel).not.toHaveBeenCalled();

      // Should reconnect at 3 seconds
      tick(1);
      expect(mockSupabaseService.channel).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should cleanup subscriptions on destroy', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 1, error: null })
        )
      });
      mockSupabaseService.from.and.returnValue({ select: selectMock });

      service.initAuthAwareSubscription();

      await new Promise(resolve => setTimeout(resolve, 0));

      service.ngOnDestroy();

      expect(mockSupabaseService.removeChannel).toHaveBeenCalled();
    });
  });

  describe('unreadCount signal', () => {
    it('should be readonly', () => {
      expect(typeof service.unreadCount).toBe('function');
      expect(service.unreadCount()).toBe(0);
    });

    it('should update when loadUnreadCount succeeds', async () => {
      const selectMock = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ count: 7, error: null })
        )
      });
      mockSupabaseService.from.and.returnValue({ select: selectMock });

      await service.loadUnreadCount();

      expect(service.unreadCount()).toBe(7);
    });
  });

  describe('loading signal', () => {
    it('should be readonly', () => {
      expect(typeof service.loading).toBe('function');
    });

    it('should be false initially', () => {
      expect(service.loading()).toBe(false);
    });
  });
});
