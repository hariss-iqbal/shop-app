import { TestBed } from '@angular/core/testing';
import { InventoryTransferService } from './inventory-transfer.service';
import { SupabaseService } from './supabase.service';
import { InventoryTransferStatus } from '../../enums';

describe('InventoryTransferService', () => {
  let service: InventoryTransferService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  const mockTransferData = {
    id: 'transfer-123',
    transfer_number: 'TR-20240115-0001',
    source_location_id: 'loc-1',
    destination_location_id: 'loc-2',
    status: 'pending',
    initiated_by_user_id: 'user-123',
    completed_by_user_id: null,
    notes: 'Test transfer',
    initiated_at: '2024-01-15T10:00:00Z',
    completed_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: null,
    source_location: {
      id: 'loc-1',
      name: 'Main Store',
      code: 'MAIN'
    },
    destination_location: {
      id: 'loc-2',
      name: 'Branch Store',
      code: 'BRANCH'
    },
    items: [
      {
        id: 'item-1',
        transfer_id: 'transfer-123',
        phone_id: 'phone-456',
        quantity: 5,
        notes: null,
        created_at: '2024-01-15T10:00:00Z',
        phone: {
          id: 'phone-456',
          model: 'iPhone 15',
          condition: 'new',
          brand: {
            id: 'brand-1',
            name: 'Apple'
          }
        }
      }
    ]
  };

  const mockQueryBuilder = {
    select: jasmine.createSpy('select').and.callFake(() => mockQueryBuilder),
    eq: jasmine.createSpy('eq').and.callFake(() => mockQueryBuilder),
    order: jasmine.createSpy('order').and.callFake(() => mockQueryBuilder),
    range: jasmine.createSpy('range').and.callFake(() => mockQueryBuilder),
    single: jasmine.createSpy('single').and.callFake(() => Promise.resolve({ data: mockTransferData, error: null })),
    update: jasmine.createSpy('update').and.callFake(() => mockQueryBuilder)
  };

  beforeEach(() => {
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', ['from', 'rpc']);
    supabaseSpy.from.and.returnValue(mockQueryBuilder);
    supabaseSpy.rpc.and.returnValue(Promise.resolve({ data: null, error: null }) as any);

    TestBed.configureTestingModule({
      providers: [
        InventoryTransferService,
        { provide: SupabaseService, useValue: supabaseSpy }
      ]
    });

    service = TestBed.inject(InventoryTransferService);
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTransfers', () => {
    beforeEach(() => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({ data: [mockTransferData], error: null, count: 1 })
      );
    });

    it('should return paginated transfers', async () => {
      const result = await service.getTransfers({ first: 0, rows: 10 });

      expect(supabaseServiceSpy.from).toHaveBeenCalledWith('inventory_transfers');
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should apply source location filter', async () => {
      await service.getTransfers(
        { first: 0, rows: 10 },
        { sourceLocationId: 'loc-1' }
      );

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('source_location_id', 'loc-1');
    });

    it('should apply destination location filter', async () => {
      await service.getTransfers(
        { first: 0, rows: 10 },
        { destinationLocationId: 'loc-2' }
      );

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('destination_location_id', 'loc-2');
    });

    it('should apply status filter', async () => {
      await service.getTransfers(
        { first: 0, rows: 10 },
        { status: InventoryTransferStatus.PENDING }
      );

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('should apply sorting', async () => {
      await service.getTransfers({
        first: 0,
        rows: 10,
        sortField: 'initiated_at',
        sortOrder: -1
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('initiated_at', { ascending: false });
    });
  });

  describe('getTransferById', () => {
    it('should return transfer by id', async () => {
      const result = await service.getTransferById('transfer-123');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'transfer-123');
      expect(result?.transferNumber).toBe('TR-20240115-0001');
    });

    it('should return null when not found', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );

      const result = await service.getTransferById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTransferByNumber', () => {
    it('should find transfer by transfer number', async () => {
      const result = await service.getTransferByNumber('TR-20240115-0001');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('transfer_number', 'TR-20240115-0001');
      expect(result?.id).toBe('transfer-123');
    });
  });

  describe('initiateTransfer', () => {
    it('should create a new transfer via RPC', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: { success: true, transferId: 'new-transfer', transferNumber: 'TR-20240115-0002' },
          error: null
        }) as any
      );

      const request = {
        sourceLocationId: 'loc-1',
        destinationLocationId: 'loc-2',
        items: [{ productId: 'phone-456', quantity: 3, notes: null }],
        notes: 'Test'
      };

      const result = await service.initiateTransfer(request);

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('initiate_inventory_transfer', {
        p_source_location_id: 'loc-1',
        p_destination_location_id: 'loc-2',
        p_items: jasmine.any(Object),
        p_notes: 'Test'
      });
      expect(result.success).toBe(true);
      expect(result.transferNumber).toBe('TR-20240115-0002');
    });

    it('should return error result on failure', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: { success: false, error: 'Insufficient stock' },
          error: null
        }) as any
      );

      const result = await service.initiateTransfer({
        sourceLocationId: 'loc-1',
        destinationLocationId: 'loc-2',
        items: [{ productId: 'phone-456', quantity: 100, notes: null }],
        notes: null
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient stock');
    });
  });

  describe('completeTransfer', () => {
    it('should complete transfer via RPC', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: { success: true, transferId: 'transfer-123' },
          error: null
        }) as any
      );

      const result = await service.completeTransfer('transfer-123');

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('complete_inventory_transfer', {
        p_transfer_id: 'transfer-123'
      });
      expect(result.success).toBe(true);
    });

    it('should return error for already completed transfer', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: { success: false, error: 'Transfer cannot be completed. Current status: completed' },
          error: null
        }) as any
      );

      const result = await service.completeTransfer('completed-transfer');

      expect(result.success).toBe(false);
    });
  });

  describe('cancelTransfer', () => {
    it('should cancel transfer via RPC', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({
          data: { success: true, transferId: 'transfer-123' },
          error: null
        }) as any
      );

      const result = await service.cancelTransfer('transfer-123');

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('cancel_inventory_transfer', {
        p_transfer_id: 'transfer-123'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('startTransit', () => {
    it('should update transfer status to in_transit', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { ...mockTransferData, status: 'in_transit' }, error: null })
      );

      await service.startTransit('transfer-123');

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'in_transit' });
    });
  });

  describe('updateTransfer', () => {
    it('should update transfer notes', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { ...mockTransferData, notes: 'Updated notes' }, error: null })
      );

      await service.updateTransfer('transfer-123', { notes: 'Updated notes' });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ notes: 'Updated notes' });
    });
  });

  describe('getPendingTransfersCount', () => {
    it('should return count of pending transfers', async () => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ count: 5, error: null })
      );

      const count = await service.getPendingTransfersCount();

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending');
      expect(count).toBe(5);
    });
  });

  describe('getInTransitTransfersCount', () => {
    it('should return count of in-transit transfers', async () => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ count: 3, error: null })
      );

      const count = await service.getInTransitTransfersCount();

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'in_transit');
      expect(count).toBe(3);
    });
  });
});
