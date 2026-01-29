import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
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
  template: `
    <div class="grid">
      <div class="col-12 flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-4">
        <h1 class="text-3xl font-bold m-0">Suppliers</h1>
        <p-button label="Add Supplier" icon="pi pi-plus" routerLink="/admin/suppliers/new" styleClass="w-full sm:w-auto" />
      </div>

      <div class="col-12">
        <p-card>
          <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
            <span class="text-color-secondary text-sm" aria-live="polite">
              {{ suppliers().length }} supplier{{ suppliers().length !== 1 ? 's' : '' }}
            </span>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />
              <input
                pInputText
                type="text"
                placeholder="Search suppliers..."
                (input)="onGlobalFilter($event)"
                class="w-full md:w-20rem"
                aria-label="Search suppliers by name, contact person, phone, or email"
              />
            </p-iconfield>
          </div>

          <p-table
            #dt
            [value]="suppliers()"
            [loading]="loading()"
            [globalFilterFields]="['name', 'contactPerson', 'contactEmail', 'contactPhone']"
            [filterDelay]="300"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} suppliers"
            [rowHover]="true"
            dataKey="id"
            styleClass="p-datatable-sm"
            [scrollable]="true"
            scrollDirection="horizontal"
            [tableStyle]="{ 'min-width': '50rem' }"
            aria-label="Suppliers table"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="name">
                  Name
                  <p-sortIcon field="name" />
                </th>
                <th pSortableColumn="contactPerson">
                  Contact Person
                  <p-sortIcon field="contactPerson" />
                </th>
                <th pSortableColumn="contactPhone">
                  Phone
                  <p-sortIcon field="contactPhone" />
                </th>
                <th pSortableColumn="contactEmail">
                  Email
                  <p-sortIcon field="contactEmail" />
                </th>
                <th style="width: 10rem" alignFrozen="right" pFrozenColumn [frozen]="true">Actions</th>
              </tr>
            </ng-template>

            <ng-template #body let-supplier>
              <tr>
                <td>
                  <span class="font-medium">{{ supplier.name }}</span>
                </td>
                <td>
                  @if (supplier.contactPerson) {
                    {{ supplier.contactPerson }}
                  } @else {
                    <span class="text-color-secondary">-</span>
                  }
                </td>
                <td>
                  @if (supplier.contactPhone) {
                    <a [href]="'tel:' + supplier.contactPhone" class="text-primary no-underline hover:underline">
                      {{ supplier.contactPhone }}
                    </a>
                  } @else {
                    <span class="text-color-secondary">-</span>
                  }
                </td>
                <td>
                  @if (supplier.contactEmail) {
                    <a [href]="'mailto:' + supplier.contactEmail" class="text-primary no-underline hover:underline">
                      {{ supplier.contactEmail }}
                    </a>
                  } @else {
                    <span class="text-color-secondary">-</span>
                  }
                </td>
                <td alignFrozen="right" pFrozenColumn [frozen]="true">
                  <div class="flex align-items-center gap-1">
                    <p-button
                      icon="pi pi-eye"
                      [rounded]="true"
                      [text]="true"
                      severity="secondary"
                      size="small"
                      pTooltip="View Details"
                      tooltipPosition="top"
                      [attr.aria-label]="'View details for ' + supplier.name"
                      (onClick)="onEdit(supplier)"
                    />
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      size="small"
                      pTooltip="Edit"
                      tooltipPosition="top"
                      [attr.aria-label]="'Edit ' + supplier.name"
                      (onClick)="onEdit(supplier)"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      size="small"
                      pTooltip="Delete"
                      tooltipPosition="top"
                      [attr.aria-label]="'Delete ' + supplier.name"
                      (onClick)="onDelete(supplier)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="5" class="text-center p-4">
                  <div class="flex flex-column align-items-center gap-3">
                    <i class="pi pi-users text-4xl text-color-secondary"></i>
                    <span class="text-color-secondary">No suppliers found</span>
                    <p-button
                      label="Add Your First Supplier"
                      icon="pi pi-plus"
                      routerLink="/admin/suppliers/new"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #loadingbody>
              @for (_ of skeletonRows; track $index) {
                <tr>
                  <td><p-skeleton width="70%" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="50%" /></td>
                  <td><p-skeleton width="65%" /></td>
                  <td>
                    <div class="flex gap-1">
                      <p-skeleton shape="circle" size="2rem" />
                      <p-skeleton shape="circle" size="2rem" />
                      <p-skeleton shape="circle" size="2rem" />
                    </div>
                  </td>
                </tr>
              }
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </div>
  `
})
export class SupplierListComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private router = inject(Router);

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
