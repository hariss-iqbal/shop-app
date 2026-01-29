import { TestBed } from '@angular/core/testing';
import { PhoneImageService } from './phone-image.service';
import { SupabaseService } from './supabase.service';

describe('PhoneImageService', () => {
  let service: PhoneImageService;
  let mockSupabaseService: any;

  const mockImageData = {
    id: 'img-1',
    phone_id: 'phone-1',
    image_url: 'https://example.com/storage/phone-images/phone-1/test.jpg',
    storage_path: 'phone-1/test.jpg',
    is_primary: true,
    display_order: 0,
    created_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    mockSupabaseService = {
      from: jasmine.createSpy('from'),
      storage: {
        from: jasmine.createSpy('storageFrom')
      }
    };

    TestBed.configureTestingModule({
      providers: [
        PhoneImageService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(PhoneImageService);
  });

  describe('validateFile', () => {
    it('should accept valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid WebP file', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid file type (GIF)', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject invalid file type (BMP)', () => {
      const file = new File(['test'], 'test.bmp', { type: 'image/bmp' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file exceeding 5MB', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed (5MB)');
    });

    it('should accept file exactly at 5MB limit', () => {
      const content = new Array(5 * 1024 * 1024).fill('x').join('');
      const file = new File([content], 'max.jpg', { type: 'image/jpeg' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject file just over 5MB limit', () => {
      const content = new Array(5 * 1024 * 1024 + 1).fill('x').join('');
      const file = new File([content], 'over.jpg', { type: 'image/jpeg' });
      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('uploadImage', () => {
    it('should validate file before uploading', async () => {
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });

      await expectAsync(service.uploadImage('phone-1', invalidFile))
        .toBeRejectedWithError(/Invalid file type/);

      expect(mockSupabaseService.storage.from).not.toHaveBeenCalled();
    });
  });

  describe('getImagesByPhoneId', () => {
    it('should fetch images ordered by display_order', async () => {
      mockSupabaseService.from.and.returnValue({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: [mockImageData],
              error: null,
              count: 1
            })
          })
        })
      });

      const result = await service.getImagesByPhoneId('phone-1');

      expect(mockSupabaseService.from).toHaveBeenCalledWith('phone_images');
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should map database fields to TypeScript properties', async () => {
      mockSupabaseService.from.and.returnValue({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: [mockImageData],
              error: null,
              count: 1
            })
          })
        })
      });

      const result = await service.getImagesByPhoneId('phone-1');
      const image = result.data[0];

      expect(image.id).toBe('img-1');
      expect(image.phoneId).toBe('phone-1');
      expect(image.imageUrl).toBe('https://example.com/storage/phone-images/phone-1/test.jpg');
      expect(image.storagePath).toBe('phone-1/test.jpg');
      expect(image.isPrimary).toBe(true);
      expect(image.displayOrder).toBe(0);
    });

    it('should throw error on query failure', async () => {
      mockSupabaseService.from.and.returnValue({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: null,
              error: { message: 'Query failed' },
              count: 0
            })
          })
        })
      });

      await expectAsync(service.getImagesByPhoneId('phone-1'))
        .toBeRejectedWithError('Query failed');
    });
  });

  describe('getImageById', () => {
    it('should fetch single image by id', async () => {
      mockSupabaseService.from.and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockImageData, error: null })
          })
        })
      });

      const result = await service.getImageById('img-1');

      expect(result?.id).toBe('img-1');
    });

    it('should return null when image not found', async () => {
      mockSupabaseService.from.and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
          })
        })
      });

      const result = await service.getImageById('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error on other failures', async () => {
      mockSupabaseService.from.and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { code: 'OTHER', message: 'Database error' } })
          })
        })
      });

      await expectAsync(service.getImageById('img-1'))
        .toBeRejectedWithError('Database error');
    });
  });

  describe('updateImage', () => {
    it('should update image properties', async () => {
      const updatedImageData = {
        ...mockImageData,
        display_order: 5
      };

      mockSupabaseService.from.and.returnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedImageData, error: null })
            })
          })
        })
      });

      const result = await service.updateImage('img-1', { displayOrder: 5 });

      expect(result.displayOrder).toBe(5);
    });

    it('should throw error on update failure', async () => {
      mockSupabaseService.from.and.returnValue({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'Update failed' } })
            })
          })
        })
      });

      await expectAsync(service.updateImage('img-1', { isPrimary: true }))
        .toBeRejectedWithError('Update failed');
    });
  });
});
