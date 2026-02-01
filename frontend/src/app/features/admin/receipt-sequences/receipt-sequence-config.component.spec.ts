import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReceiptSequenceConfigComponent } from './receipt-sequence-config.component';
import { ReceiptSequenceService } from '../../../core/services/receipt-sequence.service';
import { StoreLocationService } from '../../../core/services/store-location.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmationService } from 'primeng/api';
import {
  ReceiptSequence,
  ReceiptSequenceListResponse,
  GenerateReceiptNumberResponse,
  PreviewNextReceiptNumberResponse,
  ReceiptNumberLog,
  ReceiptNumberLogListResponse
} from '../../../models/receipt-sequence.model';
import { StoreLocation } from '../../../models/store-location.model';

describe('ReceiptSequenceConfigComponent', () => {
  let component: ReceiptSequenceConfigComponent;
  let fixture: ComponentFixture<ReceiptSequenceConfigComponent>;
  let mockReceiptSequenceService: jasmine.SpyObj<ReceiptSequenceService>;
  let mockStoreLocationService: jasmine.SpyObj<StoreLocationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;

  const mockSequence: ReceiptSequence = {
    id: 'seq-1',
    registerId: 'DEFAULT',
    registerName: 'Main Register',
    prefix: 'RCP',
    currentSequence: 999,
    sequencePadding: 4,
    formatPattern: '{PREFIX}{SEP}{DATE}{SEP}{SEQ}',
    includeDate: true,
    dateFormat: 'YY-MM',
    separator: '-',
    isActive: true,
    lastGeneratedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null
  };

  const mockSequenceList: ReceiptSequenceListResponse = {
    data: [mockSequence],
    total: 1
  };

  const mockGenerateResponse: GenerateReceiptNumberResponse = {
    success: true,
    receiptNumber: 'RCP-26-01-1000',
    sequenceValue: 1000,
    registerId: 'DEFAULT',
    logId: 'log-1'
  };

  const mockPreviewResponse: PreviewNextReceiptNumberResponse = {
    success: true,
    nextSequence: 1000,
    previewNumber: 'RCP-26-01-1000',
    registerId: 'DEFAULT',
    registerName: 'Main Register'
  };

  const mockLog: ReceiptNumberLog = {
    id: 'log-1',
    sequenceId: 'seq-1',
    receiptNumber: 'RCP-26-01-1000',
    sequenceValue: 1000,
    generatedAt: '2024-01-01T12:00:00Z',
    receiptId: null
  };

  const mockLogsList: ReceiptNumberLogListResponse = {
    data: [mockLog],
    total: 1
  };

  const mockLocation: StoreLocation = {
    id: 'loc-1',
    name: 'Downtown Store',
    code: 'DT',
    address: '123 Main St',
    phone: '555-1234',
    email: 'downtown@store.com',
    isActive: true,
    isPrimary: true,
    managerUserId: null,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null
  };

  beforeEach(async () => {
    mockReceiptSequenceService = jasmine.createSpyObj('ReceiptSequenceService', [
      'findAll',
      'findById',
      'findByRegisterId',
      'create',
      'update',
      'delete',
      'generateNextReceiptNumber',
      'previewNextReceiptNumber',
      'resetSequence',
      'getLogs'
    ]);
    mockStoreLocationService = jasmine.createSpyObj('StoreLocationService', ['getActiveLocations']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    mockReceiptSequenceService.findAll.and.returnValue(Promise.resolve(mockSequenceList));
    mockReceiptSequenceService.previewNextReceiptNumber.and.returnValue(Promise.resolve(mockPreviewResponse));
    mockReceiptSequenceService.generateNextReceiptNumber.and.returnValue(Promise.resolve(mockGenerateResponse));
    mockReceiptSequenceService.getLogs.and.returnValue(Promise.resolve(mockLogsList));
    mockStoreLocationService.getActiveLocations.and.returnValue(Promise.resolve([mockLocation]));

    await TestBed.configureTestingModule({
      imports: [ReceiptSequenceConfigComponent, NoopAnimationsModule],
      providers: [
        { provide: ReceiptSequenceService, useValue: mockReceiptSequenceService },
        { provide: StoreLocationService, useValue: mockStoreLocationService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmationService, useValue: mockConfirmationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptSequenceConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load sequences on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockReceiptSequenceService.findAll).toHaveBeenCalled();
      expect(component.sequences().length).toBe(1);
    }));

    it('should set default preview register on load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.selectedPreviewRegisterId).toBe('DEFAULT');
    }));

    it('should load preview after sequences are loaded', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockReceiptSequenceService.previewNextReceiptNumber).toHaveBeenCalledWith('DEFAULT');
    }));

    it('should have default form values', () => {
      expect(component.sequenceForm.get('prefix')?.value).toBe('RCP');
      expect(component.sequenceForm.get('separator')?.value).toBe('-');
      expect(component.sequenceForm.get('sequencePadding')?.value).toBe(4);
      expect(component.sequenceForm.get('startingSequence')?.value).toBe(1000);
      expect(component.sequenceForm.get('includeDate')?.value).toBe(true);
      expect(component.sequenceForm.get('dateFormat')?.value).toBe('YY-MM');
      expect(component.sequenceForm.get('isActive')?.value).toBe(true);
    });
  });

  describe('loadSequences', () => {
    it('should set loading state while loading', fakeAsync(() => {
      mockReceiptSequenceService.findAll.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockSequenceList), 100))
      );

      component.loadSequences();
      expect(component.loading()).toBe(true);

      tick(100);
      expect(component.loading()).toBe(false);
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      mockReceiptSequenceService.findAll.and.returnValue(Promise.reject(new Error('Load failed')));

      component.loadSequences();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load sequences');
    }));
  });

  describe('loadPreview', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update preview number on successful load', fakeAsync(() => {
      component.selectedPreviewRegisterId = 'DEFAULT';
      component.loadPreview();
      tick();

      expect(component.previewNumber()).toBe('RCP-26-01-1000');
      expect(component.nextSequence()).toBe(1000);
    }));

    it('should clear preview when no register selected', fakeAsync(() => {
      component.selectedPreviewRegisterId = '';
      component.loadPreview();
      tick();

      expect(component.previewNumber()).toBeNull();
      expect(component.nextSequence()).toBeNull();
    }));

    it('should handle preview error gracefully', fakeAsync(() => {
      mockReceiptSequenceService.previewNextReceiptNumber.and.returnValue(
        Promise.resolve({ success: false, nextSequence: null, previewNumber: null, registerId: null, registerName: null, error: 'Not found' })
      );

      component.selectedPreviewRegisterId = 'INVALID';
      component.loadPreview();
      tick();

      expect(component.previewNumber()).toBeNull();
    }));
  });

  describe('generateReceiptNumber', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should generate receipt number and show success toast', fakeAsync(() => {
      component.selectedPreviewRegisterId = 'DEFAULT';
      component.generateReceiptNumber();
      tick();

      expect(mockReceiptSequenceService.generateNextReceiptNumber).toHaveBeenCalledWith('DEFAULT');
      expect(mockToastService.success).toHaveBeenCalledWith('Generated', 'Receipt number: RCP-26-01-1000');
    }));

    it('should reload sequences and preview after generation', fakeAsync(() => {
      mockReceiptSequenceService.findAll.calls.reset();
      mockReceiptSequenceService.previewNextReceiptNumber.calls.reset();

      component.selectedPreviewRegisterId = 'DEFAULT';
      component.generateReceiptNumber();
      tick();

      expect(mockReceiptSequenceService.findAll).toHaveBeenCalled();
      expect(mockReceiptSequenceService.previewNextReceiptNumber).toHaveBeenCalled();
    }));

    it('should show error toast on generation failure', fakeAsync(() => {
      mockReceiptSequenceService.generateNextReceiptNumber.and.returnValue(
        Promise.resolve({ success: false, receiptNumber: null, sequenceValue: null, registerId: null, logId: null, error: 'Generation failed' })
      );

      component.selectedPreviewRegisterId = 'DEFAULT';
      component.generateReceiptNumber();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Generation failed');
    }));

    it('should set generating state while generating', fakeAsync(() => {
      mockReceiptSequenceService.generateNextReceiptNumber.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockGenerateResponse), 100))
      );

      component.selectedPreviewRegisterId = 'DEFAULT';
      component.generateReceiptNumber();
      expect(component.generating()).toBe(true);

      tick(100);
      tick(); // For subsequent reloads
      expect(component.generating()).toBe(false);
    }));

    it('should not generate when no register selected', () => {
      component.selectedPreviewRegisterId = '';
      component.generateReceiptNumber();

      expect(mockReceiptSequenceService.generateNextReceiptNumber).not.toHaveBeenCalled();
    });
  });

  describe('openCreateDialog', () => {
    it('should reset form for new sequence', () => {
      component.openCreateDialog();

      expect(component.editingSequence()).toBeNull();
      expect(component.dialogVisible).toBe(true);
      expect(component.sequenceForm.get('registerId')?.enabled).toBe(true);
    });

    it('should set default form values', () => {
      component.openCreateDialog();

      expect(component.sequenceForm.get('registerId')?.value).toBe('');
      expect(component.sequenceForm.get('registerName')?.value).toBe('');
      expect(component.sequenceForm.get('prefix')?.value).toBe('RCP');
      expect(component.sequenceForm.get('startingSequence')?.value).toBe(1000);
    });
  });

  describe('openEditDialog', () => {
    it('should populate form with sequence data', () => {
      component.openEditDialog(mockSequence);

      expect(component.editingSequence()).toEqual(mockSequence);
      expect(component.dialogVisible).toBe(true);
      expect(component.sequenceForm.get('registerId')?.value).toBe('DEFAULT');
      expect(component.sequenceForm.get('registerName')?.value).toBe('Main Register');
      expect(component.sequenceForm.get('prefix')?.value).toBe('RCP');
    });

    it('should disable register ID field when editing', () => {
      component.openEditDialog(mockSequence);

      expect(component.sequenceForm.get('registerId')?.disabled).toBe(true);
    });
  });

  describe('saveSequence', () => {
    beforeEach(() => {
      mockReceiptSequenceService.create.and.returnValue(Promise.resolve(mockSequence));
      mockReceiptSequenceService.update.and.returnValue(Promise.resolve(mockSequence));
    });

    it('should create new sequence when not editing', fakeAsync(() => {
      component.openCreateDialog();
      component.sequenceForm.patchValue({
        registerId: 'STORE-A',
        registerName: 'Store A',
        prefix: 'SA',
        startingSequence: 1
      });

      component.saveSequence();
      tick();

      expect(mockReceiptSequenceService.create).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalledWith('Created', 'Register created successfully');
    }));

    it('should update existing sequence when editing', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.openEditDialog(mockSequence);
      component.sequenceForm.patchValue({
        registerName: 'Updated Register'
      });

      component.saveSequence();
      tick();

      expect(mockReceiptSequenceService.update).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalledWith('Updated', 'Register updated successfully');
    }));

    it('should close dialog on successful save', fakeAsync(() => {
      component.openCreateDialog();
      component.sequenceForm.patchValue({
        registerId: 'STORE-A',
        registerName: 'Store A'
      });

      component.saveSequence();
      tick();

      expect(component.dialogVisible).toBe(false);
    }));

    it('should show error toast on save failure', fakeAsync(() => {
      mockReceiptSequenceService.create.and.returnValue(Promise.reject(new Error('Duplicate register ID')));

      component.openCreateDialog();
      component.sequenceForm.patchValue({
        registerId: 'DEFAULT',
        registerName: 'Duplicate'
      });

      component.saveSequence();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Duplicate register ID');
    }));

    it('should not save when form is invalid', () => {
      component.openCreateDialog();
      // Form is invalid with empty required fields

      component.saveSequence();

      expect(mockReceiptSequenceService.create).not.toHaveBeenCalled();
    });
  });

  describe('openResetDialog', () => {
    it('should set resetting sequence and show dialog', () => {
      component.openResetDialog(mockSequence);

      expect(component.resettingSequence()).toEqual(mockSequence);
      expect(component.resetDialogVisible).toBe(true);
      expect(component.newStartingValue).toBe(1000); // currentSequence + 1
    });
  });

  describe('resetSequence', () => {
    beforeEach(() => {
      mockReceiptSequenceService.resetSequence.and.returnValue(Promise.resolve(mockSequence));
    });

    it('should reset sequence with new value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.openResetDialog(mockSequence);
      component.newStartingValue = 2000;
      component.resetSequence();
      tick();

      expect(mockReceiptSequenceService.resetSequence).toHaveBeenCalledWith('seq-1', { newStartingValue: 2000 });
      expect(mockToastService.success).toHaveBeenCalledWith('Reset', 'Sequence reset successfully');
    }));

    it('should close reset dialog on success', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.openResetDialog(mockSequence);
      component.newStartingValue = 2000;
      component.resetSequence();
      tick();

      expect(component.resetDialogVisible).toBe(false);
    }));

    it('should not reset when no sequence selected', () => {
      component.resetSequence();

      expect(mockReceiptSequenceService.resetSequence).not.toHaveBeenCalled();
    });
  });

  describe('confirmDelete', () => {
    it('should show confirmation dialog', () => {
      component.confirmDelete(mockSequence);

      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should pass correct message to confirmation dialog', () => {
      component.confirmDelete(mockSequence);

      const confirmArgs = mockConfirmationService.confirm.calls.mostRecent().args[0];
      expect(confirmArgs.message).toContain('Main Register');
      expect(confirmArgs.header).toBe('Confirm Delete');
    });
  });

  describe('deleteSequence', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockReceiptSequenceService.delete.and.returnValue(Promise.resolve());
    }));

    it('should delete sequence and show success toast', fakeAsync(() => {
      component.deleteSequence(mockSequence);
      tick();

      expect(mockReceiptSequenceService.delete).toHaveBeenCalledWith('seq-1');
      expect(mockToastService.success).toHaveBeenCalledWith('Deleted', 'Register deleted successfully');
    }));

    it('should reload sequences after deletion', fakeAsync(() => {
      mockReceiptSequenceService.findAll.calls.reset();

      component.deleteSequence(mockSequence);
      tick();

      expect(mockReceiptSequenceService.findAll).toHaveBeenCalled();
    }));

    it('should show error toast on delete failure', fakeAsync(() => {
      mockReceiptSequenceService.delete.and.returnValue(Promise.reject(new Error('Delete failed')));

      component.deleteSequence(mockSequence);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to delete register');
    }));
  });

  describe('applyTemplate', () => {
    it('should update format pattern from template', () => {
      const template = { name: 'Simple', pattern: '{PREFIX}{SEQ}', example: 'RCP0001' };

      component.applyTemplate(template);

      expect(component.sequenceForm.get('formatPattern')?.value).toBe('{PREFIX}{SEQ}');
    });

    it('should not update if template is null', () => {
      const originalPattern = component.sequenceForm.get('formatPattern')?.value;

      component.applyTemplate(null as any);

      expect(component.sequenceForm.get('formatPattern')?.value).toBe(originalPattern);
    });
  });

  describe('getFormatPreview', () => {
    it('should return formatted preview for sequence', () => {
      const preview = component.getFormatPreview(mockSequence);

      expect(preview).toContain('RCP');
      expect(preview).toContain('1000');
    });
  });

  describe('formPreview computed', () => {
    it('should update preview when form values change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sequenceForm.patchValue({
        prefix: 'INV',
        separator: '/',
        sequencePadding: 6,
        startingSequence: 1
      });

      const preview = component.formPreview();

      expect(preview).toContain('INV');
      expect(preview).toContain('000001');
    }));
  });

  describe('activeSequences computed', () => {
    it('should filter only active sequences', fakeAsync(() => {
      const inactiveSequence: ReceiptSequence = { ...mockSequence, id: 'seq-2', registerId: 'INACTIVE', isActive: false };
      mockReceiptSequenceService.findAll.and.returnValue(
        Promise.resolve({ data: [mockSequence, inactiveSequence], total: 2 })
      );

      fixture.detectChanges();
      tick();

      expect(component.activeSequences().length).toBe(1);
      expect(component.activeSequences()[0].registerId).toBe('DEFAULT');
    }));
  });

  describe('form validation', () => {
    it('should require registerId', () => {
      component.openCreateDialog();
      component.sequenceForm.patchValue({ registerId: '' });

      expect(component.sequenceForm.get('registerId')?.valid).toBe(false);
    });

    it('should require registerName', () => {
      component.openCreateDialog();
      component.sequenceForm.patchValue({ registerName: '' });

      expect(component.sequenceForm.get('registerName')?.valid).toBe(false);
    });

    it('should validate sequencePadding range', () => {
      component.sequenceForm.patchValue({ sequencePadding: 0 });
      expect(component.sequenceForm.get('sequencePadding')?.valid).toBe(false);

      component.sequenceForm.patchValue({ sequencePadding: 11 });
      expect(component.sequenceForm.get('sequencePadding')?.valid).toBe(false);

      component.sequenceForm.patchValue({ sequencePadding: 5 });
      expect(component.sequenceForm.get('sequencePadding')?.valid).toBe(true);
    });

    it('should validate startingSequence minimum', () => {
      component.sequenceForm.patchValue({ startingSequence: 0 });
      expect(component.sequenceForm.get('startingSequence')?.valid).toBe(false);

      component.sequenceForm.patchValue({ startingSequence: 1 });
      expect(component.sequenceForm.get('startingSequence')?.valid).toBe(true);
    });
  });

  describe('accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have proper page heading', () => {
      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading.textContent).toContain('Receipt Number Configuration');
    });

    it('should have table headers', () => {
      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should have add button with proper label', () => {
      const addButton = fixture.nativeElement.querySelector('p-button[label="Add Register"]');
      expect(addButton).toBeTruthy();
    });
  });

  describe('dialog management', () => {
    it('should close create/edit dialog', () => {
      component.dialogVisible = true;
      component.editingSequence.set(mockSequence);

      component.closeDialog();

      expect(component.dialogVisible).toBe(false);
      expect(component.editingSequence()).toBeNull();
    });

    it('should close reset dialog', () => {
      component.resetDialogVisible = true;
      component.resettingSequence.set(mockSequence);

      component.closeResetDialog();

      expect(component.resetDialogVisible).toBe(false);
      expect(component.resettingSequence()).toBeNull();
    });

    it('should open location select dialog', () => {
      component.openLocationSelectDialog();

      expect(component.locationSelectDialogVisible).toBe(true);
      expect(component.selectedLocationForRegister).toBeNull();
    });

    it('should close location select dialog', () => {
      component.locationSelectDialogVisible = true;
      component.selectedLocationForRegister = mockLocation;

      component.closeLocationSelectDialog();

      expect(component.locationSelectDialogVisible).toBe(false);
      expect(component.selectedLocationForRegister).toBeNull();
    });
  });

  describe('generation logs', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load logs', fakeAsync(() => {
      component.loadLogs();
      tick();

      expect(mockReceiptSequenceService.getLogs).toHaveBeenCalled();
      expect(component.logs().length).toBe(1);
      expect(component.logsTotal()).toBe(1);
    }));

    it('should apply filter when loading logs', fakeAsync(() => {
      component.logsFilter = { sequenceId: 'seq-1', receiptNumber: 'RCP' };
      component.loadLogs();
      tick();

      expect(mockReceiptSequenceService.getLogs).toHaveBeenCalledWith({
        sequenceId: 'seq-1',
        receiptNumber: 'RCP',
        page: 1,
        limit: 20
      });
    }));

    it('should clear logs filter', fakeAsync(() => {
      component.logsFilter = { sequenceId: 'seq-1' };
      component.logsPage.set(2);

      component.clearLogsFilter();
      tick();

      expect(component.logsFilter).toEqual({});
      expect(component.logsPage()).toBe(1);
    }));

    it('should view logs for specific sequence', fakeAsync(() => {
      component.viewLogsForSequence(mockSequence);
      tick();

      expect(component.logsFilter.sequenceId).toBe('seq-1');
      expect(mockReceiptSequenceService.getLogs).toHaveBeenCalled();
    }));

    it('should get sequence name by id', () => {
      const name = component.getSequenceNameById('seq-1');
      expect(name).toBe('Main Register (DEFAULT)');
    });

    it('should return Unknown for non-existent sequence', () => {
      const name = component.getSequenceNameById('invalid-id');
      expect(name).toBe('Unknown');
    });

    it('should show error toast on logs load failure', fakeAsync(() => {
      mockReceiptSequenceService.getLogs.and.returnValue(Promise.reject(new Error('Load failed')));

      component.loadLogs();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load generation logs');
    }));
  });

  describe('store locations', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load store locations on init', () => {
      expect(mockStoreLocationService.getActiveLocations).toHaveBeenCalled();
      expect(component.storeLocations().length).toBe(1);
    });

    it('should filter available locations not already having a register', () => {
      // mockLocation has code 'DT' and no sequence exists with that registerId
      const available = component.availableLocationsForRegister();
      expect(available.length).toBe(1);
      expect(available[0].code).toBe('DT');
    });

    it('should create register from location', fakeAsync(() => {
      component.selectedLocationForRegister = mockLocation;
      component.createFromLocation();
      tick();

      expect(component.locationSelectDialogVisible).toBe(false);
      expect(component.dialogVisible).toBe(true);
      expect(component.sequenceForm.get('registerId')?.value).toBe('DT');
      expect(component.sequenceForm.get('registerName')?.value).toBe('Downtown Store');
    }));

    it('should not create from location if none selected', () => {
      component.selectedLocationForRegister = null;
      component.createFromLocation();

      expect(component.dialogVisible).toBe(false);
    });
  });

  describe('sequenceOptionsForLogs computed', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should include all sequences plus "All Registers" option', () => {
      const options = component.sequenceOptionsForLogs();
      expect(options.length).toBe(2); // "All Registers" + 1 sequence
      expect(options[0].registerName).toBe('All Registers');
      expect((options[1] as any).registerId).toBe('DEFAULT');
    });
  });
});
