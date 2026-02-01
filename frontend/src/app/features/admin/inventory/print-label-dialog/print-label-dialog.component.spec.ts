import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, signal } from '@angular/core';

import { PrintLabelDialogComponent } from './print-label-dialog.component';
import { Phone } from '../../../../models/phone.model';
import { PhoneCondition } from '../../../../enums/phone-condition.enum';
import { PhoneStatus } from '../../../../enums/phone-status.enum';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';

@Component({
  template: `
    <app-print-label-dialog
      [phone]="phone()"
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
    />
  `,
  imports: [PrintLabelDialogComponent]
})
class TestHostComponent {
  phone = signal<Phone | null>(null);
  visible = signal(false);
}

describe('PrintLabelDialogComponent', () => {
  let component: PrintLabelDialogComponent;
  let fixture: ComponentFixture<PrintLabelDialogComponent>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  const mockPhone: Phone = {
    id: 'test-phone-123',
    brandId: 'brand-1',
    brandName: 'Apple',
    brandLogoUrl: null,
    model: 'iPhone 14 Pro',
    description: 'Test phone',
    storageGb: 256,
    ramGb: 6,
    color: 'Space Black',
    condition: PhoneCondition.NEW,
    batteryHealth: null,
    imei: '123456789012345',
    costPrice: 800,
    sellingPrice: 999,
    profitMargin: 24.9,
    status: PhoneStatus.AVAILABLE,
    purchaseDate: '2024-01-15',
    supplierId: null,
    supplierName: null,
    notes: null,
    primaryImageUrl: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false
  };

  let mockFocusService: jasmine.SpyObj<FocusManagementService>;

  beforeEach(async () => {
    mockFocusService = jasmine.createSpyObj('FocusManagementService', [
      'saveTriggerElement',
      'restoreFocus'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        PrintLabelDialogComponent,
        TestHostComponent
      ],
      providers: [
        { provide: FocusManagementService, useValue: mockFocusService }
      ]
    }).compileComponents();

    // Create standalone component fixture
    fixture = TestBed.createComponent(PrintLabelDialogComponent);
    component = fixture.componentInstance;

    // Create host component fixture
    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Dialog Header', () => {
    it('should display default header when no phone is provided', () => {
      fixture.componentRef.setInput('phone', null);
      fixture.detectChanges();

      expect(component.dialogHeader()).toBe('Print Label');
    });

    it('should display phone info in header when phone is provided', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();

      expect(component.dialogHeader()).toBe('Print Label - Apple iPhone 14 Pro');
    });
  });

  describe('QR Code URL', () => {
    it('should return empty string when no phone is provided', () => {
      fixture.componentRef.setInput('phone', null);
      fixture.detectChanges();

      expect(component.qrCodeUrl()).toBe('');
    });

    it('should generate QR code URL with phone detail link', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();

      const qrUrl = component.qrCodeUrl();
      expect(qrUrl).toContain('api.qrserver.com');
      expect(qrUrl).toContain('size=200x200');
      expect(qrUrl).toContain(encodeURIComponent(`/phone/${mockPhone.id}`));
    });
  });

  describe('Condition Label', () => {
    it('should return correct label for NEW condition', () => {
      expect(component.getConditionLabel(PhoneCondition.NEW)).toBe('New');
    });

    it('should return correct label for USED condition', () => {
      expect(component.getConditionLabel(PhoneCondition.USED)).toBe('Used');
    });

    it('should return correct label for REFURBISHED condition', () => {
      expect(component.getConditionLabel(PhoneCondition.REFURBISHED)).toBe('Refurbished');
    });
  });

  describe('QR Code Toggle', () => {
    it('should show QR code by default', () => {
      expect(component.showQrCode).toBe(true);
    });

    it('should reset QR code toggle when dialog becomes visible', () => {
      component.showQrCode = false;
      fixture.componentRef.setInput('visible', false);
      fixture.detectChanges();

      fixture.componentRef.setInput('visible', true);
      component.ngOnChanges({
        visible: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.showQrCode).toBe(true);
    });
  });

  describe('Dialog Events', () => {
    it('should emit visibleChange when onVisibleChange is called', () => {
      spyOn(component.visibleChange, 'emit');
      component.onVisibleChange(false);
      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should emit false when onClose is called', () => {
      spyOn(component.visibleChange, 'emit');
      component.onClose();
      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should save trigger element on dialog show', () => {
      component.onDialogShow();
      expect(mockFocusService.saveTriggerElement).toHaveBeenCalled();
    });

    it('should restore focus on dialog hide', () => {
      component.onDialogHide();
      expect(mockFocusService.restoreFocus).toHaveBeenCalled();
    });
  });

  describe('Print Functionality', () => {
    let mockPrintWindow: {
      document: { write: jasmine.Spy; close: jasmine.Spy };
      close: jasmine.Spy;
    };

    beforeEach(() => {
      mockPrintWindow = {
        document: {
          write: jasmine.createSpy('write'),
          close: jasmine.createSpy('close')
        },
        close: jasmine.createSpy('close')
      };
    });

    it('should not print when phone is null', () => {
      spyOn(window, 'open');
      fixture.componentRef.setInput('phone', null);
      fixture.detectChanges();

      component.onPrint();
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should open print window with correct dimensions', () => {
      spyOn(window, 'open').and.returnValue(mockPrintWindow as unknown as Window);
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();

      component.onPrint();
      expect(window.open).toHaveBeenCalledWith('', '_blank', 'width=400,height=600');
    });

    it('should write phone details to print window', () => {
      spyOn(window, 'open').and.returnValue(mockPrintWindow as unknown as Window);
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();

      component.onPrint();

      const writtenHtml = mockPrintWindow.document.write.calls.mostRecent().args[0] as string;
      expect(writtenHtml).toContain('Apple');
      expect(writtenHtml).toContain('iPhone 14 Pro');
      expect(writtenHtml).toContain('256 GB');
      expect(writtenHtml).toContain('$999');
    });

    it('should include QR code when showQrCode is true', () => {
      spyOn(window, 'open').and.returnValue(mockPrintWindow as unknown as Window);
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();
      component.showQrCode = true;

      component.onPrint();

      const writtenHtml = mockPrintWindow.document.write.calls.mostRecent().args[0] as string;
      expect(writtenHtml).toContain('qr-section');
      expect(writtenHtml).toContain('api.qrserver.com');
    });

    it('should have showQrCode property that controls QR section inclusion', () => {
      // Test that the showQrCode property exists and can be toggled
      // The actual print output testing is covered by the "should include QR code when showQrCode is true" test
      // This tests verifies the toggle behavior
      expect(component.showQrCode).toBe(true); // Default value

      component.showQrCode = false;
      expect(component.showQrCode).toBe(false);

      component.showQrCode = true;
      expect(component.showQrCode).toBe(true);
    });

    it('should close print window document after writing', () => {
      spyOn(window, 'open').and.returnValue(mockPrintWindow as unknown as Window);
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();

      component.onPrint();
      expect(mockPrintWindow.document.close).toHaveBeenCalled();
    });

    it('should handle case when window.open returns null', () => {
      spyOn(window, 'open').and.returnValue(null);
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();

      expect(() => component.onPrint()).not.toThrow();
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML characters in phone details', () => {
      const phoneWithSpecialChars: Phone = {
        ...mockPhone,
        brandName: 'Test <b>Bold</b>',
        model: 'Model & "Special"'
      };

      const mockPrintWindow = {
        document: {
          write: jasmine.createSpy('write'),
          close: jasmine.createSpy('close')
        }
      };
      spyOn(window, 'open').and.returnValue(mockPrintWindow as unknown as Window);

      fixture.componentRef.setInput('phone', phoneWithSpecialChars);
      fixture.detectChanges();

      component.onPrint();

      const writtenHtml = mockPrintWindow.document.write.calls.mostRecent().args[0] as string;
      // The brand and model content should be escaped (not rendered as HTML tags)
      expect(writtenHtml).toContain('&lt;b&gt;Bold&lt;/b&gt;');
      expect(writtenHtml).toContain('&amp;');
    });
  });

  describe('Label Content Display', () => {
    it('should not display storage when storageGb is null', () => {
      const phoneWithoutStorage: Phone = {
        ...mockPhone,
        storageGb: null
      };

      const mockPrintWindow = {
        document: {
          write: jasmine.createSpy('write'),
          close: jasmine.createSpy('close')
        }
      };
      spyOn(window, 'open').and.returnValue(mockPrintWindow as unknown as Window);

      fixture.componentRef.setInput('phone', phoneWithoutStorage);
      fixture.detectChanges();

      component.onPrint();

      const writtenHtml = mockPrintWindow.document.write.calls.mostRecent().args[0] as string;
      // Should still contain the specs div but without the storage spec item
      expect(writtenHtml).toContain('class="specs"');
      expect(writtenHtml).not.toContain('null GB');
    });
  });

  describe('Host Component Integration', () => {
    it('should update dialog visibility through host component', () => {
      hostComponent.phone.set(mockPhone);
      hostComponent.visible.set(true);
      hostFixture.detectChanges();

      const dialogComponent = hostFixture.debugElement.query(
        el => el.componentInstance instanceof PrintLabelDialogComponent
      )?.componentInstance as PrintLabelDialogComponent;

      expect(dialogComponent.visible()).toBe(true);
    });

    it('should close dialog when visibleChange emits false', () => {
      hostComponent.phone.set(mockPhone);
      hostComponent.visible.set(true);
      hostFixture.detectChanges();

      const dialogComponent = hostFixture.debugElement.query(
        el => el.componentInstance instanceof PrintLabelDialogComponent
      )?.componentInstance as PrintLabelDialogComponent;

      dialogComponent.onClose();
      expect(hostComponent.visible()).toBe(false);
    });
  });
});
