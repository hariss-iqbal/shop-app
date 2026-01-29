import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PhoneImageUploadComponent } from './phone-image-upload.component';
import { PhoneImageService } from '../../../../core/services/phone-image.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { PhoneImage } from '../../../../models/phone-image.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

describe('PhoneImageUploadComponent', () => {
  let component: PhoneImageUploadComponent;
  let fixture: ComponentFixture<PhoneImageUploadComponent>;
  let mockPhoneImageService: jasmine.SpyObj<PhoneImageService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmDialogService: jasmine.SpyObj<ConfirmDialogService>;

  const mockImages: PhoneImage[] = [
    {
      id: 'img-1',
      phoneId: 'phone-1',
      imageUrl: 'https://example.com/image1.jpg',
      storagePath: 'phone-1/image1.jpg',
      isPrimary: true,
      displayOrder: 0,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'img-2',
      phoneId: 'phone-1',
      imageUrl: 'https://example.com/image2.jpg',
      storagePath: 'phone-1/image2.jpg',
      isPrimary: false,
      displayOrder: 1,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockPhoneImageService = jasmine.createSpyObj('PhoneImageService', [
      'getImagesByPhoneId',
      'uploadImage',
      'uploadMultipleImages',
      'setPrimary',
      'reorderImages',
      'deleteImage',
      'validateFile'
    ]);

    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    mockConfirmDialogService = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete']);

    mockPhoneImageService.getImagesByPhoneId.and.returnValue(
      Promise.resolve({ data: mockImages, total: 2 })
    );
    mockPhoneImageService.validateFile.and.returnValue({ valid: true });
    mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [PhoneImageUploadComponent, NoopAnimationsModule],
      providers: [
        { provide: PhoneImageService, useValue: mockPhoneImageService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PhoneImageUploadComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load images when phoneId is provided', fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();

      expect(mockPhoneImageService.getImagesByPhoneId).toHaveBeenCalledWith('phone-1');
      expect(component.images().length).toBe(2);
    }));

    it('should not load images when phoneId is null', fakeAsync(() => {
      component.phoneId = null;
      fixture.detectChanges();
      tick();

      expect(mockPhoneImageService.getImagesByPhoneId).not.toHaveBeenCalled();
      expect(component.images().length).toBe(0);
    }));

    it('should display "No images uploaded yet" when empty', fakeAsync(() => {
      mockPhoneImageService.getImagesByPhoneId.and.returnValue(
        Promise.resolve({ data: [], total: 0 })
      );
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No images uploaded yet');
    }));

    it('should display image count when images exist', fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Images (2)');
    }));
  });

  describe('drag and drop upload', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should set isDragOver on dragover event', () => {
      const event = new DragEvent('dragover', { cancelable: true });
      const dropZone = fixture.nativeElement.querySelector('.border-dashed');
      dropZone.dispatchEvent(event);

      expect(component.isDragOver()).toBe(true);
    });

    it('should clear isDragOver on dragleave event', () => {
      component.isDragOver.set(true);
      const event = new DragEvent('dragleave', { cancelable: true });
      const dropZone = fixture.nativeElement.querySelector('.border-dashed');
      dropZone.dispatchEvent(event);

      expect(component.isDragOver()).toBe(false);
    });

    it('should process valid files on drop', fakeAsync(() => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      mockPhoneImageService.uploadMultipleImages.and.returnValue(
        Promise.resolve([mockImages[0]])
      );

      const event = new DragEvent('drop', {
        cancelable: true,
        dataTransfer
      });

      component.onDrop(event);
      tick();

      expect(mockPhoneImageService.uploadMultipleImages).toHaveBeenCalled();
    }));
  });

  describe('file validation', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should reject files exceeding 5MB', fakeAsync(() => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      mockPhoneImageService.validateFile.and.returnValue({
        valid: false,
        error: 'File size (6.00MB) exceeds maximum allowed (5MB)'
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(largeFile);

      const event = new DragEvent('drop', {
        cancelable: true,
        dataTransfer
      });

      component.onDrop(event);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Invalid File',
        jasmine.stringMatching(/exceeds maximum/)
      );
      expect(mockPhoneImageService.uploadMultipleImages).not.toHaveBeenCalled();
    }));

    it('should reject invalid file types', fakeAsync(() => {
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });
      mockPhoneImageService.validateFile.and.returnValue({
        valid: false,
        error: 'Invalid file type: image/gif. Allowed types: JPEG, PNG, WebP'
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(invalidFile);

      const event = new DragEvent('drop', {
        cancelable: true,
        dataTransfer
      });

      component.onDrop(event);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Invalid File',
        jasmine.stringMatching(/Invalid file type/)
      );
    }));

    it('should accept valid file types (JPEG, PNG, WebP)', fakeAsync(() => {
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });

      mockPhoneImageService.validateFile.and.returnValue({ valid: true });
      mockPhoneImageService.uploadMultipleImages.and.returnValue(Promise.resolve(mockImages));

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(jpegFile);
      dataTransfer.items.add(pngFile);
      dataTransfer.items.add(webpFile);

      const event = new DragEvent('drop', {
        cancelable: true,
        dataTransfer
      });

      component.onDrop(event);
      tick();

      expect(mockPhoneImageService.uploadMultipleImages).toHaveBeenCalled();
    }));
  });

  describe('file selection via picker', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should process files selected via file picker', fakeAsync(() => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      mockPhoneImageService.uploadMultipleImages.and.returnValue(
        Promise.resolve([mockImages[0]])
      );

      const event = {
        target: {
          files: [file],
          value: 'test.jpg'
        }
      } as unknown as Event;

      component.onFileSelect(event);
      tick();

      expect(mockPhoneImageService.uploadMultipleImages).toHaveBeenCalled();
    }));

    it('should clear file input after selection', fakeAsync(() => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      mockPhoneImageService.uploadMultipleImages.and.returnValue(
        Promise.resolve([mockImages[0]])
      );

      const input = { files: [file], value: 'test.jpg' };
      const event = { target: input } as unknown as Event;

      component.onFileSelect(event);
      tick();

      expect(input.value).toBe('');
    }));
  });

  describe('upload progress', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should show upload progress for each file', fakeAsync(() => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockPhoneImageService.uploadMultipleImages.and.callFake(
        async (_phoneId, _files, onProgress) => {
          onProgress?.('test.jpg', {
            fileName: 'test.jpg',
            progress: 50,
            status: 'uploading'
          });
          return [mockImages[0]];
        }
      );

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new DragEvent('drop', {
        cancelable: true,
        dataTransfer
      });

      component.onDrop(event);
      tick();
      fixture.detectChanges();

      // Upload progress should be tracked
      const upload = component.uploading().find(u => u.file.name === 'test.jpg');
      expect(upload?.progress.progress).toBe(50);
    }));

    it('should show success toast on successful upload', fakeAsync(() => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockPhoneImageService.uploadMultipleImages.and.returnValue(
        Promise.resolve([mockImages[0]])
      );

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new DragEvent('drop', {
        cancelable: true,
        dataTransfer
      });

      component.onDrop(event);
      tick(2000); // Wait for the setTimeout that clears upload state

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Upload Complete',
        '1 image(s) uploaded successfully'
      );
    }));
  });

  describe('set as primary', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should set image as primary', fakeAsync(() => {
      mockPhoneImageService.setPrimary.and.returnValue(
        Promise.resolve({ ...mockImages[1], isPrimary: true })
      );

      component.onSetPrimary(mockImages[1]);
      tick();

      expect(mockPhoneImageService.setPrimary).toHaveBeenCalledWith('img-2');
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Primary image updated');
    }));

    it('should update local images state after setting primary', fakeAsync(() => {
      mockPhoneImageService.setPrimary.and.returnValue(
        Promise.resolve({ ...mockImages[1], isPrimary: true })
      );

      component.onSetPrimary(mockImages[1]);
      tick();

      const images = component.images();
      expect(images.find(i => i.id === 'img-1')?.isPrimary).toBe(false);
      expect(images.find(i => i.id === 'img-2')?.isPrimary).toBe(true);
    }));

    it('should emit imagesChanged after setting primary', fakeAsync(() => {
      mockPhoneImageService.setPrimary.and.returnValue(
        Promise.resolve({ ...mockImages[1], isPrimary: true })
      );

      spyOn(component.imagesChanged, 'emit');

      component.onSetPrimary(mockImages[1]);
      tick();

      expect(component.imagesChanged.emit).toHaveBeenCalled();
    }));

    it('should show error toast on failure', fakeAsync(() => {
      mockPhoneImageService.setPrimary.and.returnValue(
        Promise.reject(new Error('Failed to set primary'))
      );

      component.onSetPrimary(mockImages[1]);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to set primary image');
    }));
  });

  describe('delete image', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should request confirmation before deleting', fakeAsync(() => {
      mockPhoneImageService.deleteImage.and.returnValue(Promise.resolve());

      component.onDelete(mockImages[0]);
      tick();

      expect(mockConfirmDialogService.confirmDelete).toHaveBeenCalledWith('image');
    }));

    it('should delete image after confirmation', fakeAsync(() => {
      mockPhoneImageService.deleteImage.and.returnValue(Promise.resolve());

      component.onDelete(mockImages[0]);
      tick();

      expect(mockPhoneImageService.deleteImage).toHaveBeenCalledWith('img-1');
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Image deleted');
    }));

    it('should not delete image if confirmation cancelled', fakeAsync(() => {
      mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(false));

      component.onDelete(mockImages[0]);
      tick();

      expect(mockPhoneImageService.deleteImage).not.toHaveBeenCalled();
    }));

    it('should remove image from local state after deletion', fakeAsync(() => {
      mockPhoneImageService.deleteImage.and.returnValue(Promise.resolve());

      component.onDelete(mockImages[0]);
      tick();

      expect(component.images().find(i => i.id === 'img-1')).toBeUndefined();
    }));

    it('should emit imagesChanged after deletion', fakeAsync(() => {
      mockPhoneImageService.deleteImage.and.returnValue(Promise.resolve());

      spyOn(component.imagesChanged, 'emit');

      component.onDelete(mockImages[0]);
      tick();

      expect(component.imagesChanged.emit).toHaveBeenCalled();
    }));

    it('should show error toast on deletion failure', fakeAsync(() => {
      mockPhoneImageService.deleteImage.and.returnValue(
        Promise.reject(new Error('Delete failed'))
      );

      component.onDelete(mockImages[0]);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to delete image');
    }));
  });

  describe('reorder images', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should reorder images on drag and drop', fakeAsync(() => {
      mockPhoneImageService.reorderImages.and.returnValue(Promise.resolve(mockImages));

      const event = {
        previousIndex: 0,
        currentIndex: 1,
        container: { data: mockImages },
        previousContainer: { data: mockImages },
        item: { data: mockImages[0] },
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop')
      } as CdkDragDrop<PhoneImage[]>;

      component.onImageDrop(event);
      tick();

      expect(mockPhoneImageService.reorderImages).toHaveBeenCalledWith('phone-1', {
        imageIds: ['img-2', 'img-1']
      });
    }));

    it('should not reorder if indices are the same', fakeAsync(() => {
      const event = {
        previousIndex: 0,
        currentIndex: 0,
        container: { data: mockImages },
        previousContainer: { data: mockImages }
      } as CdkDragDrop<PhoneImage[]>;

      component.onImageDrop(event);
      tick();

      expect(mockPhoneImageService.reorderImages).not.toHaveBeenCalled();
    }));

    it('should update local state optimistically', fakeAsync(() => {
      mockPhoneImageService.reorderImages.and.returnValue(Promise.resolve(mockImages));

      const event = {
        previousIndex: 0,
        currentIndex: 1,
        container: { data: mockImages },
        previousContainer: { data: mockImages }
      } as CdkDragDrop<PhoneImage[]>;

      component.onImageDrop(event);
      // Check state immediately before await completes
      expect(component.images()[0].id).toBe('img-2');
      expect(component.images()[1].id).toBe('img-1');

      tick();
    }));

    it('should emit imagesChanged after reorder', fakeAsync(() => {
      mockPhoneImageService.reorderImages.and.returnValue(Promise.resolve(mockImages));

      spyOn(component.imagesChanged, 'emit');

      const event = {
        previousIndex: 0,
        currentIndex: 1,
        container: { data: mockImages },
        previousContainer: { data: mockImages }
      } as CdkDragDrop<PhoneImage[]>;

      component.onImageDrop(event);
      tick();

      expect(component.imagesChanged.emit).toHaveBeenCalled();
    }));

    it('should reload images on reorder failure', fakeAsync(() => {
      mockPhoneImageService.reorderImages.and.returnValue(
        Promise.reject(new Error('Reorder failed'))
      );

      const event = {
        previousIndex: 0,
        currentIndex: 1,
        container: { data: mockImages },
        previousContainer: { data: mockImages }
      } as CdkDragDrop<PhoneImage[]>;

      component.onImageDrop(event);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to reorder images');
      expect(mockPhoneImageService.getImagesByPhoneId).toHaveBeenCalledTimes(2); // Initial + reload
    }));
  });

  describe('action blocking', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
    }));

    it('should disable buttons while action is in progress', fakeAsync(() => {
      // Start an action that takes time
      mockPhoneImageService.setPrimary.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockImages[1]), 500))
      );

      component.onSetPrimary(mockImages[1]);
      expect(component.actionInProgress()).toBe(true);

      tick(500);
      expect(component.actionInProgress()).toBe(false);
    }));
  });

  describe('warning for unsaved phone', () => {
    it('should show warning when trying to upload without phoneId', fakeAsync(() => {
      component.phoneId = null;
      fixture.detectChanges();
      tick();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new DragEvent('drop', {
        cancelable: true,
        dataTransfer
      });

      component.onDrop(event);
      tick();

      expect(mockToastService.warn).toHaveBeenCalledWith(
        'Warning',
        'Please save the phone record before uploading images'
      );
    }));
  });

  describe('cleanup', () => {
    it('should revoke object URLs on destroy', fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();

      // Mock an upload in progress with a preview URL
      const revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
      const mockPreviewUrl = 'blob:http://localhost/test';

      component.uploading.set([{
        file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        previewUrl: mockPreviewUrl,
        progress: { fileName: 'test.jpg', progress: 50, status: 'uploading' }
      }]);

      component.ngOnDestroy();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockPreviewUrl);
    }));
  });

  describe('display', () => {
    beforeEach(fakeAsync(() => {
      component.phoneId = 'phone-1';
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show primary badge on primary image', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const badges = compiled.querySelectorAll('p-badge');
      expect(badges.length).toBe(1);
      expect(badges[0].getAttribute('value')).toBe('Primary');
    });

    it('should show drag-to-reorder hint', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Drag to reorder');
    });

    it('should display supported formats in upload zone', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('JPEG, PNG, WebP');
      expect(compiled.textContent).toContain('5MB');
    });
  });
});
