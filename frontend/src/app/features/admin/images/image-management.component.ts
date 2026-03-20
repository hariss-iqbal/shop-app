import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService, LazyLoadParams } from '../../../core/services/product.service';
import { ProductImageService } from '../../../core/services/product-image.service';
import { ViewportService } from '../../../core';
import { ToastService } from '../../../shared/services/toast.service';
import { Product } from '../../../models/product.model';
import { ProductImage } from '../../../models/product-image.model';

interface ProductWithImages extends Product {
  imageCount: number;
  images: ProductImage[];
}

type ImageFilter = 'all' | 'no-images' | 'has-images';

@Component({
  selector: 'app-image-management',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    TooltipModule,
    MessageModule,
    ProgressBarModule,
    BadgeModule,
    DividerModule,
    DragDropModule,
    CurrencyPipe
  ],
  templateUrl: './image-management.component.html',
  styleUrls: ['./image-management.component.scss']
})
export class ImageManagementComponent implements OnInit {
  constructor(
    private productService: ProductService,
    private productImageService: ProductImageService,
    public viewportService: ViewportService,
    private toastService: ToastService
  ) {}

  // State
  loading = signal(false);
  products = signal<ProductWithImages[]>([]);
  totalProducts = signal(0);
  searchQuery = '';
  activeFilter = signal<ImageFilter>('all');
  missingImageCount = signal(0);

  // Pagination
  rows = 20;
  first = 0;

  // Upload dialog
  dialogVisible = signal(false);
  selectedProduct = signal<ProductWithImages | null>(null);
  productImages = signal<ProductImage[]>([]);
  loadingImages = signal(false);
  pendingFiles = signal<File[]>([]);
  pendingPreviews = signal<string[]>([]);
  uploading = signal(false);
  uploadProgress = signal(0);
  reordering = signal(false);

  // Dialog responsive style
  dialogStyle = computed(() => {
    return this.viewportService.isMobile()
      ? { width: '95vw', maxHeight: '95vh' }
      : { width: '60vw', maxHeight: '85vh' };
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    try {
      const params: LazyLoadParams = {
        first: this.first,
        rows: this.rows,
        sortField: 'createdAt',
        sortOrder: -1,
        globalFilter: this.searchQuery || undefined
      };

      const result = await this.productService.getProducts(params);

      // Fetch image counts for each product
      const productsWithImages: ProductWithImages[] = await Promise.all(
        result.data.map(async (product) => {
          const imageResult = await this.productImageService.getImagesByProductId(product.id);
          return {
            ...product,
            imageCount: imageResult.total,
            images: imageResult.data
          };
        })
      );

      // Apply filter
      let filtered = productsWithImages;
      if (this.activeFilter() === 'no-images') {
        filtered = productsWithImages.filter(p => p.imageCount === 0);
      } else if (this.activeFilter() === 'has-images') {
        filtered = productsWithImages.filter(p => p.imageCount > 0);
      }

      this.products.set(filtered);
      this.totalProducts.set(result.total);

      // Count missing images across all products
      const missing = productsWithImages.filter(p => p.imageCount === 0).length;
      this.missingImageCount.set(missing);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load products');
      console.error('Failed to load products:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    this.first = 0;
    this.loadProducts();
  }

  setFilter(filter: ImageFilter): void {
    this.activeFilter.set(filter);
    this.first = 0;
    this.loadProducts();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadProducts();
  }

  onKpiClick(): void {
    this.setFilter(this.activeFilter() === 'no-images' ? 'all' : 'no-images');
  }

  onRowClick(product: ProductWithImages): void {
    this.openUploadDialog(product);
  }

  // --- Upload Dialog ---

  openUploadDialog(product: ProductWithImages): void {
    this.selectedProduct.set(product);
    this.pendingFiles.set([]);
    this.pendingPreviews.set([]);
    this.dialogVisible.set(true);
    this.loadProductImages(product.id);
  }

  private async loadProductImages(productId: string): Promise<void> {
    this.loadingImages.set(true);
    try {
      const result = await this.productImageService.getImagesByProductId(productId);
      this.productImages.set(result.data);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load product images');
    } finally {
      this.loadingImages.set(false);
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );

    this.pendingFiles.update(existing => [...existing, ...files]);

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.pendingPreviews.update(previews => [...previews, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removePendingFile(index: number): void {
    this.pendingFiles.update(files => files.filter((_, i) => i !== index));
    this.pendingPreviews.update(previews => previews.filter((_, i) => i !== index));
  }

  async uploadImages(): Promise<void> {
    const product = this.selectedProduct();
    const files = this.pendingFiles();
    if (!product || files.length === 0) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);

    try {
      let completed = 0;
      for (const file of files) {
        await this.productImageService.uploadImage(product.id, file);
        completed++;
        this.uploadProgress.set(Math.round((completed / files.length) * 100));
      }

      this.toastService.success('Success', `${files.length} image(s) uploaded successfully`);
      this.pendingFiles.set([]);
      this.pendingPreviews.set([]);

      // Refresh images in dialog
      await this.loadProductImages(product.id);

      // Update the product row in the table
      const newCount = this.productImages().length;
      this.products.update(products =>
        products.map(p => {
          if (p.id === product.id) {
            return { ...p, imageCount: newCount };
          }
          return p;
        })
      );

      // Update missing count
      if (product.imageCount === 0 && newCount > 0) {
        this.missingImageCount.update(count => Math.max(0, count - 1));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      this.toastService.error('Upload Error', msg);
    } finally {
      this.uploading.set(false);
      this.uploadProgress.set(0);
    }
  }

  async onImageDrop(event: CdkDragDrop<ProductImage[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) return;
    const product = this.selectedProduct();
    if (!product) return;

    const imagesCopy = [...this.productImages()];
    moveItemInArray(imagesCopy, event.previousIndex, event.currentIndex);
    this.productImages.set(imagesCopy);

    this.reordering.set(true);
    try {
      const imageIds = imagesCopy.map(img => img.id);
      await this.productImageService.reorderImages(product.id, { imageIds });
      this.toastService.success('Reordered', 'Image order updated');
    } catch (error) {
      this.toastService.error('Error', 'Failed to reorder images');
      await this.loadProductImages(product.id);
    } finally {
      this.reordering.set(false);
    }
  }

  async deleteImage(image: ProductImage): Promise<void> {
    const product = this.selectedProduct();
    if (!product) return;

    try {
      await this.productImageService.deleteImage(image.id);
      this.toastService.success('Deleted', 'Image deleted');
      await this.loadProductImages(product.id);

      const newCount = this.productImages().length;
      this.products.update(products =>
        products.map(p => {
          if (p.id === product.id) {
            return { ...p, imageCount: newCount };
          }
          return p;
        })
      );

      if (newCount === 0) {
        this.missingImageCount.update(count => count + 1);
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to delete image');
    }
  }

  async moveImage(index: number, direction: 'left' | 'right'): Promise<void> {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const images = this.productImages();
    if (newIndex < 0 || newIndex >= images.length) return;

    const product = this.selectedProduct();
    if (!product) return;

    const imagesCopy = [...images];
    moveItemInArray(imagesCopy, index, newIndex);
    this.productImages.set(imagesCopy);

    this.reordering.set(true);
    try {
      const imageIds = imagesCopy.map(img => img.id);
      await this.productImageService.reorderImages(product.id, { imageIds });
    } catch (error) {
      this.toastService.error('Error', 'Failed to reorder images');
      await this.loadProductImages(product.id);
    } finally {
      this.reordering.set(false);
    }
  }

  async setPrimary(image: ProductImage): Promise<void> {
    try {
      await this.productImageService.setPrimary(image.id);
      this.productImages.update(images =>
        images.map(img => ({ ...img, isPrimary: img.id === image.id }))
      );
      this.toastService.success('Updated', 'Primary image set');
    } catch (error) {
      this.toastService.error('Error', 'Failed to set primary image');
    }
  }

  getImageThumbnail(product: ProductWithImages): string | null {
    return product.primaryImageUrl || null;
  }

  onDialogHide(): void {
    this.selectedProduct.set(null);
    this.productImages.set([]);
    this.pendingFiles.set([]);
    this.pendingPreviews.set([]);
  }
}
