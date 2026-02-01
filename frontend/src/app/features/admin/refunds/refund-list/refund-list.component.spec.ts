import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RefundListComponent } from './refund-list.component';
import { RefundService } from '../../../../core/services/refund.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Refund, RefundSummary } from '../../../../models/refund.model';

describe('RefundListComponent', () => {
  let component: RefundListComponent;
  let fixture: ComponentFixture<RefundListComponent>;
  let mockRefundService: jasmine.SpyObj<RefundService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockRefund: Refund = {
    id: 'refund-1',
    refundNumber: 'REF-000001',
    originalReceiptId: 'receipt-1',
    originalReceiptNumber: 'RCP100',
    refundDate: '2026-01-31',
    refundTime: '10:30:00',
    subtotal: 100,
    taxRate: 8.5,
    taxAmount: 8.5,
    refundAmount: 108.5,
    refundReason: 'Customer request',
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    status: 'completed',
    notes: null,
    isPartialRefund: false,
    managerApproved: false,
    managerApprovedAt: null,
    managerApprovalReason: null,
    items: [],
    itemCount: 1,
    inventoryRestoredCount: 1,
    hasCustomPrices: false,
    createdAt: '2026-01-31T10:30:00Z',
    updatedAt: null
  };

  const mockSummary: RefundSummary = {
    totalRefunds: 5,
    totalRefundAmount: 542.5,
    totalItemsRefunded: 7,
    totalInventoryRestored: 5
  };

  beforeEach(async () => {
    mockRefundService = jasmine.createSpyObj('RefundService', ['getRefunds', 'getSummary']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    mockRefundService.getRefunds.and.returnValue(Promise.resolve({
      data: [mockRefund],
      total: 1
    }));
    mockRefundService.getSummary.and.returnValue(Promise.resolve(mockSummary));

    await TestBed.configureTestingModule({
      imports: [RefundListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: RefundService, useValue: mockRefundService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RefundListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load refunds and summary on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(mockRefundService.getRefunds).toHaveBeenCalled();
    expect(mockRefundService.getSummary).toHaveBeenCalled();
    expect(component.refunds()).toEqual([mockRefund]);
    expect(component.summary()).toEqual(mockSummary);
  }));

  it('should display summary statistics', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Total Refunds');
    expect(compiled.textContent).toContain('5');
    expect(compiled.textContent).toContain('Inventory Restored');
  }));

  it('should apply date filter when date changes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const startDate = new Date('2026-01-01');
    component.startDate = startDate;
    component.onDateFilterChange();
    tick();

    expect(mockRefundService.getRefunds).toHaveBeenCalledWith(
      jasmine.objectContaining({ startDate: '2026-01-01' })
    );
  }));

  it('should clear all filters', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.startDate = new Date('2026-01-01');
    component.endDate = new Date('2026-01-31');
    fixture.detectChanges();

    expect(component.hasActiveFilters()).toBe(true);

    component.clearFilters();
    tick();

    expect(component.startDate).toBeNull();
    expect(component.endDate).toBeNull();
    expect(component.hasActiveFilters()).toBe(false);
  }));

  it('should open details dialog when view details is clicked', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.onViewDetails(mockRefund);
    fixture.detectChanges();

    expect(component.showDetailsDialog).toBe(true);
    expect(component.selectedRefund()).toEqual(mockRefund);
  }));

  it('should open print dialog when print is clicked', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.onPrintRefund(mockRefund);
    fixture.detectChanges();

    expect(component.showPrintDialog()).toBe(true);
    expect(component.printRefund()).toEqual(mockRefund);
  }));

  it('should show error toast when loading fails', fakeAsync(() => {
    mockRefundService.getRefunds.and.returnValue(Promise.reject(new Error('Network error')));

    fixture.detectChanges();
    tick();

    expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load refunds data');
  }));

  it('should format date correctly for filter', () => {
    const date = new Date(2026, 0, 15);
    const formatted = (component as any).formatDate(date);
    expect(formatted).toBe('2026-01-15');
  });

  it('should display refund type tags correctly', fakeAsync(() => {
    const partialRefund = { ...mockRefund, isPartialRefund: true };
    mockRefundService.getRefunds.and.returnValue(Promise.resolve({
      data: [partialRefund],
      total: 1
    }));

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Partial');
  }));

  it('should display manager approved indicator', fakeAsync(() => {
    const approvedRefund = { ...mockRefund, managerApproved: true };
    mockRefundService.getRefunds.and.returnValue(Promise.resolve({
      data: [approvedRefund],
      total: 1
    }));

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const verifiedIcon = compiled.querySelector('.pi-verified');
    expect(verifiedIcon).toBeTruthy();
  }));
});
