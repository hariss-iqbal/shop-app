import { TestBed } from '@angular/core/testing';
import { BrandService } from './brand.service';
import { SupabaseService } from './supabase.service';
import { CreateBrandRequest, UpdateBrandRequest } from '../../models/brand.model';

describe('BrandService', () => {
  let service: BrandService;
  let mockSupabaseService: any;
  let mockFrom: jasmine.Spy;
  let mockStorage: any;

  const mockBrandsData = [
    { id: 'brand-1', name: 'Apple', logo_url: 'https://example.com/apple.png', created_at: '2024-01-01T00:00:00Z', updated_at: null },
    { id: 'brand-2', name: 'Samsung', logo_url: null, created_at: '2024-01-02T00:00:00Z', updated_at: null },
    { id: 'brand-3', name: 'Google', logo_url: 'https://example.com/google.png', created_at: '2024-01-03T00:00:00Z', updated_at: null }
  ];

  beforeEach(() => {
    mockStorage = {
      from: jasmine.createSpy('storage.from').and.returnValue({
        upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve({ error: null })),
        getPublicUrl: jasmine.createSpy('getPublicUrl').and.returnValue({ data: { publicUrl: 'https://storage.example.com/test.png' } }),
        remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve({ error: null }))
      })
    };

    mockFrom = jasmine.createSpy('from').and.callFake((_table: string) => ({
      select: jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(Promise.resolve({ data: mockBrandsData, error: null })),
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: mockBrandsData[0], error: null }))
        }),
        ilike: jasmine.createSpy('ilike').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            limit: jasmine.createSpy('limit').and.returnValue(Promise.resolve({ data: mockBrandsData.slice(0, 2), error: null }))
          })
        })
      }),
      insert: jasmine.createSpy('insert').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: { id: 'brand-new', name: 'NewBrand', logo_url: null, created_at: '2024-01-04T00:00:00Z', updated_at: null }, error: null }))
        })
      }),
      update: jasmine.createSpy('update').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: { id: 'brand-1', name: 'Updated Apple', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' }, error: null }))
          })
        })
      }),
      delete: jasmine.createSpy('delete').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
      })
    }));

    mockSupabaseService = {
      from: mockFrom,
      storage: mockStorage
    };

    TestBed.configureTestingModule({
      providers: [
        BrandService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(BrandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBrands', () => {
    it('should return all brands ordered by name', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(Promise.resolve({ data: mockBrandsData, error: null }))
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const brands = await service.getBrands();

      expect(mockFrom).toHaveBeenCalledWith('brands');
      expect(brands.length).toBe(3);
      expect(brands[0].name).toBe('Apple');
      expect(brands[0].logoUrl).toBe('https://example.com/apple.png');
    });

    it('should throw error when fetch fails', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(Promise.resolve({ data: null, error: { message: 'Database error' } }))
      });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getBrands()).toBeRejectedWithError('Database error');
    });

    it('should return empty array when no brands exist', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(Promise.resolve({ data: [], error: null }))
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const brands = await service.getBrands();

      expect(brands).toEqual([]);
    });
  });

  describe('searchBrands', () => {
    it('should search brands by query', async () => {
      const ilikeSpy = jasmine.createSpy('ilike').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue({
          limit: jasmine.createSpy('limit').and.returnValue(Promise.resolve({ data: [mockBrandsData[0]], error: null }))
        })
      });
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        ilike: ilikeSpy
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const brands = await service.searchBrands('App');

      expect(ilikeSpy).toHaveBeenCalledWith('name', '%App%');
      expect(brands.length).toBe(1);
      expect(brands[0].name).toBe('Apple');
    });

    it('should limit search results to 20', async () => {
      const limitSpy = jasmine.createSpy('limit').and.returnValue(Promise.resolve({ data: mockBrandsData, error: null }));
      const ilikeSpy = jasmine.createSpy('ilike').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue({
          limit: limitSpy
        })
      });
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        ilike: ilikeSpy
      });
      mockFrom.and.returnValue({ select: selectSpy });

      await service.searchBrands('test');

      expect(limitSpy).toHaveBeenCalledWith(20);
    });
  });

  describe('getBrandById', () => {
    it('should return brand by id', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: mockBrandsData[0], error: null }));
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const brand = await service.getBrandById('brand-1');

      expect(eqSpy).toHaveBeenCalledWith('id', 'brand-1');
      expect(brand?.name).toBe('Apple');
    });

    it('should return null when brand not found', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } }));
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const brand = await service.getBrandById('non-existent');

      expect(brand).toBeNull();
    });

    it('should throw error for non-PGRST116 errors', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: { code: 'OTHER', message: 'Some error' } }));
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      await expectAsync(service.getBrandById('brand-1')).toBeRejectedWithError('Some error');
    });
  });

  describe('getBrandByName', () => {
    it('should return brand by name', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: mockBrandsData[0], error: null }));
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const brand = await service.getBrandByName('Apple');

      expect(eqSpy).toHaveBeenCalledWith('name', 'Apple');
      expect(brand?.id).toBe('brand-1');
    });

    it('should return null when brand name not found', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } }));
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ single: singleSpy });
      const selectSpy = jasmine.createSpy('select').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ select: selectSpy });

      const brand = await service.getBrandByName('NonExistent');

      expect(brand).toBeNull();
    });
  });

  describe('createBrand', () => {
    it('should create a new brand', async () => {
      // Mock getBrandByName to return null (no existing brand)
      const getBrandByNameSpy = spyOn(service, 'getBrandByName').and.returnValue(Promise.resolve(null));

      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: { id: 'brand-new', name: 'NewBrand', logo_url: null, created_at: '2024-01-04T00:00:00Z', updated_at: null },
        error: null
      }));
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const insertSpy = jasmine.createSpy('insert').and.returnValue({ select: selectSpy });
      mockFrom.and.returnValue({ insert: insertSpy });

      const request: CreateBrandRequest = { name: 'NewBrand', logoUrl: null };
      const brand = await service.createBrand(request);

      expect(getBrandByNameSpy).toHaveBeenCalledWith('NewBrand');
      expect(insertSpy).toHaveBeenCalledWith({ name: 'NewBrand', logo_url: null });
      expect(brand.name).toBe('NewBrand');
    });

    it('should throw error if brand already exists', async () => {
      spyOn(service, 'getBrandByName').and.returnValue(Promise.resolve({
        id: 'brand-1',
        name: 'Apple',
        logoUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      }));

      const request: CreateBrandRequest = { name: 'Apple', logoUrl: null };

      await expectAsync(service.createBrand(request)).toBeRejectedWithError('Brand "Apple" already exists');
    });

    it('should trim brand name', async () => {
      spyOn(service, 'getBrandByName').and.returnValue(Promise.resolve(null));

      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: { id: 'brand-new', name: 'NewBrand', logo_url: null, created_at: '2024-01-04T00:00:00Z', updated_at: null },
        error: null
      }));
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const insertSpy = jasmine.createSpy('insert').and.returnValue({ select: selectSpy });
      mockFrom.and.returnValue({ insert: insertSpy });

      const request: CreateBrandRequest = { name: '  NewBrand  ', logoUrl: null };
      await service.createBrand(request);

      expect(insertSpy).toHaveBeenCalledWith({ name: 'NewBrand', logo_url: null });
    });

    it('should include logo URL when provided', async () => {
      spyOn(service, 'getBrandByName').and.returnValue(Promise.resolve(null));

      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: { id: 'brand-new', name: 'NewBrand', logo_url: 'https://example.com/logo.png', created_at: '2024-01-04T00:00:00Z', updated_at: null },
        error: null
      }));
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const insertSpy = jasmine.createSpy('insert').and.returnValue({ select: selectSpy });
      mockFrom.and.returnValue({ insert: insertSpy });

      const request: CreateBrandRequest = { name: 'NewBrand', logoUrl: 'https://example.com/logo.png' };
      await service.createBrand(request);

      expect(insertSpy).toHaveBeenCalledWith({ name: 'NewBrand', logo_url: 'https://example.com/logo.png' });
    });
  });

  describe('updateBrand', () => {
    it('should update brand name', async () => {
      spyOn(service, 'getBrandByName').and.returnValue(Promise.resolve(null));

      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: { id: 'brand-1', name: 'Updated Apple', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' },
        error: null
      }));
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ select: selectSpy });
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ update: updateSpy });

      const request: UpdateBrandRequest = { name: 'Updated Apple' };
      const brand = await service.updateBrand('brand-1', request);

      expect(updateSpy).toHaveBeenCalledWith({ name: 'Updated Apple' });
      expect(eqSpy).toHaveBeenCalledWith('id', 'brand-1');
      expect(brand.name).toBe('Updated Apple');
    });

    it('should throw error if new name conflicts with existing brand', async () => {
      spyOn(service, 'getBrandByName').and.returnValue(Promise.resolve({
        id: 'brand-2',
        name: 'Samsung',
        logoUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      }));

      const request: UpdateBrandRequest = { name: 'Samsung' };

      await expectAsync(service.updateBrand('brand-1', request)).toBeRejectedWithError('Brand "Samsung" already exists');
    });

    it('should allow updating to same name (no conflict)', async () => {
      spyOn(service, 'getBrandByName').and.returnValue(Promise.resolve({
        id: 'brand-1',
        name: 'Apple',
        logoUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      }));

      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: { id: 'brand-1', name: 'Apple', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' },
        error: null
      }));
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ select: selectSpy });
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ update: updateSpy });

      const request: UpdateBrandRequest = { name: 'Apple' };
      const brand = await service.updateBrand('brand-1', request);

      expect(brand).toBeTruthy();
    });

    it('should update logo URL only', async () => {
      const singleSpy = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: { id: 'brand-1', name: 'Apple', logo_url: 'https://example.com/new-logo.png', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' },
        error: null
      }));
      const selectSpy = jasmine.createSpy('select').and.returnValue({ single: singleSpy });
      const eqSpy = jasmine.createSpy('eq').and.returnValue({ select: selectSpy });
      const updateSpy = jasmine.createSpy('update').and.returnValue({ eq: eqSpy });
      mockFrom.and.returnValue({ update: updateSpy });

      const request: UpdateBrandRequest = { logoUrl: 'https://example.com/new-logo.png' };
      await service.updateBrand('brand-1', request);

      expect(updateSpy).toHaveBeenCalledWith({ logo_url: 'https://example.com/new-logo.png' });
    });
  });

  describe('deleteBrand', () => {
    it('should delete brand when no phones reference it', async () => {
      const phonesSelectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 0 }))
      });

      const deleteEqSpy = jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }));
      const deleteSpy = jasmine.createSpy('delete').and.returnValue({ eq: deleteEqSpy });

      mockFrom.and.callFake((table: string) => {
        if (table === 'phones') {
          return { select: phonesSelectSpy };
        }
        return { delete: deleteSpy };
      });

      await service.deleteBrand('brand-1');

      expect(deleteEqSpy).toHaveBeenCalledWith('id', 'brand-1');
    });

    it('should throw error when brand has associated phones', async () => {
      const phonesSelectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 5 }))
      });

      mockFrom.and.callFake((table: string) => {
        if (table === 'phones') {
          return { select: phonesSelectSpy };
        }
        return {};
      });

      await expectAsync(service.deleteBrand('brand-1')).toBeRejectedWithError('Cannot delete brand: 5 phone(s) are using this brand');
    });

    it('should throw error on delete failure', async () => {
      const phonesSelectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 0 }))
      });

      const deleteEqSpy = jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: { message: 'Delete failed' } }));
      const deleteSpy = jasmine.createSpy('delete').and.returnValue({ eq: deleteEqSpy });

      mockFrom.and.callFake((table: string) => {
        if (table === 'phones') {
          return { select: phonesSelectSpy };
        }
        return { delete: deleteSpy };
      });

      await expectAsync(service.deleteBrand('brand-1')).toBeRejectedWithError('Delete failed');
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo file and return public URL', async () => {
      const file = new File(['test'], 'logo.png', { type: 'image/png' });

      const url = await service.uploadLogo(file);

      expect(mockStorage.from).toHaveBeenCalledWith('phone-images');
      expect(url).toBe('https://storage.example.com/test.png');
    });

    it('should throw error for invalid file type', async () => {
      const file = new File(['test'], 'logo.gif', { type: 'image/gif' });

      await expectAsync(service.uploadLogo(file)).toBeRejectedWithError('Invalid file type. Allowed: JPG, PNG, WebP');
    });

    it('should throw error for file exceeding size limit', async () => {
      const largeContent = new Array(3 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'logo.png', { type: 'image/png' });

      await expectAsync(service.uploadLogo(file)).toBeRejectedWithError('File size must be less than 2MB');
    });

    it('should accept JPG files', async () => {
      const file = new File(['test'], 'logo.jpg', { type: 'image/jpeg' });

      const url = await service.uploadLogo(file);

      expect(url).toBeTruthy();
    });

    it('should accept JPEG files', async () => {
      const file = new File(['test'], 'logo.jpeg', { type: 'image/jpeg' });

      const url = await service.uploadLogo(file);

      expect(url).toBeTruthy();
    });

    it('should accept WebP files', async () => {
      const file = new File(['test'], 'logo.webp', { type: 'image/webp' });

      const url = await service.uploadLogo(file);

      expect(url).toBeTruthy();
    });

    it('should throw error on upload failure', async () => {
      mockStorage.from.and.returnValue({
        upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve({ error: { message: 'Upload failed' } })),
        getPublicUrl: jasmine.createSpy('getPublicUrl')
      });

      const file = new File(['test'], 'logo.png', { type: 'image/png' });

      await expectAsync(service.uploadLogo(file)).toBeRejectedWithError('Upload failed');
    });
  });

  describe('deleteLogo', () => {
    it('should delete logo from storage', async () => {
      const removeSpy = jasmine.createSpy('remove').and.returnValue(Promise.resolve({ error: null }));
      mockStorage.from.and.returnValue({ remove: removeSpy });

      await service.deleteLogo('https://storage.example.com/phone-images/brand-logos/test.png');

      expect(mockStorage.from).toHaveBeenCalledWith('phone-images');
      expect(removeSpy).toHaveBeenCalledWith(['brand-logos/test.png']);
    });

    it('should handle storage path extraction correctly', async () => {
      const removeSpy = jasmine.createSpy('remove').and.returnValue(Promise.resolve({ error: null }));
      mockStorage.from.and.returnValue({ remove: removeSpy });

      await service.deleteLogo('https://supabase.example.com/storage/v1/object/public/phone-images/brand-logos/12345-logo.png');

      expect(removeSpy).toHaveBeenCalledWith(['brand-logos/12345-logo.png']);
    });

    it('should not throw on delete failure (logs error instead)', async () => {
      const consoleSpy = spyOn(console, 'error');
      const removeSpy = jasmine.createSpy('remove').and.returnValue(Promise.resolve({ error: { message: 'Delete failed' } }));
      mockStorage.from.and.returnValue({ remove: removeSpy });

      await service.deleteLogo('https://storage.example.com/phone-images/test.png');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle URLs without valid path', async () => {
      const removeSpy = jasmine.createSpy('remove').and.returnValue(Promise.resolve({ error: null }));
      mockStorage.from.and.returnValue({ remove: removeSpy });

      await service.deleteLogo('https://example.com/other-path/test.png');

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('mapToBrand', () => {
    it('should correctly map database fields to Brand model', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(Promise.resolve({
          data: [{ id: 'brand-1', name: 'Apple', logo_url: 'https://example.com/logo.png', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' }],
          error: null
        }))
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const brands = await service.getBrands();

      expect(brands[0]).toEqual({
        id: 'brand-1',
        name: 'Apple',
        logoUrl: 'https://example.com/logo.png',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      });
    });

    it('should handle null logo_url', async () => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(Promise.resolve({
          data: [{ id: 'brand-1', name: 'Apple', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: null }],
          error: null
        }))
      });
      mockFrom.and.returnValue({ select: selectSpy });

      const brands = await service.getBrands();

      expect(brands[0].logoUrl).toBeNull();
    });
  });
});
