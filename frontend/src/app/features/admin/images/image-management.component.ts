import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService, LazyLoadParams } from '../../../core/services/product.service';
import { ProductImageService } from '../../../core/services/product-image.service';
import { ProductSpecsScraperService } from '../../../core/services/product-specs-scraper.service';
import { ViewportService } from '../../../core';
import { ToastService } from '../../../shared/services/toast.service';
import { Product } from '../../../models/product.model';
import { ProductImage } from '../../../models/product-image.model';
import { PtaStatus, PtaStatusLabels } from '../../../enums/pta-status.enum';

interface ProductWithImages extends Product {
  imageCount: number;
  images: ProductImage[];
}

type DataCategory = 'all' | 'images' | 'prices' | 'ram' | 'color' | 'storage' | 'ptaStatus';

interface CategoryConfig {
  key: DataCategory;
  label: string;
  icon: string;
  isMissing: (p: ProductWithImages) => boolean;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'images', label: 'Images', icon: 'pi pi-image', isMissing: p => p.imageCount === 0 },
  { key: 'prices', label: 'Prices', icon: 'pi pi-tag', isMissing: p => !p.sellingPrice || !p.costPrice },
  { key: 'ram', label: 'RAM', icon: 'pi pi-microchip', isMissing: p => p.ramGb === null },
  { key: 'color', label: 'Color', icon: 'pi pi-palette', isMissing: p => !p.color },
  { key: 'storage', label: 'Storage', icon: 'pi pi-database', isMissing: p => p.storageGb === null },
  { key: 'ptaStatus', label: 'PTA Status', icon: 'pi pi-shield', isMissing: p => !p.ptaStatus },
];

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
    InputNumberModule,
    TagModule,
    SelectModule,
    ProgressSpinnerModule,
    TooltipModule,
    MessageModule,
    ProgressBarModule,
    BadgeModule,
    DividerModule,
    DragDropModule,
  ],
  templateUrl: './image-management.component.html',
  styleUrls: ['./image-management.component.scss']
})
export class ImageManagementComponent implements OnInit {
  constructor(
    private productService: ProductService,
    private productImageService: ProductImageService,
    private specsScraperService: ProductSpecsScraperService,
    public viewportService: ViewportService,
    private toastService: ToastService
  ) {}

  // Category definitions
  categories = CATEGORIES;

  // PTA options for dropdown
  ptaOptions = [
    { label: PtaStatusLabels[PtaStatus.PTA_APPROVED], value: PtaStatus.PTA_APPROVED },
    { label: PtaStatusLabels[PtaStatus.NON_PTA], value: PtaStatus.NON_PTA }
  ];

  // Common fallback options
  commonRamOptions = [2, 3, 4, 6, 8, 12, 16];
  commonStorageOptions = [32, 64, 128, 256, 512, 1024];

  // State
  loading = signal(false);
  allProducts = signal<ProductWithImages[]>([]);
  searchQuery = '';
  activeFilter = signal<DataCategory>('all');

  // Inline editing
  specsCache = new Map<string, { ram: number[], storage: number[], colors: string[] }>();
  fetchingSpecsFor = signal<string | null>(null);

  // Computed: missing counts per category
  missingCounts = computed(() => {
    const products = this.allProducts();
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.key] = products.filter(cat.isMissing).length;
    }
    return counts;
  });

  // Computed: filtered products based on active category + search
  filteredProducts = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchQuery.toLowerCase().trim();
    let products = this.allProducts();

    // Filter by category
    if (filter !== 'all') {
      const cat = CATEGORIES.find(c => c.key === filter);
      if (cat) {
        products = products.filter(cat.isMissing);
      }
    }

    // Filter by search query
    if (query) {
      products = products.filter(p =>
        p.model.toLowerCase().includes(query) ||
        p.brandName.toLowerCase().includes(query)
      );
    }

    return products;
  });

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
      // Fetch all phone products (no pagination — client-side filtering)
      const params: LazyLoadParams = {
        first: 0,
        rows: 1000,
        sortField: 'createdAt',
        sortOrder: -1,
        globalFilter: undefined
      };

      const result = await this.productService.getProducts(params, { productType: 'phone' as any });

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

      this.allProducts.set(productsWithImages);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load products');
      console.error('Failed to load products:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    this.first = 0;
    // Trigger recomputation by updating the signal
    this.allProducts.update(p => [...p]);
  }

  setFilter(filter: DataCategory): void {
    // Toggle: clicking the active filter goes back to 'all'
    if (this.activeFilter() === filter) {
      this.activeFilter.set('all');
    } else {
      this.activeFilter.set(filter);
    }
    this.first = 0;

    // Auto-fetch specs for relevant categories
    if (filter === 'ram' || filter === 'storage' || filter === 'color') {
      this.prefetchSpecsForVisibleProducts();
    }
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
  }

  // --- Inline Editing ---

  getSpecsForProduct(product: ProductWithImages): { ram: number[], storage: number[], colors: string[] } | null {
    const key = `${product.brandName.toLowerCase()}_${product.model.toLowerCase()}`;
    return this.specsCache.get(key) || null;
  }

  getRamOptions(product: ProductWithImages): { label: string, value: number }[] {
    const specs = this.getSpecsForProduct(product);
    const values = specs?.ram?.length ? specs.ram : this.commonRamOptions;
    return values.map(v => ({ label: `${v} GB`, value: v }));
  }

  getStorageOptions(product: ProductWithImages): { label: string, value: number }[] {
    const specs = this.getSpecsForProduct(product);
    const values = specs?.storage?.length ? specs.storage : this.commonStorageOptions;
    return values.map(v => ({ label: v >= 1024 ? `${v / 1024} TB` : `${v} GB`, value: v }));
  }

  getColorOptions(product: ProductWithImages): { label: string, value: string }[] {
    const specs = this.getSpecsForProduct(product);
    if (specs?.colors?.length) {
      return specs.colors.map(c => ({ label: c, value: c }));
    }
    return [];
  }

  async fetchSpecsForProduct(product: ProductWithImages): Promise<void> {
    const key = `${product.brandName.toLowerCase()}_${product.model.toLowerCase()}`;
    if (this.specsCache.has(key)) return;

    this.fetchingSpecsFor.set(product.id);
    try {
      const result = await this.specsScraperService.fetchSpecs(product.brandName, product.model);
      if (result.success && result.data) {
        this.specsCache.set(key, {
          ram: result.data.ram || [],
          storage: result.data.storage || [],
          colors: result.data.colors || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch specs:', error);
    } finally {
      this.fetchingSpecsFor.set(null);
    }
  }

  private async prefetchSpecsForVisibleProducts(): Promise<void> {
    const products = this.filteredProducts();
    const uniqueModels = new Map<string, ProductWithImages>();
    for (const p of products) {
      const key = `${p.brandName.toLowerCase()}_${p.model.toLowerCase()}`;
      if (!this.specsCache.has(key) && !uniqueModels.has(key)) {
        uniqueModels.set(key, p);
      }
    }

    // Fetch specs for up to 5 unique models at a time
    const toFetch = Array.from(uniqueModels.values()).slice(0, 5);
    for (const p of toFetch) {
      await this.fetchSpecsForProduct(p);
    }
  }

  async saveField(product: ProductWithImages, field: string, value: any): Promise<void> {
    if (value === null || value === undefined || value === '') return;

    try {
      const updatePayload: Record<string, unknown> = { [field]: value };
      await this.productService.updateProduct(product.id, updatePayload);
      this.toastService.success('Saved', `Updated ${product.brandName} ${product.model}`);
    } catch (error) {
      this.toastService.error('Error', 'Failed to save');
      console.error('Failed to save field:', error);
    }
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

      // Update the product in allProducts
      const newCount = this.productImages().length;
      this.allProducts.update(products =>
        products.map(p => {
          if (p.id === product.id) {
            return { ...p, imageCount: newCount };
          }
          return p;
        })
      );
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
      this.allProducts.update(products =>
        products.map(p => {
          if (p.id === product.id) {
            return { ...p, imageCount: newCount };
          }
          return p;
        })
      );
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
