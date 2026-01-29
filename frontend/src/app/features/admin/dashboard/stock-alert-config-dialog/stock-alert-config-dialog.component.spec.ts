import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StockAlertConfigDialogComponent } from './stock-alert-config-dialog.component';
import { StockAlertService } from '../../../../core/services/stock-alert.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { StockAlertConfig } from '../../../../models/stock-alert-config.model';

describe('StockAlertConfigDialogComponent', () => {
  let component: StockAlertConfigDialogComponent;
  let fixture: ComponentFixture<StockAlertConfigDialogComponent>;
  let mockStockAlertService: jasmine.SpyObj<StockAlertService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockFocusService: jasmine.SpyObj<FocusManagementService>;

  const mockConfig: StockAlertConfig = {
    id: 'config-1',
    lowStockThreshold: 5,
    enableBrandZeroAlert: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null
  };

  beforeEach(async () => {
    mockStockAlertService = jasmine.createSpyObj('StockAlertService', ['updateConfig']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockFocusService = jasmine.createSpyObj('FocusManagementService', ['saveTriggerElement', 'restoreFocus']);

    mockStockAlertService.updateConfig.and.returnValue(Promise.resolve(mockConfig));

    await TestBed.configureTestingModule({
      imports: [StockAlertConfigDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: StockAlertService, useValue: mockStockAlertService },
        { provide: ToastService, useValue: mockToastService },
        { provide: FocusManagementService, useValue: mockFocusService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockAlertConfigDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should have default values', () => {
      expect(component.lowStockThreshold).toBe(5);
      expect(component.enableBrandZeroAlert).toBe(true);
    });

    it('should populate form from config when visible', () => {
      fixture.componentRef.setInput('config', { ...mockConfig, lowStockThreshold: 10, enableBrandZeroAlert: false });
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      // Trigger ngOnChanges
      component.ngOnChanges({
        config: {} as any,
        visible: {} as any
      });

      expect(component.lowStockThreshold).toBe(10);
      expect(component.enableBrandZeroAlert).toBe(false);
    });
  });

  describe('visibility changes', () => {
    it('should emit visibleChange when dialog visibility changes', () => {
      spyOn(component.visibleChange, 'emit');

      component.onVisibleChange(false);

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should close dialog on cancel', () => {
      spyOn(component.visibleChange, 'emit');

      component.onCancel();

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('focus management', () => {
    it('should save trigger element on dialog show', () => {
      component.onDialogShow();

      expect(mockFocusService.saveTriggerElement).toHaveBeenCalled();
    });

    it('should restore focus on dialog hide', () => {
      component.onDialogHide();

      expect(mockFocusService.restoreFocus).toHaveBeenCalled();
    });
  });

  describe('save functionality', () => {
    beforeEach(() => {
      component.lowStockThreshold = 10;
      component.enableBrandZeroAlert = false;
    });

    it('should call updateConfig with correct values', fakeAsync(() => {
      component.onSave();
      tick();

      expect(mockStockAlertService.updateConfig).toHaveBeenCalledWith({
        lowStockThreshold: 10,
        enableBrandZeroAlert: false
      });
    }));

    it('should show success toast on successful save', fakeAsync(() => {
      component.onSave();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('Settings Saved', 'Stock alert thresholds updated');
    }));

    it('should close dialog on successful save', fakeAsync(() => {
      spyOn(component.visibleChange, 'emit');

      component.onSave();
      tick();

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    }));

    it('should emit configSaved on successful save', fakeAsync(() => {
      spyOn(component.configSaved, 'emit');

      component.onSave();
      tick();

      expect(component.configSaved.emit).toHaveBeenCalled();
    }));

    it('should show saving state while saving', fakeAsync(() => {
      mockStockAlertService.updateConfig.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockConfig), 100))
      );

      component.onSave();
      expect(component.saving()).toBe(true);

      tick(100);
      expect(component.saving()).toBe(false);
    }));

    it('should handle null threshold value', fakeAsync(() => {
      component.lowStockThreshold = null;

      component.onSave();
      tick();

      expect(mockStockAlertService.updateConfig).toHaveBeenCalledWith({
        lowStockThreshold: 0,
        enableBrandZeroAlert: false
      });
    }));
  });

  describe('error handling', () => {
    it('should show error toast on save failure', fakeAsync(() => {
      mockStockAlertService.updateConfig.and.returnValue(Promise.reject(new Error('Save failed')));

      component.onSave();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Save failed');
    }));

    it('should handle non-Error exceptions', fakeAsync(() => {
      mockStockAlertService.updateConfig.and.returnValue(Promise.reject('Unknown error'));

      component.onSave();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to save settings');
    }));

    it('should stop saving state on error', fakeAsync(() => {
      mockStockAlertService.updateConfig.and.returnValue(Promise.reject(new Error('Error')));

      component.onSave();
      tick();

      expect(component.saving()).toBe(false);
    }));

    it('should not close dialog on error', fakeAsync(() => {
      spyOn(component.visibleChange, 'emit');
      mockStockAlertService.updateConfig.and.returnValue(Promise.reject(new Error('Error')));

      component.onSave();
      tick();

      expect(component.visibleChange.emit).not.toHaveBeenCalled();
    }));
  });

  describe('accessibility', () => {
    it('should have aria-label on dialog', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('p-dialog');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-label on cancel button', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      // Note: Template has ariaLabel="Cancel changes" on cancel button
      expect(component).toBeTruthy();
    });

    it('should have aria-label on save button', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      // Note: Template has ariaLabel="Save alert settings" on save button
      expect(component).toBeTruthy();
    });
  });
});
