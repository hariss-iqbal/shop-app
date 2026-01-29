import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { StorageConfigService } from '../../../core/services/storage-config.service';
import { ToastService } from '../../../shared/services/toast.service';
import { StorageBucketStatus } from '../../../models/storage-config.model';

interface PolicyRow {
  operation: string;
  operationLabel: string;
  operationIcon: string;
  anonAllowed: boolean;
  authenticatedAllowed: boolean;
}

@Component({
  selector: 'app-storage-config',
  imports: [
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
    DividerModule
  ],
  template: `
    <div class="flex flex-column gap-3">
      <div class="flex align-items-center justify-content-between">
        <div>
          <h2 class="m-0">Storage Configuration</h2>
          <p class="mt-1 mb-0 text-color-secondary">
            Supabase Storage bucket configuration for phone images
          </p>
        </div>
        <p-button
          icon="pi pi-refresh"
          label="Refresh"
          severity="secondary"
          [outlined]="true"
          [loading]="loading()"
          (onClick)="loadBucketStatus()"
        />
      </div>

      @if (loading()) {
        <div class="flex justify-content-center p-6">
          <p-progressSpinner strokeWidth="4" />
        </div>
      } @else if (error()) {
        <p-card>
          <div class="text-center p-4">
            <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
            <p class="text-lg font-medium mb-2">Failed to load bucket configuration</p>
            <p class="text-color-secondary mb-3">{{ error() }}</p>
            <p-button
              label="Retry"
              icon="pi pi-refresh"
              (onClick)="loadBucketStatus()"
            />
          </div>
        </p-card>
      } @else if (bucketStatus()) {
        <!-- Bucket Overview Cards -->
        <div class="grid">
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 3rem; height: 3rem;">
                  <i class="pi pi-database text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-color-secondary m-0 text-sm">Bucket Name</p>
                  <p class="text-lg font-semibold m-0">{{ bucketStatus()!.bucket.name }}</p>
                </div>
              </div>
            </p-card>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center border-round" style="width: 3rem; height: 3rem;"
                     [class.bg-green-100]="bucketStatus()!.bucket.isPublic"
                     [class.bg-red-100]="!bucketStatus()!.bucket.isPublic">
                  <i class="pi text-xl"
                     [class.pi-eye]="bucketStatus()!.bucket.isPublic"
                     [class.pi-eye-slash]="!bucketStatus()!.bucket.isPublic"
                     [class.text-green-600]="bucketStatus()!.bucket.isPublic"
                     [class.text-red-600]="!bucketStatus()!.bucket.isPublic"></i>
                </div>
                <div>
                  <p class="text-color-secondary m-0 text-sm">Read Access</p>
                  <p-tag
                    [value]="bucketStatus()!.bucket.isPublic ? 'Public' : 'Private'"
                    [severity]="bucketStatus()!.bucket.isPublic ? 'success' : 'danger'"
                  />
                </div>
              </div>
            </p-card>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 3rem; height: 3rem;">
                  <i class="pi pi-upload text-orange-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-color-secondary m-0 text-sm">Max File Size</p>
                  <p class="text-lg font-semibold m-0">{{ bucketStatus()!.bucket.fileSizeLimitMB }} MB</p>
                </div>
              </div>
            </p-card>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 3rem; height: 3rem;">
                  <i class="pi pi-images text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-color-secondary m-0 text-sm">Stored Files</p>
                  <p class="text-lg font-semibold m-0">{{ bucketStatus()!.fileCount }}</p>
                </div>
              </div>
            </p-card>
          </div>
        </div>

        <!-- Configuration Details -->
        <div class="grid">
          <div class="col-12 lg:col-6">
            <p-card header="Allowed MIME Types">
              <div class="flex flex-column gap-2">
                @for (mimeType of bucketStatus()!.bucket.allowedMimeTypes; track mimeType) {
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-check-circle text-green-500"></i>
                    <span class="font-mono text-sm">{{ mimeType }}</span>
                    <p-tag
                      [value]="getMimeTypeLabel(mimeType)"
                      severity="info"
                      [rounded]="true"
                    />
                  </div>
                }
              </div>
              <p-divider />
              <p class="text-color-secondary text-sm m-0">
                Only these image formats can be uploaded to the phone-images bucket.
                Client-side validation and server-side bucket constraints enforce this restriction.
              </p>
            </p-card>
          </div>

          <div class="col-12 lg:col-6">
            <p-card header="Path Structure">
              <div class="surface-ground border-round p-3 mb-3">
                <code class="text-sm">{{ bucketStatus()!.pathStructure }}</code>
              </div>
              <div class="flex flex-column gap-2">
                <div class="flex align-items-start gap-2">
                  <i class="pi pi-folder text-orange-500 mt-1"></i>
                  <div>
                    <span class="font-medium font-mono text-sm">phone-images/</span>
                    <span class="text-color-secondary text-sm"> - Storage bucket root</span>
                  </div>
                </div>
                <div class="flex align-items-start gap-2 ml-3">
                  <i class="pi pi-folder-open text-blue-500 mt-1"></i>
                  <div>
                    <span class="font-medium font-mono text-sm">{{ phoneIdPlaceholder }}/</span>
                    <span class="text-color-secondary text-sm"> - Phone UUID subfolder</span>
                  </div>
                </div>
                <div class="flex align-items-start gap-2 ml-6">
                  <i class="pi pi-image text-green-500 mt-1"></i>
                  <div>
                    <span class="font-medium font-mono text-sm">{{ filenamePlaceholder }}</span>
                    <span class="text-color-secondary text-sm"> - Unique timestamped filename</span>
                  </div>
                </div>
              </div>
              <p-divider />
              <p class="text-color-secondary text-sm m-0">
                Uploaded images are stored in phone_images.image_url (public URL) and
                phone_images.storage_path (bucket path for deletion).
              </p>
            </p-card>
          </div>
        </div>

        <!-- RLS Policies Table -->
        <p-card header="Storage RLS Policies">
          <p-table
            [value]="policyRows()"
            styleClass="p-datatable-sm p-datatable-gridlines"
          >
            <ng-template #header>
              <tr>
                <th>Operation</th>
                <th>Anonymous (anon)</th>
                <th>Authenticated</th>
              </tr>
            </ng-template>
            <ng-template #body let-row>
              <tr>
                <td class="font-medium">
                  <div class="flex align-items-center gap-2">
                    <i [class]="row.operationIcon" class="text-color-secondary"></i>
                    {{ row.operationLabel }}
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="row.anonAllowed ? 'Allowed' : 'Denied'"
                    [severity]="row.anonAllowed ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  <p-tag
                    [value]="row.authenticatedAllowed ? 'Allowed' : 'Denied'"
                    [severity]="row.authenticatedAllowed ? 'success' : 'danger'"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
          <p-divider />
          <div class="flex flex-column gap-2">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-info-circle text-blue-500"></i>
              <span class="text-sm text-color-secondary">
                Anonymous users can only read/download images (public access via URL).
              </span>
            </div>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-lock text-orange-500"></i>
              <span class="text-sm text-color-secondary">
                Upload, update, and delete operations require authentication (admin only).
              </span>
            </div>
          </div>
        </p-card>

        <!-- Storage Usage -->
        <p-card header="Storage Usage">
          <div class="grid">
            <div class="col-12 md:col-4">
              <div class="text-center p-3 surface-ground border-round">
                <p class="text-3xl font-bold text-primary m-0">{{ bucketStatus()!.fileCount }}</p>
                <p class="text-color-secondary text-sm mt-1 mb-0">Total Files</p>
              </div>
            </div>
            <div class="col-12 md:col-4">
              <div class="text-center p-3 surface-ground border-round">
                <p class="text-3xl font-bold text-primary m-0">{{ bucketStatus()!.totalSizeMB }} MB</p>
                <p class="text-color-secondary text-sm mt-1 mb-0">Total Storage Used</p>
              </div>
            </div>
            <div class="col-12 md:col-4">
              <div class="text-center p-3 surface-ground border-round">
                <p class="text-3xl font-bold text-primary m-0">{{ bucketStatus()!.bucket.fileSizeLimitMB }} MB</p>
                <p class="text-color-secondary text-sm mt-1 mb-0">Max File Size</p>
              </div>
            </div>
          </div>
        </p-card>
      }
    </div>
  `
})
export class StorageConfigComponent implements OnInit {
  private storageConfigService = inject(StorageConfigService);
  private toastService = inject(ToastService);

  bucketStatus = signal<StorageBucketStatus | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly phoneIdPlaceholder = '{phone_id}';
  readonly filenamePlaceholder = '{filename}';

  policyRows = computed<PolicyRow[]>(() => {
    const status = this.bucketStatus();
    if (!status) return [];

    const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    return operations.map(op => ({
      operation: op,
      operationLabel: this.getOperationLabel(op),
      operationIcon: this.getOperationIcon(op),
      anonAllowed: status.policies.find(p => p.operation === op && p.role === 'anon')?.allowed ?? false,
      authenticatedAllowed: status.policies.find(p => p.operation === op && p.role === 'authenticated')?.allowed ?? false
    }));
  });

  ngOnInit(): void {
    this.loadBucketStatus();
  }

  async loadBucketStatus(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const status = await this.storageConfigService.getBucketStatus();
      this.bucketStatus.set(status);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      this.error.set(message);
      this.toastService.error('Error', 'Failed to load storage configuration');
    } finally {
      this.loading.set(false);
    }
  }

  getMimeTypeLabel(mimeType: string): string {
    const labels: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP'
    };
    return labels[mimeType] || mimeType;
  }

  private getOperationIcon(operation: string): string {
    const icons: Record<string, string> = {
      'SELECT': 'pi pi-eye',
      'INSERT': 'pi pi-upload',
      'UPDATE': 'pi pi-pencil',
      'DELETE': 'pi pi-trash'
    };
    return icons[operation] || 'pi pi-circle';
  }

  private getOperationLabel(operation: string): string {
    const labels: Record<string, string> = {
      'SELECT': 'Read / Download',
      'INSERT': 'Upload',
      'UPDATE': 'Update',
      'DELETE': 'Delete'
    };
    return labels[operation] || operation;
  }
}
