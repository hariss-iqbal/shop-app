import { TestBed } from '@angular/core/testing';
import { ConfirmationService, Confirmation } from 'primeng/api';

import { ConfirmDialogService, ConfirmOptions } from './confirmation.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let lastConfirmCall: Confirmation;

  beforeEach(() => {
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    mockConfirmationService.confirm.and.callFake((config: Confirmation) => {
      lastConfirmCall = config;
      return mockConfirmationService;
    });

    TestBed.configureTestingModule({
      providers: [
        ConfirmDialogService,
        { provide: ConfirmationService, useValue: mockConfirmationService }
      ]
    });

    service = TestBed.inject(ConfirmDialogService);
  });

  describe('service creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should inject ConfirmationService', () => {
      expect(mockConfirmationService).toBeTruthy();
    });
  });

  describe('confirm()', () => {
    it('should call ConfirmationService.confirm with provided options', () => {
      const options: ConfirmOptions = {
        message: 'Test message'
      };

      service.confirm(options);

      expect(mockConfirmationService.confirm).toHaveBeenCalled();
      expect(lastConfirmCall.message).toBe('Test message');
    });

    it('should use default header "Confirm" when not provided', () => {
      service.confirm({ message: 'Test' });

      expect(lastConfirmCall.header).toBe('Confirm');
    });

    it('should use provided header when given', () => {
      service.confirm({
        message: 'Test',
        header: 'Custom Header'
      });

      expect(lastConfirmCall.header).toBe('Custom Header');
    });

    it('should use default icon when not provided', () => {
      service.confirm({ message: 'Test' });

      expect(lastConfirmCall.icon).toBe('pi pi-exclamation-triangle');
    });

    it('should use provided icon when given', () => {
      service.confirm({
        message: 'Test',
        icon: 'pi pi-trash'
      });

      expect(lastConfirmCall.icon).toBe('pi pi-trash');
    });

    it('should use default accept label "Yes" when not provided', () => {
      service.confirm({ message: 'Test' });

      expect(lastConfirmCall.acceptLabel).toBe('Yes');
    });

    it('should use provided accept label when given', () => {
      service.confirm({
        message: 'Test',
        acceptLabel: 'Delete'
      });

      expect(lastConfirmCall.acceptLabel).toBe('Delete');
    });

    it('should use default reject label "No" when not provided', () => {
      service.confirm({ message: 'Test' });

      expect(lastConfirmCall.rejectLabel).toBe('No');
    });

    it('should use provided reject label when given', () => {
      service.confirm({
        message: 'Test',
        rejectLabel: 'Keep'
      });

      expect(lastConfirmCall.rejectLabel).toBe('Keep');
    });

    it('should use default accept button style class when not provided', () => {
      service.confirm({ message: 'Test' });

      expect(lastConfirmCall.acceptButtonStyleClass).toBe('p-button-danger');
    });

    it('should use provided accept button style class when given', () => {
      service.confirm({
        message: 'Test',
        acceptButtonStyleClass: 'p-button-warning'
      });

      expect(lastConfirmCall.acceptButtonStyleClass).toBe('p-button-warning');
    });

    it('should use default reject button style class when not provided', () => {
      service.confirm({ message: 'Test' });

      expect(lastConfirmCall.rejectButtonStyleClass).toBe('p-button-text');
    });

    it('should use provided reject button style class when given', () => {
      service.confirm({
        message: 'Test',
        rejectButtonStyleClass: 'p-button-secondary'
      });

      expect(lastConfirmCall.rejectButtonStyleClass).toBe('p-button-secondary');
    });

    it('should return a Promise that resolves to true when accepted', async () => {
      const promise = service.confirm({ message: 'Test' });

      // Simulate user clicking accept
      lastConfirmCall.accept!();

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should return a Promise that resolves to false when rejected', async () => {
      const promise = service.confirm({ message: 'Test' });

      // Simulate user clicking reject
      lastConfirmCall.reject!();

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('confirmDelete()', () => {
    it('should call confirm with correct header', () => {
      service.confirmDelete('product');

      expect(lastConfirmCall.header).toBe('Confirm Delete');
    });

    it('should include entity name in message', () => {
      service.confirmDelete('product');

      expect(lastConfirmCall.message).toContain('product');
    });

    it('should include "Are you sure" in message', () => {
      service.confirmDelete('product');

      expect(lastConfirmCall.message).toContain('Are you sure you want to delete');
    });

    it('should include "cannot be undone" in message', () => {
      service.confirmDelete('product');

      expect(lastConfirmCall.message).toContain('This action cannot be undone');
    });

    it('should include item details when provided', () => {
      service.confirmDelete('product', 'iPhone 15 Pro');

      expect(lastConfirmCall.message).toContain('iPhone 15 Pro');
    });

    it('should format item details in bold', () => {
      service.confirmDelete('product', 'iPhone 15 Pro');

      expect(lastConfirmCall.message).toContain('<strong>iPhone 15 Pro</strong>');
    });

    it('should use trash icon', () => {
      service.confirmDelete('product');

      expect(lastConfirmCall.icon).toBe('pi pi-trash');
    });

    it('should use "Confirm" as accept label', () => {
      service.confirmDelete('product');

      expect(lastConfirmCall.acceptLabel).toBe('Confirm');
    });

    it('should use "Cancel" as reject label', () => {
      service.confirmDelete('product');

      expect(lastConfirmCall.rejectLabel).toBe('Cancel');
    });

    it('should resolve to true when confirmed', async () => {
      const promise = service.confirmDelete('product');
      lastConfirmCall.accept!();

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should resolve to false when cancelled', async () => {
      const promise = service.confirmDelete('product');
      lastConfirmCall.reject!();

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('confirmBulkDelete()', () => {
    it('should call confirm with correct header', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.header).toBe('Confirm Bulk Delete');
    });

    it('should include count in message', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.message).toContain('<strong>5</strong>');
    });

    it('should include entity name in message', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.message).toContain('product');
    });

    it('should pluralize entity name when count > 1', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.message).toContain('products');
    });

    it('should not pluralize entity name when count is 1', () => {
      service.confirmBulkDelete('product', 1);

      expect(lastConfirmCall.message).not.toContain('products');
      expect(lastConfirmCall.message).toContain('product');
    });

    it('should include "cannot be undone" in message', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.message).toContain('This action cannot be undone');
    });

    it('should use trash icon', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.icon).toBe('pi pi-trash');
    });

    it('should use "Confirm" as accept label', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.acceptLabel).toBe('Confirm');
    });

    it('should use "Cancel" as reject label', () => {
      service.confirmBulkDelete('product', 5);

      expect(lastConfirmCall.rejectLabel).toBe('Cancel');
    });

    it('should resolve to true when confirmed', async () => {
      const promise = service.confirmBulkDelete('product', 5);
      lastConfirmCall.accept!();

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should resolve to false when cancelled', async () => {
      const promise = service.confirmBulkDelete('product', 5);
      lastConfirmCall.reject!();

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should handle large counts correctly', () => {
      service.confirmBulkDelete('item', 1000);

      expect(lastConfirmCall.message).toContain('<strong>1000</strong>');
    });
  });

  describe('confirmBulkAction()', () => {
    it('should include action name in header', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.header).toBe('Confirm Mark as Sold');
    });

    it('should include action name in message (lowercase)', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.message).toContain('mark as sold');
    });

    it('should include count in message', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.message).toContain('<strong>3</strong>');
    });

    it('should include entity name in message', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.message).toContain('product');
    });

    it('should pluralize entity name when count > 1', () => {
      service.confirmBulkAction('Reserve', 'item', 5);

      expect(lastConfirmCall.message).toContain('items');
    });

    it('should not pluralize entity name when count is 1', () => {
      service.confirmBulkAction('Reserve', 'item', 1);

      expect(lastConfirmCall.message).not.toContain('items');
    });

    it('should use exclamation-triangle icon', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.icon).toBe('pi pi-exclamation-triangle');
    });

    it('should use warning button style', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.acceptButtonStyleClass).toBe('p-button-warning');
    });

    it('should use "Confirm" as accept label', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.acceptLabel).toBe('Confirm');
    });

    it('should use "Cancel" as reject label', () => {
      service.confirmBulkAction('Mark as Sold', 'product', 3);

      expect(lastConfirmCall.rejectLabel).toBe('Cancel');
    });

    it('should resolve to true when confirmed', async () => {
      const promise = service.confirmBulkAction('Mark as Sold', 'product', 3);
      lastConfirmCall.accept!();

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should resolve to false when cancelled', async () => {
      const promise = service.confirmBulkAction('Mark as Sold', 'product', 3);
      lastConfirmCall.reject!();

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('confirmAction()', () => {
    it('should include action name in header', () => {
      service.confirmAction('Cancel', 'order');

      expect(lastConfirmCall.header).toBe('Confirm Cancel');
    });

    it('should include action name in message (lowercase)', () => {
      service.confirmAction('Cancel', 'order');

      expect(lastConfirmCall.message).toContain('cancel');
    });

    it('should include entity name in message', () => {
      service.confirmAction('Cancel', 'order');

      expect(lastConfirmCall.message).toContain('order');
    });

    it('should include item details when provided', () => {
      service.confirmAction('Cancel', 'order', 'PO-0001');

      expect(lastConfirmCall.message).toContain('PO-0001');
    });

    it('should format item details in bold', () => {
      service.confirmAction('Cancel', 'order', 'PO-0001');

      expect(lastConfirmCall.message).toContain('<strong>PO-0001</strong>');
    });

    it('should include "cannot be undone" in message', () => {
      service.confirmAction('Cancel', 'order');

      expect(lastConfirmCall.message).toContain('This action cannot be undone');
    });

    it('should use danger button style', () => {
      service.confirmAction('Cancel', 'order');

      expect(lastConfirmCall.acceptButtonStyleClass).toBe('p-button-danger');
    });

    it('should use "Confirm" as accept label', () => {
      service.confirmAction('Cancel', 'order');

      expect(lastConfirmCall.acceptLabel).toBe('Confirm');
    });

    it('should use "Cancel" as reject label', () => {
      service.confirmAction('Cancel', 'order');

      expect(lastConfirmCall.rejectLabel).toBe('Cancel');
    });

    it('should resolve to true when confirmed', async () => {
      const promise = service.confirmAction('Cancel', 'order');
      lastConfirmCall.accept!();

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should resolve to false when cancelled', async () => {
      const promise = service.confirmAction('Cancel', 'order');
      lastConfirmCall.reject!();

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle entity names with special characters', () => {
      service.confirmDelete('purchase order');

      expect(lastConfirmCall.message).toContain('purchase order');
    });

    it('should handle item details with HTML special characters', () => {
      service.confirmDelete('product', 'Samsung <Galaxy> S24');

      expect(lastConfirmCall.message).toContain('Samsung <Galaxy> S24');
    });

    it('should handle empty item details', () => {
      service.confirmDelete('product', '');

      expect(lastConfirmCall.message).not.toContain('<strong></strong>');
    });

    it('should handle zero count in bulk delete', () => {
      service.confirmBulkDelete('product', 0);

      expect(lastConfirmCall.message).toContain('<strong>0</strong>');
    });

    it('should handle negative count in bulk delete', () => {
      service.confirmBulkDelete('product', -1);

      expect(lastConfirmCall.message).toContain('<strong>-1</strong>');
    });

    it('should handle very long messages', () => {
      const longDetails = 'A'.repeat(500);
      service.confirmDelete('item', longDetails);

      expect(lastConfirmCall.message).toContain(longDetails);
    });

    it('should handle unicode characters in entity names', () => {
      service.confirmDelete('teléfono');

      expect(lastConfirmCall.message).toContain('teléfono');
    });

    it('should handle unicode characters in item details', () => {
      service.confirmDelete('product', 'iPhone 15 Pro 📱');

      expect(lastConfirmCall.message).toContain('iPhone 15 Pro 📱');
    });
  });

  describe('concurrent confirmations', () => {
    it('should handle multiple sequential confirmations', async () => {
      const promise1 = service.confirmDelete('product', 'Item 1');
      lastConfirmCall.accept!();
      const result1 = await promise1;

      const promise2 = service.confirmDelete('supplier', 'Item 2');
      lastConfirmCall.accept!();
      const result2 = await promise2;

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockConfirmationService.confirm).toHaveBeenCalledTimes(2);
    });
  });
});
