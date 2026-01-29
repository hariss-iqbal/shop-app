import { TestBed } from '@angular/core/testing';
import { SupplierService } from './supplier.service';
import { SupabaseService } from './supabase.service';
import { CreateSupplierRequest, UpdateSupplierRequest } from '../../models/supplier.model';

describe('SupplierService', () => {
  let service: SupplierService;
  let mockSupabaseService: any;
  let mockFrom: jasmine.Spy;

  const mockSuppliersData = [
    {
      id: 'supplier-1',
      name: 'Tech Supplies Inc',
      contact_person: 'John Doe',
      contact_email: 'john@techsupplies.com',
      contact_phone: '+1-555-0100',
      address: '123 Tech Street',
      notes: 'Reliable supplier',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: null
    },
    {
      id: 'supplier-2',
      name: 'Mobile Parts Ltd',
      contact_person: null,
      contact_email: 'info@mobileparts.com',
      contact_phone: null,
      address: null,
      notes: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: null
    }
  ];

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
    }
  ];

  beforeEach(() => {
    mockFrom = jasmine.createSpy('from').and.callFake((_table: string) => ({
      select: jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: mockSuppliersData, error: null, count: mockSuppliersData.length })
        ),
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockSuppliersData[0], error: null })
          ),
          order: jasmine.createSpy('order').and.returnValue(
            Promise.resolve({ data: mockPurchaseOrdersData, error: null })
          )
        })
      }),
      insert: jasmine.createSpy('insert').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({
              data: {
                id: 'supplier-new',
                name: 'New Supplier',
                contact_person: null,
                contact_email: null,
                contact_phone: null,
                address: null,
                notes: null,
                created_at: '2024-01-04T00:00:00Z',
                updated_at: null
              },
              error: null
            })
          )
        })
      }),
      update: jasmine.createSpy('update').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({
                data: {
                  id: 'supplier-1',
                  name: 'Updated Supplier',
                  contact_person: 'Jane Doe',
                  contact_email: 'jane@updated.com',
                  contact_phone: '+1-555-0200',
                  address: '456 New Street',
                  notes: 'Updated notes',
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-05T00:00:00Z'
                },
                error: null
              })
            )
          })
        })
      }),
      delete: jasmine.createSpy('delete').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
      })
    }));

    mockSupabaseService = {
      from: mockFrom
    };

    TestBed.configureTestingModule({
      providers: [
        SupplierService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(SupplierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSuppliers', () => {
    it('should return all suppliers ordered by name', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: mockSuppliersData, error: null, count: mockSuppliersData.length })
        )
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getSuppliers();

      expect(mockFrom).toHaveBeenCalledWith('suppliers');
      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.data[0].name).toBe('Tech Supplies Inc');
      expect(result.data[0].contactPerson).toBe('John Doe');
    });

    it('should throw error when fetch fails', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: null, error: { message: 'Database error' } })
        )
      });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getSuppliers()).toBeRejectedWithError('Database error');
    });

    it('should return empty array when no suppliers exist', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: [], error: null, count: 0 })
        )
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getSuppliers();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getSupplierById', () => {
    it('should return supplier by id', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: mockSuppliersData[0], error: null })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const supplier = await service.getSupplierById('supplier-1');

      expect(eqSpy).toHaveBeenCalledWith('id', 'supplier-1');
      expect(supplier?.name).toBe('Tech Supplies Inc');
      expect(supplier?.contactEmail).toBe('john@techsupplies.com');
    });

    it('should return null when supplier not found', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const supplier = await service.getSupplierById('non-existent');

      expect(supplier).toBeNull();
    });

    it('should throw error for non-PGRST116 errors', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { code: 'OTHER', message: 'Some error' } })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getSupplierById('supplier-1')).toBeRejectedWithError('Some error');
    });
  });

  describe('createSupplier', () => {
    it('should create a new supplier with all fields', async () => {
      const newSupplierData = {
        id: 'supplier-new',
        name: 'New Supplier',
        contact_person: 'Jane Smith',
        contact_email: 'jane@newsupplier.com',
        contact_phone: '+1-555-0300',
        address: '789 Business Ave',
        notes: 'New supplier notes',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: null
      };
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: newSupplierData, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const insertSpy = jasmine.createSpy('insert').and.returnValue({ select: selectSpy });
      mockFrom.and.returnValue({ insert: insertSpy });

      const request: CreateSupplierRequest = {
        name: 'New Supplier',
        contactPerson: 'Jane Smith',
        contactEmail: 'jane@newsupplier.com',
        contactPhone: '+1-555-0300',
        address: '789 Business Ave',
        notes: 'New supplier notes'
      };
      const supplier = await service.createSupplier(request);

      expect(insertSpy).toHaveBeenCalledWith({
        name: 'New Supplier',
        contact_person: 'Jane Smith',
        contact_email: 'jane@newsupplier.com',
        contact_phone: '+1-555-0300',
        address: '789 Business Ave',
        notes: 'New supplier notes'
      });
      expect(supplier.name).toBe('New Supplier');
    });

    it('should create supplier with only required fields', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({
          data: {
            id: 'supplier-new',
            name: 'Minimal Supplier',
            contact_person: null,
            contact_email: null,
            contact_phone: null,
            address: null,
            notes: null,
            created_at: '2024-01-04T00:00:00Z',
            updated_at: null
          },
          error: null
        })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const insertSpy = jasmine.createSpy('insert').and.returnValue({ select: selectSpy });
      mockFrom.and.returnValue({ insert: insertSpy });

      const request: CreateSupplierRequest = { name: 'Minimal Supplier' };
      await service.createSupplier(request);

      expect(insertSpy).toHaveBeenCalledWith({
        name: 'Minimal Supplier',
        contact_person: null,
        contact_email: null,
        contact_phone: null,
        address: null,
        notes: null
      });
    });

    it('should trim whitespace from fields', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({
          data: {
            id: 'supplier-new',
            name: 'Trimmed Name',
            contact_person: 'Trimmed Person',
            contact_email: null,
            contact_phone: null,
            address: null,
            notes: null,
            created_at: '2024-01-04T00:00:00Z',
            updated_at: null
          },
          error: null
        })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const insertSpy = jasmine.createSpy('insert').and.returnValue({ select: selectSpy });
      mockFrom.and.returnValue({ insert: insertSpy });

      const request: CreateSupplierRequest = {
        name: '  Trimmed Name  ',
        contactPerson: '  Trimmed Person  '
      };
      await service.createSupplier(request);

      expect(insertSpy).toHaveBeenCalledWith({
        name: 'Trimmed Name',
        contact_person: 'Trimmed Person',
        contact_email: null,
        contact_phone: null,
        address: null,
        notes: null
      });
    });

    it('should throw error on create failure', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Insert failed' } })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const insertSpy = jasmine.createSpy('insert').and.returnValue({ select: selectSpy });
      mockFrom.and.returnValue({ insert: insertSpy });

      await expectAsync(service.createSupplier({ name: 'Test' })).toBeRejectedWithError('Insert failed');
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier fields', async () => {
      const updatedData = {
        id: 'supplier-1',
        name: 'Updated Name',
        contact_person: 'Updated Person',
        contact_email: 'updated@email.com',
        contact_phone: '+1-555-9999',
        address: 'Updated Address',
        notes: 'Updated Notes',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      };
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: updatedData, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ select: selectSpy });
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ update: updateSpy });

      const request: UpdateSupplierRequest = {
        name: 'Updated Name',
        contactPerson: 'Updated Person',
        contactEmail: 'updated@email.com',
        contactPhone: '+1-555-9999',
        address: 'Updated Address',
        notes: 'Updated Notes'
      };
      const supplier = await service.updateSupplier('supplier-1', request);

      expect(eqSpy).toHaveBeenCalledWith('id', 'supplier-1');
      expect(supplier.name).toBe('Updated Name');
      expect(supplier.updatedAt).toBe('2024-01-05T00:00:00Z');
    });

    it('should update only specified fields', async () => {
      const updatedData = {
        id: 'supplier-1',
        name: 'Only Name Updated',
        contact_person: 'John Doe',
        contact_email: 'john@techsupplies.com',
        contact_phone: '+1-555-0100',
        address: '123 Tech Street',
        notes: 'Reliable supplier',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      };
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: updatedData, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ select: selectSpy });
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ update: updateSpy });

      const request: UpdateSupplierRequest = { name: 'Only Name Updated' };
      await service.updateSupplier('supplier-1', request);

      expect(updateSpy).toHaveBeenCalledWith({ name: 'Only Name Updated' });
    });

    it('should clear optional fields when set to null', async () => {
      const updatedData = {
        id: 'supplier-1',
        name: 'Tech Supplies Inc',
        contact_person: null,
        contact_email: null,
        contact_phone: null,
        address: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      };
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: updatedData, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ select: selectSpy });
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ update: updateSpy });

      const request: UpdateSupplierRequest = { contactPerson: null, contactEmail: null };
      await service.updateSupplier('supplier-1', request);

      expect(updateSpy).toHaveBeenCalledWith({
        contact_person: null,
        contact_email: null
      });
    });

    it('should throw error on update failure', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Update failed' } })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ select: selectSpy });
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ update: updateSpy });

      await expectAsync(service.updateSupplier('supplier-1', { name: 'Test' }))
        .toBeRejectedWithError('Update failed');
    });
  });

  describe('deleteSupplier', () => {
    it('should delete supplier when no purchase orders exist', async () => {
      // Mock hasPurchaseOrders to return false
      spyOn(service, 'hasPurchaseOrders').and.returnValue(Promise.resolve(false));

      const deleteEqSpy = jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }));
      const deleteSpy = jasmine.createSpy('delete').and.returnValue({ eq: deleteEqSpy });
      mockFrom.and.returnValue({ delete: deleteSpy });

      await service.deleteSupplier('supplier-1');

      expect(service.hasPurchaseOrders).toHaveBeenCalledWith('supplier-1');
      expect(deleteEqSpy).toHaveBeenCalledWith('id', 'supplier-1');
    });

    it('should throw error when supplier has purchase orders', async () => {
      spyOn(service, 'hasPurchaseOrders').and.returnValue(Promise.resolve(true));

      await expectAsync(service.deleteSupplier('supplier-1'))
        .toBeRejectedWithError('Cannot delete supplier with existing purchase orders. Please delete or reassign the purchase orders first.');
    });

    it('should throw error on delete failure with FK constraint', async () => {
      spyOn(service, 'hasPurchaseOrders').and.returnValue(Promise.resolve(false));

      const deleteEqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: { code: '23503', message: 'FK violation' } })
      );
      const deleteSpy = jasmine.createSpy('delete').and.returnValue({ eq: deleteEqSpy });
      mockFrom.and.returnValue({ delete: deleteSpy });

      await expectAsync(service.deleteSupplier('supplier-1'))
        .toBeRejectedWithError('Cannot delete supplier with existing purchase orders.');
    });

    it('should throw generic error on other delete failures', async () => {
      spyOn(service, 'hasPurchaseOrders').and.returnValue(Promise.resolve(false));

      const deleteEqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ error: { code: 'OTHER', message: 'Delete failed' } })
      );
      const deleteSpy = jasmine.createSpy('delete').and.returnValue({ eq: deleteEqSpy });
      mockFrom.and.returnValue({ delete: deleteSpy });

      await expectAsync(service.deleteSupplier('supplier-1'))
        .toBeRejectedWithError('Delete failed');
    });
  });

  describe('hasPurchaseOrders', () => {
    it('should return true when supplier has purchase orders', async () => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ count: 3, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.hasPurchaseOrders('supplier-1');

      expect(mockFrom).toHaveBeenCalledWith('purchase_orders');
      expect(eqSpy).toHaveBeenCalledWith('supplier_id', 'supplier-1');
      expect(result).toBe(true);
    });

    it('should return false when supplier has no purchase orders', async () => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ count: 0, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.hasPurchaseOrders('supplier-1');

      expect(result).toBe(false);
    });

    it('should throw error on query failure', async () => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ count: null, error: { message: 'Query failed' } })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.hasPurchaseOrders('supplier-1'))
        .toBeRejectedWithError('Query failed');
    });
  });

  describe('getPurchaseOrdersForSupplier', () => {
    it('should return purchase orders for supplier', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: mockPurchaseOrdersData, error: null })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ order: orderSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const orders = await service.getPurchaseOrdersForSupplier('supplier-1');

      expect(mockFrom).toHaveBeenCalledWith('purchase_orders');
      expect(eqSpy).toHaveBeenCalledWith('supplier_id', 'supplier-1');
      expect(orders.length).toBe(1);
      expect(orders[0].poNumber).toBe('PO-0001');
      expect(orders[0].items.length).toBe(1);
      expect(orders[0].items[0].brand).toBe('Apple');
    });

    it('should return empty array when no purchase orders exist', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: [], error: null })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ order: orderSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const orders = await service.getPurchaseOrdersForSupplier('supplier-1');

      expect(orders).toEqual([]);
    });

    it('should throw error on query failure', async () => {
      const orderSpy = jasmine.createSpy('order').and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Query failed' } })
      );
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ order: orderSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getPurchaseOrdersForSupplier('supplier-1'))
        .toBeRejectedWithError('Query failed');
    });
  });

  describe('getPurchaseOrderCountForSupplier', () => {
    it('should return count of purchase orders', async () => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ count: 5, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const count = await service.getPurchaseOrderCountForSupplier('supplier-1');

      expect(count).toBe(5);
    });

    it('should return 0 when no purchase orders exist', async () => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ count: 0, error: null })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const count = await service.getPurchaseOrderCountForSupplier('supplier-1');

      expect(count).toBe(0);
    });

    it('should throw error on query failure', async () => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue(
        Promise.resolve({ count: null, error: { message: 'Count failed' } })
      );
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getPurchaseOrderCountForSupplier('supplier-1'))
        .toBeRejectedWithError('Count failed');
    });
  });

  describe('mapToSupplier', () => {
    it('should correctly map database fields to Supplier model', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({
            data: [{
              id: 'supplier-1',
              name: 'Test Supplier',
              contact_person: 'Contact Name',
              contact_email: 'email@test.com',
              contact_phone: '+1-555-0000',
              address: '123 Address St',
              notes: 'Some notes',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z'
            }],
            error: null,
            count: 1
          })
        )
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getSuppliers();

      expect(result.data[0]).toEqual({
        id: 'supplier-1',
        name: 'Test Supplier',
        contactPerson: 'Contact Name',
        contactEmail: 'email@test.com',
        contactPhone: '+1-555-0000',
        address: '123 Address St',
        notes: 'Some notes',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      });
    });

    it('should handle null optional fields', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({
            data: [{
              id: 'supplier-1',
              name: 'Test Supplier',
              contact_person: null,
              contact_email: null,
              contact_phone: null,
              address: null,
              notes: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: null
            }],
            error: null,
            count: 1
          })
        )
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const result = await service.getSuppliers();

      expect(result.data[0].contactPerson).toBeNull();
      expect(result.data[0].contactEmail).toBeNull();
      expect(result.data[0].contactPhone).toBeNull();
      expect(result.data[0].address).toBeNull();
      expect(result.data[0].notes).toBeNull();
      expect(result.data[0].updatedAt).toBeNull();
    });
  });
});
