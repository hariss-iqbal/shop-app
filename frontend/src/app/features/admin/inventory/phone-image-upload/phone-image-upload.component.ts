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
  templateUrl: './phone-image-upload.component.html'
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
