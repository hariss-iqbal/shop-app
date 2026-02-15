import { Component, OnChanges, SimpleChanges, signal, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProductImageService } from '../../../../core/services/product-image.service';
import { ImageOptimizationService } from '../../../../core/services/image-optimization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Product } from '../../../../models/product.model';
import { ProductImage } from '../../../../models/product-image.model';

@Component({
  selector: 'app-inventory-image-dialog',
  imports: [CommonModule, DialogModule, ButtonModule, TooltipModule, ProgressSpinnerModule],
  templateUrl: './inventory-image-dialog.component.html',
  styleUrls: ['./inventory-image-dialog.component.scss']
})
export class InventoryImageDialogComponent implements OnChanges {
  product = input<Product | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  imagesSaved = output<void>();

  images = signal<ProductImage[]>([]);
  markedForDeletion = signal<Set<string>>(new Set());
  newFiles = signal<{file: File; preview: string}[]>([]);
  saving = signal(false);
  loading = signal(false);

  dialogHeader = computed(() => {
    const p = this.product();
    return p ? `Images: ${p.brandName} ${p.model}` : 'Manage Images';
  });

  constructor(
    private imageService: ProductImageService,
    private imageOptimization: ImageOptimizationService,
    private toastService: ToastService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] || changes['product']) {
      if (this.visible() && this.product()) {
        this.loadImages();
      }
    }
  }

  async loadImages(): Promise<void> {
    const p = this.product();
    if (!p) return;
    this.loading.set(true);
    try {
      const result = await this.imageService.getImagesByProductId(p.id);
      this.images.set(result.data);
      this.markedForDeletion.set(new Set());
      this.newFiles.set([]);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load images');
    } finally {
      this.loading.set(false);
    }
  }

  getThumbUrl(imageUrl: string): string {
    return this.imageOptimization.getThumbnailUrl(imageUrl);
  }

  isMarkedForDeletion(id: string): boolean {
    return this.markedForDeletion().has(id);
  }

  toggleDeletion(id: string): void {
    const current = new Set(this.markedForDeletion());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.markedForDeletion.set(current);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const newItems = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    this.newFiles.update(current => [...current, ...newItems]);
    input.value = '';
  }

  removeNewFile(index: number): void {
    this.newFiles.update(current => {
      const updated = [...current];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }

  hasChanges(): boolean {
    return this.markedForDeletion().size > 0 || this.newFiles().length > 0;
  }

  async onSave(): Promise<void> {
    const p = this.product();
    if (!p) return;
    this.saving.set(true);

    try {
      // Delete marked images
      const deletions = Array.from(this.markedForDeletion());
      for (const id of deletions) {
        await this.imageService.deleteImage(id);
      }

      // Upload new images
      const files = this.newFiles().map(f => f.file);
      if (files.length > 0) {
        await this.imageService.uploadMultipleImages(p.id, files);
      }

      this.toastService.success('Saved', 'Images updated successfully');
      this.imagesSaved.emit();
      this.visibleChange.emit(false);
    } catch (error) {
      this.toastService.error('Error', 'Failed to save image changes');
    } finally {
      this.saving.set(false);
    }
  }

  onCancel(): void {
    // Clean up preview URLs
    for (const item of this.newFiles()) {
      URL.revokeObjectURL(item.preview);
    }
    this.visibleChange.emit(false);
  }
}
