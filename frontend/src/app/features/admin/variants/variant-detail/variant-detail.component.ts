import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { FileUploadModule } from 'primeng/fileupload';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { ProductService } from '../../../../core/services/product.service';
import { ProductImageService } from '../../../../core/services/product-image.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { Variant, VariantImage } from '../../../../models/variant.model';
import { ProductConditionLabels } from '../../../../enums/product-condition.enum';
import { PtaStatus, PtaStatusLabels } from '../../../../enums/pta-status.enum';
import { ProductStatus, ProductStatusLabels } from '../../../../enums/product-status.enum';

interface ProductRow {
  id: string;
  imei: string | null;
  costPrice: number;
  color: string | null;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-variant-detail',
  imports: [
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputNumberModule,
    TagModule,
    ChipModule,
    FileUploadModule,
    SkeletonModule,
    TooltipModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    MessageModule,
    SelectModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './variant-detail.component.html'
})
export class VariantDetailComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private productImageService: ProductImageService,
    private supabase: SupabaseService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService
  ) {}

  variantId = signal<string>('');
  variant = signal<Variant | null>(null);
  allImages = signal<VariantImage[]>([]);
  images = signal<VariantImage[]>([]);
  products = signal<ProductRow[]>([]);
  loading = signal(true);
  imagesLoading = signal(false);
  productsLoading = signal(false);
  uploadingImage = signal(false);
  deletingImageId = signal<string | null>(null);
  settingPrimaryId = signal<string | null>(null);

  // Color filtering
  selectedColor = signal<string | null>(null);
  availableColors = computed<string[]>(() => {
    const v = this.variant();
    return v?.availableColors ?? [];
  });

  colorOptions = computed<{ label: string; value: string }[]>(() => {
    const colors = this.availableColors();
    return [
      { label: 'All Colors', value: '__all__' },
      ...colors.map(c => ({ label: c, value: c }))
    ];
  });

  selectedColorValue = signal<string>('__all__');

  // Inline price editing
  editingSellingPrice = signal(false);
  editSellingPrice = signal<number | null>(null);
  savingSellingPrice = signal(false);

  readonly skeletonRows = Array(3).fill({});

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.error('Error', 'Variant ID is required');
      this.router.navigate(['/admin/variants']);
      return;
    }

    this.variantId.set(id);
    await this.loadVariant(id);
  }

  async loadVariant(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const variant = await this.productService.getVariantById(id);
      if (!variant) {
        this.toastService.error('Not Found', 'Variant not found');
        this.router.navigate(['/admin/variants']);
        return;
      }
      this.variant.set(variant);
      await Promise.all([
        this.loadImages(id),
        this.loadProducts(id)
      ]);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load variant');
      console.error('Failed to load variant:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadImages(variantId: string): Promise<void> {
    this.imagesLoading.set(true);
    try {
      const imgs = await this.productService.getVariantImages(variantId);
      this.allImages.set(imgs);
      this.applyColorFilter();
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      this.imagesLoading.set(false);
    }
  }

  onColorChange(value: string): void {
    if (value === '__all__') {
      this.selectedColor.set(null);
    } else {
      this.selectedColor.set(value);
    }
    this.applyColorFilter();
  }

  private applyColorFilter(): void {
    const color = this.selectedColor();
    if (!color) {
      this.images.set(this.allImages());
    } else {
      this.images.set(this.allImages().filter(img => img.color === color));
    }
  }

  async loadProducts(variantId: string): Promise<void> {
    this.productsLoading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('id, imei, cost_price, color, status, created_at')
        .eq('variant_id', variantId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const rows: ProductRow[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row['id'] as string,
        imei: row['imei'] as string | null,
        costPrice: Number(row['cost_price']),
        color: row['color'] as string | null,
        status: row['status'] as string,
        createdAt: row['created_at'] as string
      }));
      this.products.set(rows);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      this.productsLoading.set(false);
    }
  }

  // Selling price inline edit
  startPriceEdit(): void {
    const v = this.variant();
    if (!v) return;
    this.editSellingPrice.set(v.sellingPrice);
    this.editingSellingPrice.set(true);
  }

  cancelPriceEdit(): void {
    this.editingSellingPrice.set(false);
  }

  async savePriceEdit(): Promise<void> {
    const v = this.variant();
    const newPrice = this.editSellingPrice();
    if (!v || newPrice === null || newPrice < 0) {
      this.toastService.warn('Invalid', 'Selling price must be a valid positive number');
      return;
    }

    if (newPrice === v.sellingPrice) {
      this.cancelPriceEdit();
      return;
    }

    this.savingSellingPrice.set(true);
    try {
      await this.productService.updateVariantSellingPrice(v.id, newPrice);
      this.variant.update(current => current ? { ...current, sellingPrice: newPrice } : null);
      this.toastService.success('Updated', 'Selling price updated');
      this.cancelPriceEdit();
    } catch (error) {
      this.toastService.error('Error', 'Failed to update selling price');
      console.error('Failed to update selling price:', error);
    } finally {
      this.savingSellingPrice.set(false);
    }
  }

  // Image management
  async onImageUpload(event: { files: File[] }): Promise<void> {
    const files = event.files;
    if (!files || files.length === 0) return;

    const color = this.selectedColor();
    this.uploadingImage.set(true);
    try {
      for (const file of files) {
        const isFirstImage = this.allImages().length === 0;
        await this.productImageService.uploadVariantImage(
          this.variantId(),
          file,
          isFirstImage,
          color
        );
      }
      await this.loadImages(this.variantId());
      this.toastService.success('Uploaded', `${files.length} image(s) uploaded`);
    } catch (error) {
      this.toastService.error('Error', 'Failed to upload image');
      console.error('Failed to upload image:', error);
    } finally {
      this.uploadingImage.set(false);
    }
  }

  async onDeleteImage(image: VariantImage): Promise<void> {
    const confirmed = await this.confirmDialogService.confirmDelete('image', 'this variant image');
    if (!confirmed) return;

    this.deletingImageId.set(image.id);
    try {
      await this.productImageService.deleteVariantImage(image.id, this.variantId());
      await this.loadImages(this.variantId());
      this.toastService.success('Deleted', 'Image deleted');
    } catch (error) {
      this.toastService.error('Error', 'Failed to delete image');
      console.error('Failed to delete image:', error);
    } finally {
      this.deletingImageId.set(null);
    }
  }

  async onSetPrimaryImage(image: VariantImage): Promise<void> {
    this.settingPrimaryId.set(image.id);
    try {
      await this.productImageService.setPrimaryVariantImage(image.id, this.variantId());
      await this.loadImages(this.variantId());
      this.toastService.success('Updated', 'Primary image updated');
    } catch (error) {
      this.toastService.error('Error', 'Failed to set primary image');
      console.error('Failed to set primary image:', error);
    } finally {
      this.settingPrimaryId.set(null);
    }
  }

  // Display helpers
  getPtaLabel(status: string | null): string {
    if (!status) return '-';
    return PtaStatusLabels[status as PtaStatus] || status;
  }

  getPtaSeverity(status: string | null): 'success' | 'warn' | 'secondary' | undefined {
    if (!status) return 'secondary';
    const map: Record<string, 'success' | 'warn'> = {
      pta_approved: 'success',
      non_pta: 'warn'
    };
    return map[status] || 'secondary';
  }

  getConditionLabel(condition: string): string {
    return ProductConditionLabels[condition as keyof typeof ProductConditionLabels] || condition;
  }

  getConditionSeverity(condition: string): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn'> = {
      new: 'success',
      open_box: 'info',
      used: 'warn'
    };
    return map[condition] || 'secondary';
  }

  getStatusLabel(status: string): string {
    return ProductStatusLabels[status as ProductStatus] || status;
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'danger' | 'warn'> = {
      available: 'success',
      sold: 'danger',
      reserved: 'warn'
    };
    return map[status] || 'secondary';
  }
}
