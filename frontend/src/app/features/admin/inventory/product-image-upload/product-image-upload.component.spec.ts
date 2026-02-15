import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProductImageUploadComponent } from './product-image-upload.component';
import { ProductImageService } from '../../../../core/services/product-image.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { ProductImage } from '../../../../models/product-image.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

describe('ProductImageUploadComponent', () => {
  let component: ProductImageUploadComponent;
  let fixture: ComponentFixture<ProductImageUploadComponent>;
  let mockProductImageService: jasmine.SpyObj<ProductImageService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmDialogService: jasmine.SpyObj<ConfirmDialogService>;

  const mockImages: ProductImage[] = [
    {
      id: 'img-1',
      productId: 'product-1',
      imageUrl: 'https://example.com/image1.jpg',
      storagePath: 'product-1/image1.jpg',
      isPrimary: true,
      displayOrder: 0,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'img-2',
      productId: 'product-1',
      imageUrl: 'https://example.com/image2.jpg',
      storagePath: 'product-1/image2.jpg',
      isPrimary: false,
      displayOrder: 1,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockProductImageService = jasmine.createSpyObj('ProductImageService', [
      'getImagesByProductId',
      'uploadImage',
      'uploadMultipleImages',
      'setPrimary',
      'deleteImage',
      'reorderImages',
      'validateFile'
    ]);

    mockToastService = jasmine.createSpyObj('ToastService', [
      'success',
      'error',
      'warn',
      'info'
    ]);

    mockConfirmDialogService = jasmine.createSpyObj('ConfirmDialogService', [
      'confirmDelete'
    ]);

    mockProductImageService.getImagesByProductId.and.resolveTo({
      data: mockImages,
      total: mockImages.length
    });

    mockProductImageService.validateFile.and.returnValue({ valid: true });

    await TestBed.configureTestingModule({
      imports: [
        ProductImageUploadComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ProductImageService, useValue: mockProductImageService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductImageUploadComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load images on init when productId is set', fakeAsync(() => {
    component.productId = 'product-1';
    fixture.detectChanges();
    tick();

    expect(mockProductImageService.getImagesByProductId).toHaveBeenCalledWith('product-1');
    expect(component.images()).toEqual(mockImages);
  }));

  it('should not load images on init when productId is null', () => {
    component.productId = null;
    fixture.detectChanges();

    expect(mockProductImageService.getImagesByProductId).not.toHaveBeenCalled();
  });
});
