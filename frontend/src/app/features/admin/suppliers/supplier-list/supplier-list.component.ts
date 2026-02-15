import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';

import { SupplierService } from '../../../../core/services/supplier.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { Supplier } from '../../../../models/supplier.model';

@Component({
  selector: 'app-supplier-list',
  imports: [
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SkeletonModule
  ],
  templateUrl: './supplier-list.component.html'
})
export class SupplierListComponent implements OnInit {
  constructor(
    private supplierService: SupplierService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router
  ) { }

  @ViewChild('dt') table!: Table;

  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  readonly skeletonRows = Array(5).fill({});

  ngOnInit(): void {
    this.loadSuppliers();
  }

  async loadSuppliers(): Promise<void> {
    this.loading.set(true);

    try {
      const response = await this.supplierService.getSuppliers();
      this.suppliers.set(response.data);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load suppliers');
      console.error('Failed to load suppliers:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, 'contains');
  }

  onEdit(supplier: Supplier): void {
    this.router.navigate(['/admin/suppliers', supplier.id, 'edit']);
  }

  async onDelete(supplier: Supplier): Promise<void> {
    const hasPOs = await this.supplierService.hasPurchaseOrders(supplier.id);

    if (hasPOs) {
      this.toastService.error(
        'Cannot Delete',
        `Supplier "${supplier.name}" has existing purchase orders. Delete or reassign the purchase orders first.`
      );
      return;
    }

    const confirmed = await this.confirmDialogService.confirmDelete('supplier', supplier.name);

    if (confirmed) {
      try {
        await this.supplierService.deleteSupplier(supplier.id);
        this.toastService.success('Deleted', `Supplier "${supplier.name}" has been deleted`);
        this.loadSuppliers();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete supplier';
        this.toastService.error('Error', errorMessage);
        console.error('Failed to delete supplier:', error);
      }
    }
  }
}
