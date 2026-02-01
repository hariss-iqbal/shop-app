import { TestBed } from '@angular/core/testing';
import { SaleService } from './sale.service';
import { SupabaseService } from './supabase.service';
import { SaleFilter, MarkAsSoldRequest } from '../../models/sale.model';

describe('SaleService', () => {
  let service: SaleService;
  let mockSupabaseService: any;
  let mockQuery: any;

  const mockSaleDbRecord = {
    id: 'sale-1',
    phone_id: 'phone-1',
    sale_date: '2024-01-15',
    sale_price: 1200,
    cost_price: 900,
    buyer_name: 'John Doe',
    buyer_phone: '+1234567890',
    buyer_email: 'john@example.com',
    notes: 'Test sale',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: null,
    phone: {
      id: 'phone-1',
      model: 'iPhone 15 Pro',
      brand: {
        id: 'brand-1',
        name: 'Apple'
      }
    }
  };

  const mockSalesDbRecords = [
    mockSaleDbRecord,
    {
      ...mockSaleDbRecord,
      id: 'sale-2',
      phone_id: 'phone-2',
      sale_date: '2024-01-14',
      sale_price: 1000,
      cost_price: 750,
      buyer_name: 'Jane Smith',
      phone: {
        id: 'phone-2',
        model: 'Galaxy S24',
        brand: { id: 'brand-2', name: 'Samsung' }
      }
    },
    {
      ...mockSaleDbRecord,
      id: 'sale-3',
      phone_id: 'phone-3',
      sale_date: '2024-01-13',
      sale_price: 800,
      cost_price: 850,
      buyer_name: null,
      phone: {
        id: 'phone-3',
        model: 'Pixel 8',
        brand: { id: 'brand-3', name: 'Google' }
      }
    }
  ];

  beforeEach(() => {
    mockQuery = {
      select: jasmine.createSpy('select').and.callFake(() => mockQuery),
      gte: jasmine.createSpy('gte').and.callFake(() => mockQuery),
      lte: jasmine.createSpy('lte').and.callFake(() => mockQuery),
      eq: jasmine.createSpy('eq').and.callFake(() => mockQuery),
      order: jasmine.createSpy('order').and.callFake(() => mockQuery),
      insert: jasmine.createSpy('insert').and.callFake(() => mockQuery),
      update: jasmine.createSpy('update').and.callFake(() => mockQuery),
      single: jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: mockSaleDbRecord,
        error: null
      }))
    };

    mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue(mockQuery)
    };

    TestBed.configureTestingModule({
      providers: [
        SaleService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(SaleService);
  });

  describe('getSales', () => {
    beforeEach(() => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: mockSalesDbRecords,
        error: null,
        count: 3
      }));
    });

    it('should fetch sales successfully', async () => {
      const result = await service.getSales();

      expect(mockSupabaseService.from).toHaveBeenCalledWith('sales');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.order).toHaveBeenCalledWith('sale_date', { ascending: false });
      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should map database records to Sale model correctly', async () => {
      const result = await service.getSales();
      const firstSale = result.data[0];

      expect(firstSale.id).toBe('sale-1');
      expect(firstSale.phoneId).toBe('phone-1');
      expect(firstSale.brandName).toBe('Apple');
      expect(firstSale.phoneName).toBe('iPhone 15 Pro');
      expect(firstSale.saleDate).toBe('2024-01-15');
      expect(firstSale.salePrice).toBe(1200);
      expect(firstSale.costPrice).toBe(900);
      expect(firstSale.profit).toBe(300);
      expect(firstSale.buyerName).toBe('John Doe');
      expect(firstSale.buyerPhone).toBe('+1234567890');
      expect(firstSale.buyerEmail).toBe('john@example.com');
      expect(firstSale.notes).toBe('Test sale');
    });

    it('should calculate profit correctly', async () => {
      const result = await service.getSales();

      expect(result.data[0].profit).toBe(300);
      expect(result.data[1].profit).toBe(250);
      expect(result.data[2].profit).toBe(-50);
    });

    it('should apply start date filter', async () => {
      const filter: SaleFilter = { startDate: '2024-01-14' };

      await service.getSales(filter);

      expect(mockQuery.gte).toHaveBeenCalledWith('sale_date', '2024-01-14');
    });

    it('should apply end date filter', async () => {
      const filter: SaleFilter = { endDate: '2024-01-31' };

      await service.getSales(filter);

      expect(mockQuery.lte).toHaveBeenCalledWith('sale_date', '2024-01-31');
    });

    it('should apply both date filters', async () => {
      const filter: SaleFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await service.getSales(filter);

      expect(mockQuery.gte).toHaveBeenCalledWith('sale_date', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('sale_date', '2024-01-31');
    });

    it('should not apply date filters when not provided', async () => {
      await service.getSales({});

      expect(mockQuery.gte).not.toHaveBeenCalled();
      expect(mockQuery.lte).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'Database error' },
        count: null
      }));

      await expectAsync(service.getSales()).toBeRejectedWithError('Database error');
    });

    it('should handle empty result set', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: [],
        error: null,
        count: 0
      }));

      const result = await service.getSales();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle null phone data gracefully', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: [{
          ...mockSaleDbRecord,
          phone: null
        }],
        error: null,
        count: 1
      }));

      const result = await service.getSales();

      expect(result.data[0].brandName).toBe('');
      expect(result.data[0].phoneName).toBe('');
    });

    it('should handle null brand data gracefully', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: [{
          ...mockSaleDbRecord,
          phone: {
            id: 'phone-1',
            model: 'Test Phone',
            brand: null
          }
        }],
        error: null,
        count: 1
      }));

      const result = await service.getSales();

      expect(result.data[0].brandName).toBe('');
      expect(result.data[0].phoneName).toBe('Test Phone');
    });
  });

  describe('getSummary', () => {
    const mockSalesForSummary = [
      { sale_price: 1200, cost_price: 900, sale_date: '2024-01-15' },
      { sale_price: 1000, cost_price: 750, sale_date: '2024-01-14' },
      { sale_price: 800, cost_price: 850, sale_date: '2024-01-13' }
    ];

    beforeEach(() => {
      mockQuery.select.and.returnValue(mockQuery);
      mockQuery.gte.and.returnValue(mockQuery);
      mockQuery.lte.and.returnValue(Promise.resolve({
        data: mockSalesForSummary,
        error: null
      }));

      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'sales') {
          return {
            select: jasmine.createSpy('select').and.callFake((cols: string) => {
              if (cols.includes('sale_price')) {
                return {
                  gte: jasmine.createSpy('gte').and.returnValue({
                    lte: jasmine.createSpy('lte').and.returnValue(Promise.resolve({
                      data: mockSalesForSummary,
                      error: null
                    }))
                  })
                };
              }
              return mockQuery;
            })
          };
        }
        return mockQuery;
      });
    });

    it('should calculate summary correctly', async () => {
      mockSupabaseService.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({
          data: mockSalesForSummary,
          error: null
        }))
      });

      const summary = await service.getSummary();

      expect(summary.totalSales).toBe(3);
      expect(summary.totalRevenue).toBe(3000);
      expect(summary.totalCost).toBe(2500);
      expect(summary.totalProfit).toBe(500);
      expect(summary.averageMargin).toBeCloseTo(16.67, 1);
    });

    it('should handle empty sales for summary', async () => {
      mockSupabaseService.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({
          data: [],
          error: null
        }))
      });

      const summary = await service.getSummary();

      expect(summary.totalSales).toBe(0);
      expect(summary.totalRevenue).toBe(0);
      expect(summary.totalCost).toBe(0);
      expect(summary.totalProfit).toBe(0);
      expect(summary.averageMargin).toBe(0);
    });

    it('should apply date filters to summary', async () => {
      const gteSpy = jasmine.createSpy('gte').and.returnValue({
        lte: jasmine.createSpy('lte').and.returnValue(Promise.resolve({
          data: mockSalesForSummary,
          error: null
        }))
      });

      mockSupabaseService.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          gte: gteSpy
        })
      });

      const filter: SaleFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await service.getSummary(filter);

      expect(gteSpy).toHaveBeenCalledWith('sale_date', '2024-01-01');
    });

    it('should throw error on summary calculation failure', async () => {
      mockSupabaseService.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({
          data: null,
          error: { message: 'Summary calculation failed' }
        }))
      });

      await expectAsync(service.getSummary()).toBeRejectedWithError('Summary calculation failed');
    });

    it('should handle null sale_price values', async () => {
      mockSupabaseService.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({
          data: [{ sale_price: null, cost_price: 100 }],
          error: null
        }))
      });

      const summary = await service.getSummary();

      expect(summary.totalRevenue).toBe(0);
    });

    it('should handle null cost_price values', async () => {
      mockSupabaseService.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({
          data: [{ sale_price: 100, cost_price: null }],
          error: null
        }))
      });

      const summary = await service.getSummary();

      expect(summary.totalCost).toBe(0);
    });
  });

  describe('markAsSold', () => {
    const markAsSoldRequest: MarkAsSoldRequest = {
      phoneId: 'phone-1',
      salePrice: 1200,
      saleDate: '2024-01-15',
      buyerName: '  John Doe  ',
      buyerPhone: '  +1234567890  ',
      buyerEmail: '  john@example.com  ',
      notes: '  Test sale  '
    };

    beforeEach(() => {
      const phoneQuery: any = {};
      phoneQuery.select = jasmine.createSpy('select').and.callFake(() => phoneQuery);
      phoneQuery.eq = jasmine.createSpy('eq').and.callFake(() => phoneQuery);
      phoneQuery.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: { cost_price: 900 },
        error: null
      }));

      const insertQuery: any = {};
      insertQuery.insert = jasmine.createSpy('insert').and.callFake(() => insertQuery);
      insertQuery.select = jasmine.createSpy('select').and.callFake(() => insertQuery);
      insertQuery.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: mockSaleDbRecord,
        error: null
      }));

      const updateQuery: any = {};
      updateQuery.update = jasmine.createSpy('update').and.callFake(() => updateQuery);
      updateQuery.eq = jasmine.createSpy('eq').and.returnValue(Promise.resolve({
        error: null
      }));

      let callCount = 0;
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'phones') {
          callCount++;
          if (callCount === 1) {
            return phoneQuery;
          }
          return updateQuery;
        }
        if (table === 'sales') {
          return insertQuery;
        }
        return mockQuery;
      });
    });

    it('should create sale and update phone status', async () => {
      const result = await service.markAsSold(markAsSoldRequest);

      expect(result.success).toBe(true);
      expect(result.sale?.id).toBe('sale-1');
      expect(result.phoneId).toBe('phone-1');
    });

    it('should trim buyer information', async () => {
      let insertedData: any = null;
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'phones') {
          const phoneQ: any = {};
          phoneQ.select = jasmine.createSpy('select').and.callFake(() => phoneQ);
          phoneQ.eq = jasmine.createSpy('eq').and.callFake(() => phoneQ);
          phoneQ.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: { cost_price: 900 },
            error: null
          }));
          phoneQ.update = jasmine.createSpy('update').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
          });
          return phoneQ;
        }
        if (table === 'sales') {
          return {
            insert: jasmine.createSpy('insert').and.callFake((data: any) => {
              insertedData = data;
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(Promise.resolve({
                    data: mockSaleDbRecord,
                    error: null
                  }))
                })
              };
            })
          };
        }
        return mockQuery;
      });

      await service.markAsSold(markAsSoldRequest);

      expect(insertedData.buyer_name).toBe('John Doe');
      expect(insertedData.buyer_phone).toBe('+1234567890');
      expect(insertedData.buyer_email).toBe('john@example.com');
      expect(insertedData.notes).toBe('Test sale');
    });

    it('should handle empty strings as null', async () => {
      let insertedData: any = null;
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'phones') {
          const phoneQ: any = {};
          phoneQ.select = jasmine.createSpy('select').and.callFake(() => phoneQ);
          phoneQ.eq = jasmine.createSpy('eq').and.callFake(() => phoneQ);
          phoneQ.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: { cost_price: 900 },
            error: null
          }));
          phoneQ.update = jasmine.createSpy('update').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
          });
          return phoneQ;
        }
        if (table === 'sales') {
          return {
            insert: jasmine.createSpy('insert').and.callFake((data: any) => {
              insertedData = data;
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(Promise.resolve({
                    data: mockSaleDbRecord,
                    error: null
                  }))
                })
              };
            })
          };
        }
        return mockQuery;
      });

      const requestWithEmptyStrings: MarkAsSoldRequest = {
        phoneId: 'phone-1',
        salePrice: 1200,
        saleDate: '2024-01-15',
        buyerName: '   ',
        buyerPhone: '',
        buyerEmail: null,
        notes: undefined
      };

      await service.markAsSold(requestWithEmptyStrings);

      expect(insertedData.buyer_name).toBeNull();
      expect(insertedData.buyer_phone).toBeNull();
      expect(insertedData.buyer_email).toBeNull();
      expect(insertedData.notes).toBeNull();
    });

    it('should throw error when phone lookup fails', async () => {
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'phones') {
          const phoneQ: any = {};
          phoneQ.select = jasmine.createSpy('select').and.callFake(() => phoneQ);
          phoneQ.eq = jasmine.createSpy('eq').and.callFake(() => phoneQ);
          phoneQ.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: null,
            error: { message: 'Phone not found' }
          }));
          return phoneQ;
        }
        return mockQuery;
      });

      await expectAsync(service.markAsSold(markAsSoldRequest)).toBeRejectedWithError('Phone not found');
    });

    it('should throw error when sale insert fails', async () => {
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'phones') {
          const phoneQ: any = {};
          phoneQ.select = jasmine.createSpy('select').and.callFake(() => phoneQ);
          phoneQ.eq = jasmine.createSpy('eq').and.callFake(() => phoneQ);
          phoneQ.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: { cost_price: 900 },
            error: null
          }));
          return phoneQ;
        }
        if (table === 'sales') {
          return {
            insert: jasmine.createSpy('insert').and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(Promise.resolve({
                  data: null,
                  error: { message: 'Insert failed' }
                }))
              })
            })
          };
        }
        return mockQuery;
      });

      await expectAsync(service.markAsSold(markAsSoldRequest)).toBeRejectedWithError('Insert failed');
    });

    it('should throw error when status update fails', async () => {
      let firstCall = true;
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'phones') {
          if (firstCall) {
            firstCall = false;
            const phoneQ: any = {};
            phoneQ.select = jasmine.createSpy('select').and.callFake(() => phoneQ);
            phoneQ.eq = jasmine.createSpy('eq').and.callFake(() => phoneQ);
            phoneQ.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
              data: { cost_price: 900 },
              error: null
            }));
            return phoneQ;
          }
          return {
            update: jasmine.createSpy('update').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
                error: { message: 'Status update failed' }
              }))
            })
          };
        }
        if (table === 'sales') {
          return {
            insert: jasmine.createSpy('insert').and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(Promise.resolve({
                  data: mockSaleDbRecord,
                  error: null
                }))
              })
            })
          };
        }
        return mockQuery;
      });

      await expectAsync(service.markAsSold(markAsSoldRequest)).toBeRejectedWithError('Status update failed');
    });

    it('should capture cost_price from phone record', async () => {
      let insertedData: any = null;
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'phones') {
          const phoneQ: any = {};
          phoneQ.select = jasmine.createSpy('select').and.callFake(() => phoneQ);
          phoneQ.eq = jasmine.createSpy('eq').and.callFake(() => phoneQ);
          phoneQ.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: { cost_price: 750 },
            error: null
          }));
          phoneQ.update = jasmine.createSpy('update').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
          });
          return phoneQ;
        }
        if (table === 'sales') {
          return {
            insert: jasmine.createSpy('insert').and.callFake((data: any) => {
              insertedData = data;
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(Promise.resolve({
                    data: mockSaleDbRecord,
                    error: null
                  }))
                })
              };
            })
          };
        }
        return mockQuery;
      });

      await service.markAsSold(markAsSoldRequest);

      expect(insertedData.cost_price).toBe(750);
    });
  });

  describe('mapToSale private method', () => {
    it('should handle all nullable fields being null', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: [{
          id: 'sale-1',
          phone_id: 'phone-1',
          sale_date: '2024-01-15',
          sale_price: 1000,
          cost_price: 800,
          buyer_name: null,
          buyer_phone: null,
          buyer_email: null,
          notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: null,
          phone: {
            id: 'phone-1',
            model: 'Test Phone',
            brand: { id: 'brand-1', name: 'Test Brand' }
          }
        }],
        error: null,
        count: 1
      }));

      const result = await service.getSales();
      const sale = result.data[0];

      expect(sale.buyerName).toBeNull();
      expect(sale.buyerPhone).toBeNull();
      expect(sale.buyerEmail).toBeNull();
      expect(sale.notes).toBeNull();
      expect(sale.updatedAt).toBeNull();
    });
  });
});
