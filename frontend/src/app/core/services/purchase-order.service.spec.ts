import { TestBed } from '@angular/core/testing';
import { PurchaseOrderService } from './purchase-order.service';
import { SupabaseService } from './supabase.service';
import { PurchaseOrderStatus, PhoneCondition } from '../../enums';
import { CreatePurchaseOrderRequest, ReceivePurchaseOrderRequest } from '../../models/purchase-order.model';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  let mockSupabaseService: any;
  let mockFrom: jasmine.Spy;

  const mockPurchaseOrdersData = [
    {
      id: 'po-1',
      po_number: 'PO-0001',
      supplier_id: 'supplier-1',
      order_date: '2024-01-15',
      total_amount: 5000,
      status: 'pending',
      notes: null,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: null,
      suppliers: { id: 'supplier-1', name: 'Tech Supplies Inc' },
      purchase_order_items: [
        {
          id: 'item-1',
          purchase_order_id: 'po-1',
          brand: 'Apple',
          model: 'iPhone 15',
          quantity: 5,
          unit_cost: 800,
          created_at: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'po-2',
      po_number: 'PO-0002',
      supplier_id: 'supplier-2',
      order_date: '2024-01-10',
      total_amount: 3000,
      status: 'received',
      notes: 'Test notes',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-12T00:00:00Z',
      suppliers: { id: 'supplier-2', name: 'Mobile Parts Ltd' },
      purchase_order_items: [
        {
          id: 'item-2',
          purchase_order_id: 'po-2',
          brand: 'Samsung',
          model: 'Galaxy S24',
          quantity: 3,
          unit_cost: 1000,
          created_at: '2024-01-10T00:00:00Z'
        }
      ]
    },
    {
      id: 'po-3',
      po_number: 'PO-0003',
      supplier_id: 'supplier-1',
      order_date: '2024-01-05',
      total_amount: 2000,
      status: 'cancelled',
      notes: null,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-06T00:00:00Z',
      suppliers: { id: 'supplier-1', name: 'Tech Supplies Inc' },
      purchase_order_items: []
    }
  ];

  const mockSummaryData = [
    { status: 'pending', total_amount: 5000 },
    { status: 'received', total_amount: 3000 },
    { status: 'cancelled', total_amount: 2000 }
  ];

  beforeEach(() => {
    mockFrom = jasmine.createSpy('from');

    mockSupabaseService = {
      from: mockFrom
    };

    TestBed.configureTestingModule({
      providers: [
        PurchaseOrderService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(PurchaseOrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPurchaseOrders', () => {
    it('should return all purchase orders ordered by date descending', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData, error: null, count: 3 })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ order: orderSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getPurchaseOrders();

      expect(mockFrom).toHaveBeenCalledWith('purchase_orders');
      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.data[0].poNumber).toBe('PO-0001');
      expect(result.data[0].supplierName).toBe('Tech Supplies Inc');
    });

    it('should filter by status when provided', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: [mockPurchaseOrdersData[0]], error: null, count: 1 })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ order: orderSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getPurchaseOrders({ status: PurchaseOrderStatus.PENDING });

      expect(eqSpy).toHaveBeenCalledWith('status', PurchaseOrderStatus.PENDING);
      expect(result.data.length).toBe(1);
      expect(result.data[0].status).toBe(PurchaseOrderStatus.PENDING);
    });

    it('should filter by supplier when provided', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({
          data: mockPurchaseOrdersData.filter(po => po.supplier_id === 'supplier-1'),
          error: null,
          count: 2
        })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ order: orderSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getPurchaseOrders({ supplierId: 'supplier-1' });

      expect(eqSpy).toHaveBeenCalledWith('supplier_id', 'supplier-1');
      expect(result.data.length).toBe(2);
    });

    it('should filter by date range when provided', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData, error: null, count: 3 })
      );
      const lteSpy = jasmine.createSpy('lte').and.returnValue({ order: orderSpy });
      const gteSpy = jasmine.createSpy('gte').and.returnValue({ lte: lteSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ gte: gteSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await service.getPurchaseOrders({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(gteSpy).toHaveBeenCalledWith('order_date', '2024-01-01');
      expect(lteSpy).toHaveBeenCalledWith('order_date', '2024-01-31');
    });

    it('should throw error when fetch fails', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Database error' } })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ order: orderSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getPurchaseOrders()).toBeRejectedWithError('Database error');
    });

    it('should return empty array when no purchase orders exist', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: [], error: null, count: 0 })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ order: orderSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getPurchaseOrders();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getPurchaseOrderById', () => {
    it('should return purchase order by id', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[0], error: null })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const po = await service.getPurchaseOrderById('po-1');

      expect(eqSpy).toHaveBeenCalledWith('id', 'po-1');
      expect(po?.poNumber).toBe('PO-0001');
      expect(po?.supplierName).toBe('Tech Supplies Inc');
      expect(po?.items.length).toBe(1);
    });

    it('should return null when purchase order not found', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const po = await service.getPurchaseOrderById('non-existent');

      expect(po).toBeNull();
    });

    it('should throw error for non-PGRST116 errors', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { code: 'OTHER', message: 'Some error' } })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getPurchaseOrderById('po-1')).toBeRejectedWithError('Some error');
    });
  });

  describe('getSummary', () => {
    it('should return correct summary statistics', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue(
        Promise.resolve({ data: mockSummaryData, error: null })
      );
      mockFrom.and.returnValue({ select: selectSpy });

      const summary = await service.getSummary();

      expect(summary.totalOrders).toBe(3);
      expect(summary.pendingOrders).toBe(1);
      expect(summary.receivedOrders).toBe(1);
      expect(summary.cancelledOrders).toBe(1);
      expect(summary.totalAmount).toBe(10000);
      expect(summary.pendingAmount).toBe(5000);
    });

    it('should return zero counts when no orders exist', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue(
        Promise.resolve({ data: [], error: null })
      );
      mockFrom.and.returnValue({ select: selectSpy });

      const summary = await service.getSummary();

      expect(summary.totalOrders).toBe(0);
      expect(summary.pendingOrders).toBe(0);
      expect(summary.receivedOrders).toBe(0);
      expect(summary.cancelledOrders).toBe(0);
      expect(summary.totalAmount).toBe(0);
      expect(summary.pendingAmount).toBe(0);
    });

    it('should throw error when fetch fails', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Summary fetch failed' } })
      );
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getSummary()).toBeRejectedWithError('Summary fetch failed');
    });
  });

  describe('createPurchaseOrder', () => {
    const createRequest: CreatePurchaseOrderRequest = {
      supplierId: 'supplier-1',
      orderDate: '2024-01-20',
      notes: 'Test PO',
      items: [
        { brand: 'Apple', model: 'iPhone 15', quantity: 2, unitCost: 800 }
      ]
    };

    it('should create a new purchase order with items', async () => {
      const mockCreatedPo = {
        id: 'po-new',
        po_number: 'PO-0004',
        supplier_id: 'supplier-1',
        order_date: '2024-01-20',
        total_amount: 1600,
        status: 'pending',
        notes: 'Test PO',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: null
      };

      // Mock getNextPoNumber
      const poNumberOrderSpy = jasmine.createSpy('order').and.returnValue({
        limit: jasmine.createSpy('limit').and.returnValue(
          Promise.resolve({ data: [{ po_number: 'PO-0003' }], error: null })
        )
      });
      const poNumberSelectSpy = jasmine.createSpy('select').and.returnValue({
        order: poNumberOrderSpy
      });

      // Mock insert
      const poInsertSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockCreatedPo, error: null })
      );
      const poInsertSelectSpy = jasmine.createSpy('select').and.returnValue({
        single: poInsertSingleSpy
      });
      const poInsertSpy = jasmine.createSpy('insert').and.returnValue({
        select: poInsertSelectSpy
      });

      // Mock items insert
      const itemsInsertSpy = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: null })
      );

      // Mock getPurchaseOrderById for final fetch
      const finalSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({
          data: {
            ...mockCreatedPo,
            suppliers: { id: 'supplier-1', name: 'Tech Supplies Inc' },
            purchase_order_items: [
              {
                id: 'item-new',
                purchase_order_id: 'po-new',
                brand: 'Apple',
                model: 'iPhone 15',
                quantity: 2,
                unit_cost: 800,
                created_at: '2024-01-20T00:00:00Z'
              }
            ]
          },
          error: null
        })
      );
      const finalEqSpy = jasmine.createSpy('eq').and.returnValue({ single: finalSingleSpy });
      const finalSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: finalEqSpy });

      let callCount = 0;
      mockFrom.and.callFake((table: string) => {
        if (table === 'purchase_orders') {
          callCount++;
          if (callCount === 1) {
            return { select: poNumberSelectSpy };
          } else if (callCount === 2) {
            return { insert: poInsertSpy };
          } else {
            return { select: finalSelectSpy };
          }
        } else if (table === 'purchase_order_items') {
          return { insert: itemsInsertSpy };
        }
        return {};
      });

      const result = await service.createPurchaseOrder(createRequest);

      expect(result.poNumber).toBe('PO-0004');
      expect(result.status).toBe(PurchaseOrderStatus.PENDING);
      expect(result.items.length).toBe(1);
    });

    it('should generate correct PO number when no previous orders exist', async () => {
      const poNumberOrderSpy = jasmine.createSpy('order').and.returnValue({
        limit: jasmine.createSpy('limit').and.returnValue(
          Promise.resolve({ data: [], error: null })
        )
      });
      const poNumberSelectSpy = jasmine.createSpy('select').and.returnValue({
        order: poNumberOrderSpy
      });

      const mockCreatedPo = {
        id: 'po-new',
        po_number: 'PO-0001',
        supplier_id: 'supplier-1',
        order_date: '2024-01-20',
        total_amount: 1600,
        status: 'pending',
        notes: 'Test PO',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: null
      };

      const poInsertSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockCreatedPo, error: null })
      );
      const poInsertSelectSpy = jasmine.createSpy('select').and.returnValue({
        single: poInsertSingleSpy
      });
      const poInsertSpy = jasmine.createSpy('insert').and.returnValue({
        select: poInsertSelectSpy
      });

      const itemsInsertSpy = jasmine.createSpy('insert').and.returnValue(
        Promise.resolve({ error: null })
      );

      const finalSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({
          data: {
            ...mockCreatedPo,
            suppliers: { id: 'supplier-1', name: 'Tech Supplies Inc' },
            purchase_order_items: []
          },
          error: null
        })
      );
      const finalEqSpy = jasmine.createSpy('eq').and.returnValue({ single: finalSingleSpy });
      const finalSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: finalEqSpy });

      let callCount = 0;
      mockFrom.and.callFake((table: string) => {
        if (table === 'purchase_orders') {
          callCount++;
          if (callCount === 1) {
            return { select: poNumberSelectSpy };
          } else if (callCount === 2) {
            return { insert: poInsertSpy };
          } else {
            return { select: finalSelectSpy };
          }
        } else if (table === 'purchase_order_items') {
          return { insert: itemsInsertSpy };
        }
        return {};
      });

      const result = await service.createPurchaseOrder(createRequest);

      expect(result.poNumber).toBe('PO-0001');
    });

    it('should throw error on PO creation failure', async () => {
      const poNumberOrderSpy = jasmine.createSpy('order').and.returnValue({
        limit: jasmine.createSpy('limit').and.returnValue(
          Promise.resolve({ data: [], error: null })
        )
      });
      const poNumberSelectSpy = jasmine.createSpy('select').and.returnValue({
        order: poNumberOrderSpy
      });

      const poInsertSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Insert failed' } })
      );
      const poInsertSelectSpy = jasmine.createSpy('select').and.returnValue({
        single: poInsertSingleSpy
      });
      const poInsertSpy = jasmine.createSpy('insert').and.returnValue({
        select: poInsertSelectSpy
      });

      let callCount = 0;
      mockFrom.and.callFake((table: string) => {
        if (table === 'purchase_orders') {
          callCount++;
          if (callCount === 1) {
            return { select: poNumberSelectSpy };
          } else {
            return { insert: poInsertSpy };
          }
        }
        return {};
      });

      await expectAsync(service.createPurchaseOrder(createRequest)).toBeRejectedWithError('Insert failed');
    });
  });

  describe('cancelPurchaseOrder', () => {
    it('should cancel a pending purchase order', async () => {
      // Mock getPurchaseOrderById to return pending PO
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[0], error: null })
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      // Mock update
      const updateEqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: null })
      );
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: updateEqSpy });

      // Mock final fetch
      const finalSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({
          data: { ...mockPurchaseOrdersData[0], status: 'cancelled' },
          error: null
        })
      );
      const finalEqSpy = jasmine.createSpy('eq').and.returnValue({ single: finalSingleSpy });
      const finalSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: finalEqSpy });

      let callCount = 0;
      mockFrom.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: getByIdSelectSpy };
        } else if (callCount === 2) {
          return { update: updateSpy };
        } else {
          return { select: finalSelectSpy };
        }
      });

      const result = await service.cancelPurchaseOrder('po-1');

      expect(updateSpy).toHaveBeenCalledWith({ status: PurchaseOrderStatus.CANCELLED });
      expect(result.status).toBe(PurchaseOrderStatus.CANCELLED);
    });

    it('should throw error when cancelling non-pending purchase order', async () => {
      // Mock getPurchaseOrderById to return received PO
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[1], error: null }) // received PO
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      mockFrom.and.returnValue({ select: getByIdSelectSpy });

      await expectAsync(service.cancelPurchaseOrder('po-2'))
        .toBeRejectedWithError('Only pending purchase orders can be cancelled');
    });

    it('should throw error when purchase order not found', async () => {
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      mockFrom.and.returnValue({ select: getByIdSelectSpy });

      await expectAsync(service.cancelPurchaseOrder('non-existent'))
        .toBeRejectedWithError('Purchase order with id "non-existent" not found');
    });
  });

  describe('deletePurchaseOrder', () => {
    it('should delete a pending purchase order', async () => {
      // Mock getPurchaseOrderById
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[0], error: null })
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      // Mock delete
      const deleteEqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: null })
      );
      const deleteSpy = jasmine.createSpy('delete').and.returnValue({ eq: deleteEqSpy });

      let callCount = 0;
      mockFrom.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: getByIdSelectSpy };
        } else {
          return { delete: deleteSpy };
        }
      });

      await service.deletePurchaseOrder('po-1');

      expect(deleteEqSpy).toHaveBeenCalledWith('id', 'po-1');
    });

    it('should throw error when deleting received purchase order', async () => {
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[1], error: null }) // received PO
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      mockFrom.and.returnValue({ select: getByIdSelectSpy });

      await expectAsync(service.deletePurchaseOrder('po-2'))
        .toBeRejectedWithError('Cannot delete a received purchase order');
    });
  });

  describe('mapToPurchaseOrder', () => {
    it('should correctly map database fields to PurchaseOrder model', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: [mockPurchaseOrdersData[0]], error: null, count: 1 })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ order: orderSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getPurchaseOrders();

      expect(result.data[0]).toEqual(jasmine.objectContaining({
        id: 'po-1',
        poNumber: 'PO-0001',
        supplierId: 'supplier-1',
        supplierName: 'Tech Supplies Inc',
        orderDate: '2024-01-15',
        totalAmount: 5000,
        status: PurchaseOrderStatus.PENDING,
        notes: null
      }));
      expect(result.data[0].items[0]).toEqual(jasmine.objectContaining({
        id: 'item-1',
        purchaseOrderId: 'po-1',
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 5,
        unitCost: 800,
        lineTotal: 4000
      }));
    });

    it('should handle purchase order with no items', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: [mockPurchaseOrdersData[2]], error: null, count: 1 })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ order: orderSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getPurchaseOrders();

      expect(result.data[0].items).toEqual([]);
    });

    it('should handle null supplier', async () => {
      const poWithNoSupplier = {
        ...mockPurchaseOrdersData[0],
        suppliers: null
      };
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: [poWithNoSupplier], error: null, count: 1 })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ order: orderSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getPurchaseOrders();

      expect(result.data[0].supplierName).toBe('');
    });
  });

  describe('receiveWithInventory', () => {
    const mockReceiveRequest: ReceivePurchaseOrderRequest = {
      phones: [
        {
          lineItemIndex: 0,
          brand: 'Apple',
          model: 'iPhone 15',
          color: 'Black',
          imei: '123456789012345',
          condition: PhoneCondition.NEW,
          batteryHealth: null,
          storageGb: 128,
          ramGb: 6,
          sellingPrice: 1000,
          notes: null
        }
      ]
    };

    it('should throw error when purchase order not found', async () => {
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      mockFrom.and.returnValue({ select: getByIdSelectSpy });

      await expectAsync(service.receiveWithInventory('non-existent', mockReceiveRequest))
        .toBeRejectedWithError('Purchase order with id "non-existent" not found');
    });

    it('should throw error when receiving non-pending purchase order', async () => {
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[1], error: null }) // received PO
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      mockFrom.and.returnValue({ select: getByIdSelectSpy });

      await expectAsync(service.receiveWithInventory('po-2', mockReceiveRequest))
        .toBeRejectedWithError('Only pending purchase orders can be marked as received');
    });

    it('should throw error when phone count does not match PO item quantities', async () => {
      // PO has 5 items (quantity=5), but we're only providing 1 phone
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[0], error: null })
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      mockFrom.and.returnValue({ select: getByIdSelectSpy });

      await expectAsync(service.receiveWithInventory('po-1', mockReceiveRequest))
        .toBeRejectedWithError('Expected 5 phone records but received 1. All items must be received at once.');
    });
  });

  describe('updatePurchaseOrder', () => {
    it('should update a pending purchase order', async () => {
      // Mock getPurchaseOrderById
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[0], error: null })
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      // Mock update
      const updateEqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: null })
      );
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: updateEqSpy });

      // Mock final fetch
      const finalSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({
          data: { ...mockPurchaseOrdersData[0], notes: 'Updated notes' },
          error: null
        })
      );
      const finalEqSpy = jasmine.createSpy('eq').and.returnValue({ single: finalSingleSpy });
      const finalSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: finalEqSpy });

      let callCount = 0;
      mockFrom.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return { select: getByIdSelectSpy };
        } else if (callCount === 2) {
          return { update: updateSpy };
        } else {
          return { select: finalSelectSpy };
        }
      });

      const result = await service.updatePurchaseOrder('po-1', { notes: 'Updated notes' });

      expect(updateSpy).toHaveBeenCalledWith({ notes: 'Updated notes' });
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw error when updating non-pending purchase order', async () => {
      const getByIdSingleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData[1], error: null }) // received PO
      );
      const getByIdEqSpy = jasmine.createSpy('eq').and.returnValue({ single: getByIdSingleSpy });
      const getByIdSelectSpy = jasmine.createSpy('select').and.returnValue({ eq: getByIdEqSpy });

      mockFrom.and.returnValue({ select: getByIdSelectSpy });

      await expectAsync(service.updatePurchaseOrder('po-2', { notes: 'Test' }))
        .toBeRejectedWithError('Cannot modify a purchase order that is not pending');
    });
  });
});
