import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { OrderListModule } from 'primeng/orderlist';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BadgeModule } from 'primeng/badge';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PhoneImageService } from '../../../../core/services/phone-image.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { PhoneImage, ImageUploadState } from '../../../../models/phone-image.model';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

@Component({
  selector: 'app-phone-image-upload',
  imports: [
    CommonModule,
    FileUploadModule,
    ButtonModule,
    ProgressBarModule,
    TooltipModule,
    OrderListModule,
    ProgressSpinnerModule,
    BadgeModule,
    DragDropModule
  ],
  template: `
    <div class="grid">
      <div class="col-12">
        <div
          class="border-2 border-dashed border-round p-4 text-center cursor-pointer transition-all transition-duration-200 hover:surface-hover"
          [class.border-primary]="isDragOver()"
          [class.surface-100]="isDragOver()"
          [class.surface-border]="!isDragOver()"
          [class.shadow-2]="isDragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
          (keydown.enter)="fileInput.click()"
          (keydown.space)="fileInput.click(); $event.preventDefault()"
          tabindex="0"
          role="button"
          aria-label="Upload images. Drag and drop or click to browse. Supported formats: JPEG, PNG, WebP. Maximum 5MB per file."
        >
          <input
            #fileInput
            type="file"
            [accept]="acceptedTypes"
            multiple
            class="hidden"
            (change)="onFileSelect($event)"
            aria-hidden="true"
          />

          <i class="pi pi-cloud-upload text-4xl mb-3" [class.text-primary]="isDragOver()" [class.text-500]="!isDragOver()"></i>
          <p class="text-lg font-medium mb-2">Drag and drop images here</p>
          <p class="text-500 mb-3">or click to browse</p>
          <p class="text-xs text-500">
            Supported formats: JPEG, PNG, WebP. Max size: 5MB per file.
          </p>
        </div>
      </div>

      @if (uploading().length > 0) {
        <div class="col-12">
          <div class="surface-card border-round p-3">
            <h4 class="mt-0 mb-3">Uploading...</h4>
            @for (upload of uploading(); track upload.file.name) {
              <div class="flex align-items-center gap-3 mb-2">
                <img
                  [src]="upload.previewUrl"
                  [alt]="upload.file.name"
                  class="border-round"
                  style="width: 48px; height: 48px; object-fit: cover;"
                />
                <div class="flex-grow-1">
                  <div class="flex justify-content-between align-items-center mb-1">
                    <span class="text-sm font-medium text-overflow-ellipsis white-space-nowrap overflow-hidden" style="max-width: 200px;">
                      {{ upload.file.name }}
                    </span>
                    <span class="text-xs text-500">{{ upload.progress.progress }}%</span>
                  </div>
                  <p-progressBar
                    [value]="upload.progress.progress"
                    [showValue]="false"
                    styleClass="h-0.5rem"
                  />
                </div>
                @if (upload.progress.status === 'error') {
                  <i class="pi pi-times-circle text-red-500" [pTooltip]="upload.progress.error"></i>
                } @else if (upload.progress.status === 'completed') {
                  <i class="pi pi-check-circle text-green-500"></i>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (loading()) {
        <div class="col-12 flex justify-content-center p-4">
          <p-progressSpinner strokeWidth="4" />
        </div>
      } @else if (images().length > 0) {
        <div class="col-12">
          <div class="flex justify-content-between align-items-center mb-3">
            <h4 class="m-0">Images ({{ images().length }})</h4>
            <p class="text-xs text-500 m-0">Drag to reorder</p>
          </div>

          <div
            cdkDropList
            [cdkDropListData]="images()"
            (cdkDropListDropped)="onImageDrop($event)"
            class="grid"
            role="list"
            aria-label="Phone images. Drag items to reorder."
          >
            @for (image of images(); track image.id; let i = $index) {
              <div
                cdkDrag
                class="col-12 sm:col-6 md:col-4 lg:col-3"
                [cdkDragData]="image"
                role="listitem"
                [attr.aria-label]="'Image ' + (i + 1) + ' of ' + images().length + (image.isPrimary ? ', Primary image' : '')"
              >
                <div
                  class="surface-card border-round overflow-hidden relative shadow-1 hover:shadow-3 transition-all transition-duration-200"
                  [class.border-primary]="image.isPrimary"
                  [class.border-2]="image.isPrimary"
                >
                  <div
                    cdkDragHandle
                    class="absolute top-0 left-0 right-0 p-2 flex justify-content-between align-items-center z-1 cursor-move"
                    style="background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);"
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="'Drag to reorder image ' + (i + 1)"
                  >
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-bars text-white"></i>
                      <span class="text-white text-xs font-medium">{{ i + 1 }}</span>
                    </div>
                    @if (image.isPrimary) {
                      <p-badge value="Primary" severity="success" />
                    }
                  </div>

                  <img
                    [src]="image.imageUrl"
                    [alt]="'Phone image ' + (i + 1)"
                    class="w-full"
                    style="aspect-ratio: 1; object-fit: cover;"
                    loading="lazy"
                  />

                  <div class="p-2 flex gap-1 justify-content-center surface-ground">
                    @if (!image.isPrimary) {
                      <p-button
                        icon="pi pi-star"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        size="small"
                        pTooltip="Set as Primary"
                        tooltipPosition="top"
                        (onClick)="onSetPrimary(image)"
                        [disabled]="actionInProgress()"
                        [attr.aria-label]="'Set image ' + (i + 1) + ' as primary'"
                      />
                    } @else {
                      <p-button
                        icon="pi pi-star-fill"
                        [rounded]="true"
                        [text]="true"
                        severity="warn"
                        size="small"
                        pTooltip="Primary Image"
                        tooltipPosition="top"
                        [disabled]="true"
                        aria-label="This is the primary image"
                      />
                    }
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      size="small"
                      pTooltip="Delete"
                      tooltipPosition="top"
                      (onClick)="onDelete(image)"
                      [disabled]="actionInProgress()"
                      [attr.aria-label]="'Delete image ' + (i + 1)"
                    />
                  </div>
                </div>

                <div *cdkDragPlaceholder class="surface-200 border-round border-dashed border-2 border-primary" style="aspect-ratio: 1;"></div>
              </div>
            }
          </div>
        </div>
      }

      @if (!loading() && images().length === 0 && uploading().length === 0) {
        <div class="col-12">
          <div class="text-center p-4 text-500" role="status" aria-live="polite">
            <i class="pi pi-image text-4xl mb-2 block"></i>
            <p class="m-0">No images uploaded yet</p>
            <p class="text-xs mt-2">Use the upload area above to add images</p>
          </div>
        </div>
      }
    </div>
  `
})
export class PhoneImageUploadComponent implements OnInit, OnDestroy {
  @Input() phoneId: string | null = null;
  @Output() imagesChanged = new EventEmitter<PhoneImage[]>();

  private phoneImageService = inject(PhoneImageService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmDialogService);

  images = signal<PhoneImage[]>([]);
  uploading = signal<ImageUploadState[]>([]);
  loading = signal(false);
  actionInProgress = signal(false);
  isDragOver = signal(false);

  acceptedTypes = ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');

  ngOnInit(): void {
    if (this.phoneId) {
      this.loadImages();
    }
  }

  ngOnDestroy(): void {
    this.uploading().forEach(upload => {
      URL.revokeObjectURL(upload.previewUrl);
    });
  }

  async loadImages(): Promise<void> {
    if (!this.phoneId) return;

    this.loading.set(true);
    try {
      const response = await this.phoneImageService.getImagesByPhoneId(this.phoneId);
      this.images.set(response.data);
    } catch (error) {
      console.error('Failed to load images:', error);
      this.toastService.error('Error', 'Failed to load images');
    } finally {
      this.loading.set(false);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
      input.value = '';
    }
  }

  private async processFiles(files: File[]): Promise<void> {
    if (!this.phoneId) {
      this.toastService.warn('Warning', 'Please save the phone record before uploading images');
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = this.phoneImageService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      errors.forEach(error => this.toastService.error('Invalid File', error));
    }

    if (validFiles.length === 0) return;

    const uploadStates: ImageUploadState[] = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      progress: {
        fileName: file.name,
        progress: 0,
        status: 'pending'
      }
    }));

    this.uploading.set([...this.uploading(), ...uploadStates]);

    const uploadedImages = await this.phoneImageService.uploadMultipleImages(
      this.phoneId,
      validFiles,
      (fileName, progress) => {
        this.uploading.update(uploads =>
          uploads.map(u =>
            u.file.name === fileName ? { ...u, progress } : u
          )
        );
      }
    );

    await this.loadImages();
    this.emitImagesChanged();

    setTimeout(() => {
      const completedFiles = validFiles.map(f => f.name);
      this.uploading.update(uploads => {
        const remaining = uploads.filter(u => !completedFiles.includes(u.file.name));
        uploads.filter(u => completedFiles.includes(u.file.name)).forEach(u => {
          URL.revokeObjectURL(u.previewUrl);
        });
        return remaining;
      });
    }, 1500);

    if (uploadedImages.length > 0) {
      this.toastService.success(
        'Upload Complete',
        `${uploadedImages.length} image(s) uploaded successfully`
      );
    }
  }

  async onImageDrop(event: CdkDragDrop<PhoneImage[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) return;
    if (!this.phoneId) return;

    const imagesCopy = [...this.images()];
    moveItemInArray(imagesCopy, event.previousIndex, event.currentIndex);
    this.images.set(imagesCopy);

    this.actionInProgress.set(true);
    try {
      const imageIds = imagesCopy.map(img => img.id);
      await this.phoneImageService.reorderImages(this.phoneId, { imageIds });
      this.emitImagesChanged();
    } catch (error) {
      console.error('Failed to reorder images:', error);
      this.toastService.error('Error', 'Failed to reorder images');
      await this.loadImages();
    } finally {
      this.actionInProgress.set(false);
    }
  }

  async onSetPrimary(image: PhoneImage): Promise<void> {
    this.actionInProgress.set(true);
    try {
      await this.phoneImageService.setPrimary(image.id);
      this.images.update(images =>
        images.map(img => ({
          ...img,
          isPrimary: img.id === image.id
        }))
      );
      this.emitImagesChanged();
      this.toastService.success('Success', 'Primary image updated');
    } catch (error) {
      console.error('Failed to set primary image:', error);
      this.toastService.error('Error', 'Failed to set primary image');
    } finally {
      this.actionInProgress.set(false);
    }
  }

  async onDelete(image: PhoneImage): Promise<void> {
    const confirmed = await this.confirmService.confirmDelete('image');
    if (!confirmed) return;

    this.actionInProgress.set(true);
    try {
      await this.phoneImageService.deleteImage(image.id);
      this.images.update(images => images.filter(img => img.id !== image.id));
      this.emitImagesChanged();
      this.toastService.success('Success', 'Image deleted');
    } catch (error) {
      console.error('Failed to delete image:', error);
      this.toastService.error('Error', 'Failed to delete image');
    } finally {
      this.actionInProgress.set(false);
    }
  }

  private emitImagesChanged(): void {
    this.imagesChanged.emit(this.images());
  }
}
