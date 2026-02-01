import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OfflineIndicatorComponent } from './offline-indicator.component';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { SyncQueueService } from '../../../core/services/sync-queue.service';
import { SyncSchedulerService } from '../../../core/services/sync-scheduler.service';

/**
 * Unit tests for OfflineIndicatorComponent
 * Feature: F-020 Offline Mode and Sync
 */
describe('OfflineIndicatorComponent', () => {
  let component: OfflineIndicatorComponent;
  let fixture: ComponentFixture<OfflineIndicatorComponent>;
  let mockNetworkStatus: jasmine.SpyObj<NetworkStatusService>;
  let mockSyncQueue: jasmine.SpyObj<SyncQueueService>;
  let mockSyncScheduler: jasmine.SpyObj<SyncSchedulerService>;

  // Mutable signals for testing
  let isOnlineSignal: ReturnType<typeof signal<boolean>>;
  let isOfflineSignal: ReturnType<typeof signal<boolean>>;
  let pendingCountSignal: ReturnType<typeof signal<number>>;
  let conflictCountSignal: ReturnType<typeof signal<number>>;
  let hasPendingItemsSignal: ReturnType<typeof signal<boolean>>;
  let hasConflictsSignal: ReturnType<typeof signal<boolean>>;
  let isSyncingSignal: ReturnType<typeof signal<boolean>>;
  let syncProgressSignal: ReturnType<typeof signal<number>>;

  beforeEach(async () => {
    // Create mutable signals
    isOnlineSignal = signal(true);
    isOfflineSignal = signal(false);
    pendingCountSignal = signal(0);
    conflictCountSignal = signal(0);
    hasPendingItemsSignal = signal(false);
    hasConflictsSignal = signal(false);
    isSyncingSignal = signal(false);
    syncProgressSignal = signal(0);

    mockNetworkStatus = jasmine.createSpyObj('NetworkStatusService', [], {
      isOnline: isOnlineSignal.asReadonly(),
      isOffline: isOfflineSignal.asReadonly()
    });

    mockSyncQueue = jasmine.createSpyObj('SyncQueueService', [], {
      pendingCount: pendingCountSignal.asReadonly(),
      conflictCount: conflictCountSignal.asReadonly(),
      hasPendingItems: hasPendingItemsSignal.asReadonly(),
      hasConflicts: hasConflictsSignal.asReadonly(),
      isSyncing: isSyncingSignal.asReadonly(),
      syncProgress: syncProgressSignal.asReadonly()
    });

    mockSyncScheduler = jasmine.createSpyObj('SyncSchedulerService', ['triggerSync']);
    mockSyncScheduler.triggerSync.and.returnValue(Promise.resolve({
      success: true,
      totalItems: 1,
      syncedItems: 1,
      failedItems: 0,
      conflictItems: 0,
      errors: [],
      conflicts: [],
      syncedAt: new Date().toISOString()
    }));

    await TestBed.configureTestingModule({
      imports: [
        OfflineIndicatorComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: NetworkStatusService, useValue: mockNetworkStatus },
        { provide: SyncQueueService, useValue: mockSyncQueue },
        { provide: SyncSchedulerService, useValue: mockSyncScheduler }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should expose isOnline signal', () => {
      expect(component.isOnline).toBeDefined();
      expect(component.isOnline()).toBe(true);
    });

    it('should expose isOffline signal', () => {
      expect(component.isOffline).toBeDefined();
      expect(component.isOffline()).toBe(false);
    });

    it('should expose hasPendingItems signal', () => {
      expect(component.hasPendingItems).toBeDefined();
    });

    it('should expose hasConflicts signal', () => {
      expect(component.hasConflicts).toBeDefined();
    });

    it('should expose isSyncing signal', () => {
      expect(component.isSyncing).toBeDefined();
    });

    it('should expose syncProgress signal', () => {
      expect(component.syncProgress).toBeDefined();
    });
  });

  describe('offline mode display', () => {
    it('should not show offline tag when online', () => {
      isOnlineSignal.set(true);
      isOfflineSignal.set(false);
      fixture.detectChanges();

      const offlineTag = fixture.debugElement.query(By.css('p-tag[icon="pi pi-wifi-off"]'));
      expect(offlineTag).toBeNull();
    });

    it('should show offline tag when offline', () => {
      isOnlineSignal.set(false);
      isOfflineSignal.set(true);
      fixture.detectChanges();

      const offlineTag = fixture.debugElement.query(By.css('p-tag[icon="pi pi-wifi-off"]'));
      expect(offlineTag).toBeTruthy();
    });

    it('should display "Offline Mode" label', () => {
      isOfflineSignal.set(true);
      fixture.detectChanges();

      expect(component.offlineLabel()).toBe('Offline Mode');
    });

    it('should have tooltip explaining offline mode', () => {
      expect(component.offlineTooltip()).toContain('offline');
      expect(component.offlineTooltip()).toContain('synced when connection is restored');
    });
  });

  describe('pending items display', () => {
    it('should not show pending tag when no items pending', () => {
      hasPendingItemsSignal.set(false);
      pendingCountSignal.set(0);
      fixture.detectChanges();

      const pendingTag = fixture.debugElement.query(By.css('p-tag[icon="pi pi-clock"]'));
      expect(pendingTag).toBeNull();
    });

    it('should show pending tag when items are pending', () => {
      hasPendingItemsSignal.set(true);
      pendingCountSignal.set(3);
      isSyncingSignal.set(false);
      fixture.detectChanges();

      const pendingTag = fixture.debugElement.query(By.css('p-tag[icon="pi pi-clock"]'));
      expect(pendingTag).toBeTruthy();
    });

    it('should not show pending tag while syncing', () => {
      hasPendingItemsSignal.set(true);
      pendingCountSignal.set(3);
      isSyncingSignal.set(true);
      fixture.detectChanges();

      const pendingTag = fixture.debugElement.query(By.css('p-tag[icon="pi pi-clock"]'));
      expect(pendingTag).toBeNull();
    });

    it('should display correct singular label for 1 pending item', () => {
      pendingCountSignal.set(1);
      fixture.detectChanges();

      expect(component.pendingLabel()).toBe('1 Pending');
    });

    it('should display correct plural label for multiple pending items', () => {
      pendingCountSignal.set(5);
      fixture.detectChanges();

      expect(component.pendingLabel()).toBe('5 Pending');
    });

    it('should have correct tooltip for pending items', () => {
      pendingCountSignal.set(3);
      fixture.detectChanges();

      expect(component.pendingTooltip()).toContain('3');
      expect(component.pendingTooltip()).toContain('transactions');
    });

    it('should use singular "transaction" for 1 item', () => {
      pendingCountSignal.set(1);
      fixture.detectChanges();

      expect(component.pendingTooltip()).toContain('1 transaction waiting');
    });
  });

  describe('conflicts display', () => {
    it('should not show conflict tag when no conflicts', () => {
      hasConflictsSignal.set(false);
      conflictCountSignal.set(0);
      fixture.detectChanges();

      const conflictTag = fixture.debugElement.query(By.css('p-tag[icon="pi pi-exclamation-triangle"]'));
      expect(conflictTag).toBeNull();
    });

    it('should show conflict tag when conflicts exist', () => {
      hasConflictsSignal.set(true);
      conflictCountSignal.set(2);
      fixture.detectChanges();

      const conflictTag = fixture.debugElement.query(By.css('p-tag[icon="pi pi-exclamation-triangle"]'));
      expect(conflictTag).toBeTruthy();
    });

    it('should display correct singular label for 1 conflict', () => {
      conflictCountSignal.set(1);
      fixture.detectChanges();

      expect(component.conflictLabel()).toBe('1 Conflict');
    });

    it('should display correct plural label for multiple conflicts', () => {
      conflictCountSignal.set(3);
      fixture.detectChanges();

      expect(component.conflictLabel()).toBe('3 Conflicts');
    });

    it('should have correct tooltip for conflicts', () => {
      conflictCountSignal.set(2);
      fixture.detectChanges();

      expect(component.conflictTooltip()).toContain('2');
      expect(component.conflictTooltip()).toContain('manual resolution');
    });
  });

  describe('sync progress display', () => {
    it('should not show sync progress when not syncing', () => {
      isSyncingSignal.set(false);
      fixture.detectChanges();

      const syncProgress = fixture.debugElement.query(By.css('.sync-progress'));
      expect(syncProgress).toBeNull();
    });

    it('should show sync progress when syncing', () => {
      isSyncingSignal.set(true);
      syncProgressSignal.set(50);
      fixture.detectChanges();

      const syncProgress = fixture.debugElement.query(By.css('.sync-progress'));
      expect(syncProgress).toBeTruthy();
    });

    it('should display spinning sync icon', () => {
      isSyncingSignal.set(true);
      fixture.detectChanges();

      const spinIcon = fixture.debugElement.query(By.css('.pi-sync.pi-spin'));
      expect(spinIcon).toBeTruthy();
    });

    it('should display progress percentage', () => {
      isSyncingSignal.set(true);
      syncProgressSignal.set(75);
      fixture.detectChanges();

      const progressText = fixture.debugElement.query(By.css('.sync-progress'));
      expect(progressText.nativeElement.textContent).toContain('75%');
    });
  });

  describe('sync button', () => {
    it('should show sync button when online with pending items', () => {
      isOnlineSignal.set(true);
      hasPendingItemsSignal.set(true);
      isSyncingSignal.set(false);
      fixture.detectChanges();

      const syncButton = fixture.debugElement.query(By.css('p-button[icon="pi pi-sync"]'));
      expect(syncButton).toBeTruthy();
    });

    it('should not show sync button when offline', () => {
      isOnlineSignal.set(false);
      hasPendingItemsSignal.set(true);
      isSyncingSignal.set(false);
      fixture.detectChanges();

      const syncButton = fixture.debugElement.query(By.css('p-button[icon="pi pi-sync"]'));
      expect(syncButton).toBeNull();
    });

    it('should not show sync button when no pending items', () => {
      isOnlineSignal.set(true);
      hasPendingItemsSignal.set(false);
      isSyncingSignal.set(false);
      fixture.detectChanges();

      const syncButton = fixture.debugElement.query(By.css('p-button[icon="pi pi-sync"]'));
      expect(syncButton).toBeNull();
    });

    it('should not show sync button while syncing', () => {
      isOnlineSignal.set(true);
      hasPendingItemsSignal.set(true);
      isSyncingSignal.set(true);
      fixture.detectChanges();

      const syncButton = fixture.debugElement.query(By.css('p-button[icon="pi pi-sync"]'));
      expect(syncButton).toBeNull();
    });

    it('should trigger sync when clicked', fakeAsync(() => {
      isOnlineSignal.set(true);
      hasPendingItemsSignal.set(true);
      isSyncingSignal.set(false);
      fixture.detectChanges();

      component.triggerSync();
      tick();

      expect(mockSyncScheduler.triggerSync).toHaveBeenCalled();
    }));
  });

  describe('computed labels', () => {
    it('should update labels when counts change', () => {
      pendingCountSignal.set(1);
      fixture.detectChanges();
      expect(component.pendingLabel()).toBe('1 Pending');

      pendingCountSignal.set(10);
      fixture.detectChanges();
      expect(component.pendingLabel()).toBe('10 Pending');
    });

    it('should update conflict labels when counts change', () => {
      conflictCountSignal.set(1);
      fixture.detectChanges();
      expect(component.conflictLabel()).toBe('1 Conflict');

      conflictCountSignal.set(5);
      fixture.detectChanges();
      expect(component.conflictLabel()).toBe('5 Conflicts');
    });
  });

  describe('accessibility', () => {
    it('should have tooltip on sync button', () => {
      isOnlineSignal.set(true);
      hasPendingItemsSignal.set(true);
      isSyncingSignal.set(false);
      fixture.detectChanges();

      const syncButton = fixture.debugElement.query(By.css('p-button[icon="pi pi-sync"]'));
      expect(syncButton.attributes['pTooltip']).toBe('Sync Now');
    });
  });
});
