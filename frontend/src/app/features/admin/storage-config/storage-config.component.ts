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
  templateUrl: './storage-config.component.html'
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
