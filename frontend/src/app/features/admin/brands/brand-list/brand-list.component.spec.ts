import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfirmationService, MessageService } from 'primeng/api';

import { BrandListComponent } from './brand-list.component';
import { BrandService } from '../../../../core/services/brand.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { Brand } from '../../../../models/brand.model';

describe('BrandListComponent', () => {
  let component: BrandListComponent;
  let fixture: ComponentFixture<BrandListComponent>;
  let mockBrandService: jasmine.SpyObj<BrandService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmService: jasmine.SpyObj<ConfirmDialogService>;
  let mockFocusService: jasmine.SpyObj<FocusManagementService>;

  const mockBrands: Brand[] = [
    { id: 'brand-1', name: 'Apple', logoUrl: 'https://example.com/apple.png', createdAt: '2024-01-01T00:00:00Z', updatedAt: null },
    { id: 'brand-2', name: 'Samsung', logoUrl: null, createdAt: '2024-01-02T00:00:00Z', updatedAt: null },
    { id: 'brand-3', name: 'Google', logoUrl: 'https://example.com/google.png', createdAt: '2024-01-03T00:00:00Z', updatedAt: null }
  ];

  beforeEach(async () => {
    mockBrandService = jasmine.createSpyObj('BrandService', [
      'getBrands', 'createBrand', 'updateBrand', 'deleteBrand', 'uploadLogo', 'deleteLogo'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    mockConfirmService = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete']);
    mockFocusService = jasmine.createSpyObj('FocusManagementService', ['saveTriggerElement', 'restoreFocus']);

    const mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
      }),
      storage: {
        from: jasmine.createSpy('storage.from').and.returnValue({
          upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve({ error: null })),
          getPublicUrl: jasmine.createSpy('getPublicUrl').and.returnValue({ data: { publicUrl: '' } }),
          remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve({ error: null }))
        })
      }
    };

    mockBrandService.getBrands.and.returnValue(Promise.resolve(mockBrands));
    mockConfirmService.confirmDelete.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [
        BrandListComponent,
        NoopAnimationsModule,
        FormsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BrandService, useValue: mockBrandService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmService },
        { provide: FocusManagementService, useValue: mockFocusService },
        MessageService,
        ConfirmationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandListComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load brands on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockBrandService.getBrands).toHaveBeenCalled();
      expect(component.brands().length).toBe(3);
    }));

    it('should set loading state while fetching brands', fakeAsync(() => {
      expect(component.loading()).toBe(true);

      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
    }));

    it('should show skeleton loader while loading', fakeAsync(() => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);

      tick();
      fixture.detectChanges();

      expect(compiled.querySelectorAll('p-skeleton').length).toBe(0);
    }));

    it('should display "Brands" as page title', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Brands');
    }));

    it('should show error toast when loading fails', fakeAsync(() => {
      mockBrandService.getBrands.and.returnValue(Promise.reject(new Error('Load failed')));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Load failed');
    }));

    it('should show empty state when no brands exist', fakeAsync(() => {
      mockBrandService.getBrands.and.returnValue(Promise.resolve([]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No brands found');
      expect(compiled.textContent).toContain('Add your first brand');
    }));
  });

  describe('brand list display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display brand names', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Apple');
      expect(compiled.textContent).toContain('Samsung');
      expect(compiled.textContent).toContain('Google');
    });

    it('should display brand logos when available', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const logos = compiled.querySelectorAll('img[alt]');
      expect(logos.length).toBeGreaterThanOrEqual(2);
    });

    it('should display avatar for brands without logos', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const avatars = compiled.querySelectorAll('p-avatar');
      expect(avatars.length).toBeGreaterThanOrEqual(1);
    });

    it('should display created date for each brand', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Jan');
    });

    it('should have action buttons for each brand', () => {
      // Each row has 3 action buttons (edit, logo, delete)
      // Total buttons in action cells should be 3 brands * 3 buttons = 9
      // But they're rendered as p-button components
      const compiled = fixture.nativeElement as HTMLElement;
      // Count the number of table rows (excluding header)
      const dataRows = compiled.querySelectorAll('tbody tr');
      expect(dataRows.length).toBe(3);

      // Each row should have action buttons - check via button count in action cells
      const allActionButtons = compiled.querySelectorAll('td p-button');
      expect(allActionButtons.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('add brand dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should open add dialog when "Add Brand" button is clicked', () => {
      component.openAddDialog();
      expect(component.showAddDialog).toBe(true);
    });

    it('should clear form when opening add dialog', () => {
      component.newBrandName = 'Test';
      component.newBrandLogoFile = new File([''], 'test.png');
      component.newBrandLogoPreview = 'test-preview';

      component.openAddDialog();

      expect(component.newBrandName).toBe('');
      expect(component.newBrandLogoFile).toBeNull();
      expect(component.newBrandLogoPreview).toBeNull();
    });

    it('should close add dialog and reset state', () => {
      component.showAddDialog = true;
      component.newBrandName = 'Test';

      component.closeAddDialog();

      expect(component.showAddDialog).toBe(false);
      expect(component.newBrandName).toBe('');
    });

    it('should show warning when saving brand with empty name', fakeAsync(() => {
      component.newBrandName = '   ';

      component.saveBrand();
      tick();

      expect(mockToastService.warn).toHaveBeenCalledWith('Warning', 'Brand name is required');
      expect(mockBrandService.createBrand).not.toHaveBeenCalled();
    }));

    it('should create brand successfully', fakeAsync(() => {
      const newBrand: Brand = { id: 'brand-4', name: 'OnePlus', logoUrl: null, createdAt: '2024-01-04T00:00:00Z', updatedAt: null };
      mockBrandService.createBrand.and.returnValue(Promise.resolve(newBrand));

      component.showAddDialog = true;
      component.newBrandName = 'OnePlus';

      component.saveBrand();
      tick();

      expect(mockBrandService.createBrand).toHaveBeenCalledWith({ name: 'OnePlus', logoUrl: null });
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Brand created successfully');
      expect(component.showAddDialog).toBe(false);
    }));

    it('should upload logo when provided', fakeAsync(() => {
      const newBrand: Brand = { id: 'brand-4', name: 'OnePlus', logoUrl: 'https://example.com/oneplus.png', createdAt: '2024-01-04T00:00:00Z', updatedAt: null };
      mockBrandService.createBrand.and.returnValue(Promise.resolve(newBrand));
      mockBrandService.uploadLogo.and.returnValue(Promise.resolve('https://example.com/oneplus.png'));

      component.showAddDialog = true;
      component.newBrandName = 'OnePlus';
      component.newBrandLogoFile = new File([''], 'logo.png', { type: 'image/png' });

      component.saveBrand();
      tick();

      expect(mockBrandService.uploadLogo).toHaveBeenCalled();
      expect(mockBrandService.createBrand).toHaveBeenCalledWith({ name: 'OnePlus', logoUrl: 'https://example.com/oneplus.png' });
    }));

    it('should show error toast on create failure', fakeAsync(() => {
      mockBrandService.createBrand.and.returnValue(Promise.reject(new Error('Brand already exists')));

      component.newBrandName = 'Apple';
      component.saveBrand();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Brand already exists');
    }));

    it('should set saving state during brand creation', fakeAsync(() => {
      mockBrandService.createBrand.and.returnValue(new Promise(resolve => {
        setTimeout(() => resolve({ id: 'brand-4', name: 'OnePlus', logoUrl: null, createdAt: '2024-01-04T00:00:00Z', updatedAt: null }), 100);
      }));

      component.newBrandName = 'OnePlus';
      component.saveBrand();

      expect(component.saving()).toBe(true);

      tick(100);

      expect(component.saving()).toBe(false);
    }));
  });

  describe('inline editing', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should start editing a brand', () => {
      const brand = component.brands()[0];

      component.startEdit(brand);

      expect(brand.editing).toBe(true);
      expect(brand.editName).toBe('Apple');
    });

    it('should cancel only one edit at a time', () => {
      const brand1 = component.brands()[0];
      const brand2 = component.brands()[1];

      component.startEdit(brand1);
      component.startEdit(brand2);

      expect(brand1.editing).toBe(false);
      expect(brand2.editing).toBe(true);
    });

    it('should cancel editing', () => {
      const brand = component.brands()[0];
      component.startEdit(brand);

      component.cancelEdit(brand);

      expect(brand.editing).toBe(false);
      expect(brand.editName).toBeUndefined();
    });

    it('should not update if name is empty', fakeAsync(() => {
      const brand = component.brands()[0];
      component.startEdit(brand);
      brand.editName = '   ';

      component.saveEdit(brand);
      tick();

      expect(mockToastService.warn).toHaveBeenCalledWith('Warning', 'Brand name cannot be empty');
      expect(mockBrandService.updateBrand).not.toHaveBeenCalled();
    }));

    it('should not update if name is unchanged', fakeAsync(() => {
      const brand = component.brands()[0];
      component.startEdit(brand);
      brand.editName = 'Apple';

      component.saveEdit(brand);
      tick();

      expect(mockBrandService.updateBrand).not.toHaveBeenCalled();
      expect(brand.editing).toBe(false);
    }));

    it('should update brand name successfully', fakeAsync(() => {
      const brand = component.brands()[0];
      const updatedBrand: Brand = { ...brand, name: 'Apple Inc' };
      mockBrandService.updateBrand.and.returnValue(Promise.resolve(updatedBrand));

      component.startEdit(brand);
      brand.editName = 'Apple Inc';

      component.saveEdit(brand);
      tick();

      expect(mockBrandService.updateBrand).toHaveBeenCalledWith('brand-1', { name: 'Apple Inc' });
      expect(brand.name).toBe('Apple Inc');
      expect(brand.editing).toBe(false);
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Brand updated successfully');
    }));

    it('should show error on update failure', fakeAsync(() => {
      const brand = component.brands()[0];
      mockBrandService.updateBrand.and.returnValue(Promise.reject(new Error('Update failed')));

      component.startEdit(brand);
      brand.editName = 'Apple Inc';

      component.saveEdit(brand);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Update failed');
    }));

    it('should set savingId during update', fakeAsync(() => {
      const brand = component.brands()[0];
      mockBrandService.updateBrand.and.returnValue(new Promise(resolve => {
        setTimeout(() => resolve({ ...brand, name: 'Apple Inc' }), 100);
      }));

      component.startEdit(brand);
      brand.editName = 'Apple Inc';
      component.saveEdit(brand);

      expect(component.savingId()).toBe('brand-1');

      tick(100);

      expect(component.savingId()).toBeNull();
    }));
  });

  describe('logo management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should open logo dialog', () => {
      const brand = component.brands()[0];

      component.openLogoDialog(brand);

      expect(component.showLogoDialog).toBe(true);
      expect(component.selectedBrand).toBe(brand);
    });

    it('should close logo dialog', () => {
      const brand = component.brands()[0];
      component.openLogoDialog(brand);

      component.closeLogoDialog();

      expect(component.showLogoDialog).toBe(false);
      expect(component.selectedBrand).toBeNull();
    });

    it('should upload new logo', fakeAsync(() => {
      const brand = component.brands()[0];
      mockBrandService.uploadLogo.and.returnValue(Promise.resolve('https://example.com/new-apple.png'));
      mockBrandService.updateBrand.and.returnValue(Promise.resolve({ ...brand, logoUrl: 'https://example.com/new-apple.png' }));
      mockBrandService.deleteLogo.and.returnValue(Promise.resolve());

      component.openLogoDialog(brand);
      const file = new File([''], 'logo.png', { type: 'image/png' });
      component.uploadBrandLogo({ files: [file] } as any);
      tick();

      expect(mockBrandService.uploadLogo).toHaveBeenCalledWith(file);
      expect(mockBrandService.updateBrand).toHaveBeenCalledWith('brand-1', { logoUrl: 'https://example.com/new-apple.png' });
      expect(mockBrandService.deleteLogo).toHaveBeenCalledWith('https://example.com/apple.png');
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Logo updated successfully');
    }));

    it('should remove logo', fakeAsync(() => {
      const brand = component.brands()[0];
      mockBrandService.updateBrand.and.returnValue(Promise.resolve({ ...brand, logoUrl: null }));
      mockBrandService.deleteLogo.and.returnValue(Promise.resolve());

      component.openLogoDialog(brand);
      component.removeBrandLogo();
      tick();

      expect(mockBrandService.updateBrand).toHaveBeenCalledWith('brand-1', { logoUrl: null });
      expect(mockBrandService.deleteLogo).toHaveBeenCalledWith('https://example.com/apple.png');
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Logo removed successfully');
    }));

    it('should not remove logo if brand has no logo', fakeAsync(() => {
      const brand = component.brands()[1]; // Samsung has no logo
      component.openLogoDialog(brand);

      component.removeBrandLogo();
      tick();

      expect(mockBrandService.updateBrand).not.toHaveBeenCalled();
    }));

    it('should show error on upload failure', fakeAsync(() => {
      const brand = component.brands()[0];
      mockBrandService.uploadLogo.and.returnValue(Promise.reject(new Error('Upload failed')));

      component.openLogoDialog(brand);
      const file = new File([''], 'logo.png', { type: 'image/png' });
      component.uploadBrandLogo({ files: [file] } as any);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Upload failed');
    }));
  });

  describe('delete brand', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show confirmation dialog before delete', fakeAsync(() => {
      mockBrandService.deleteBrand.and.returnValue(Promise.resolve());
      const brand = component.brands()[0];

      component.confirmDelete(brand);
      tick();

      expect(mockConfirmService.confirmDelete).toHaveBeenCalledWith('brand', 'Apple');
    }));

    it('should not delete if confirmation is cancelled', fakeAsync(() => {
      mockConfirmService.confirmDelete.and.returnValue(Promise.resolve(false));
      const brand = component.brands()[0];

      component.confirmDelete(brand);
      tick();

      expect(mockBrandService.deleteBrand).not.toHaveBeenCalled();
    }));

    it('should delete brand and logo', fakeAsync(() => {
      mockBrandService.deleteBrand.and.returnValue(Promise.resolve());
      mockBrandService.deleteLogo.and.returnValue(Promise.resolve());
      const brand = component.brands()[0];
      const initialCount = component.brands().length;

      component.confirmDelete(brand);
      tick();

      expect(mockBrandService.deleteLogo).toHaveBeenCalledWith('https://example.com/apple.png');
      expect(mockBrandService.deleteBrand).toHaveBeenCalledWith('brand-1');
      expect(component.brands().length).toBe(initialCount - 1);
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Brand deleted successfully');
    }));

    it('should delete brand without logo', fakeAsync(() => {
      mockBrandService.deleteBrand.and.returnValue(Promise.resolve());
      const brand = component.brands()[1]; // Samsung has no logo

      component.confirmDelete(brand);
      tick();

      expect(mockBrandService.deleteLogo).not.toHaveBeenCalled();
      expect(mockBrandService.deleteBrand).toHaveBeenCalledWith('brand-2');
    }));

    it('should show error on delete failure', fakeAsync(() => {
      mockBrandService.deleteBrand.and.returnValue(Promise.reject(new Error('Cannot delete brand: 5 phone(s) are using this brand')));
      const brand = component.brands()[0];

      component.confirmDelete(brand);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Cannot delete brand: 5 phone(s) are using this brand');
    }));

    it('should set deletingId during deletion', fakeAsync(() => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>(resolve => {
        resolveDelete = resolve;
      });
      mockBrandService.deleteBrand.and.returnValue(deletePromise);
      const brand = component.brands()[0];

      // Start the delete
      component.confirmDelete(brand);
      tick(); // Allow the confirmation to resolve

      expect(component.deletingId()).toBe('brand-1');

      // Complete the delete
      resolveDelete!();
      tick();

      expect(component.deletingId()).toBeNull();
    }));
  });

  describe('logo preview in add dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should set logo file and preview on selection', fakeAsync(() => {
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      const mockFileReader = {
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(function(this: FileReader) {
          setTimeout(() => {
            if (mockFileReader.onload) {
              mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } } as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
        result: 'data:image/png;base64,test'
      };
      spyOn(window, 'FileReader').and.returnValue(mockFileReader as unknown as FileReader);

      component.onLogoSelect({ files: [file] } as any);
      tick();

      expect(component.newBrandLogoFile).toBe(file);
      expect(component.newBrandLogoPreview).toBe('data:image/png;base64,test');
    }));

    it('should clear logo on clearNewLogo', () => {
      component.newBrandLogoFile = new File([''], 'logo.png');
      component.newBrandLogoPreview = 'test-preview';

      component.clearNewLogo();

      expect(component.newBrandLogoFile).toBeNull();
      expect(component.newBrandLogoPreview).toBeNull();
    });
  });

  describe('focus management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should save trigger element on dialog show', () => {
      component.onDialogShow();
      expect(mockFocusService.saveTriggerElement).toHaveBeenCalled();
    });

    it('should restore focus on dialog hide', () => {
      component.onDialogHide();
      expect(mockFocusService.restoreFocus).toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    it('should show paginator when more than 10 brands', fakeAsync(() => {
      const manyBrands = Array.from({ length: 15 }, (_, i) => ({
        id: `brand-${i}`,
        name: `Brand ${i}`,
        logoUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      }));
      mockBrandService.getBrands.and.returnValue(Promise.resolve(manyBrands));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.p-paginator')).toBeTruthy();
    }));

    it('should not show paginator when 10 or fewer brands', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.p-paginator')).toBeFalsy();
    }));
  });

  describe('accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have proper dialog roles', () => {
      component.openAddDialog();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dialog = compiled.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should have proper button tooltips', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[ptooltip="Edit Name"]')).toBeTruthy();
      expect(compiled.querySelector('[ptooltip="Change Logo"]')).toBeTruthy();
      expect(compiled.querySelector('[ptooltip="Delete"]')).toBeTruthy();
    });
  });
});
