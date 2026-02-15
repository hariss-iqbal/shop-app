import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';

import { CustomerService } from '../../../core/services/customer.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirmation.service';
import { CustomerWithStats, CustomerFilter } from '../../../models/customer.model';
import { CustomerFormDialogComponent } from './customer-form-dialog.component';
import { CustomerDetailDialogComponent } from './customer-detail-dialog.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-customer-list',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    TooltipModule,
    SkeletonModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    DatePipe,
    AppCurrencyPipe,
    CustomerFormDialogComponent,
    CustomerDetailDialogComponent
  ],
  templateUrl: './customer-list.component.html'
})
export class CustomerListComponent implements OnInit {
  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService
  ) { }

  customers = signal<CustomerWithStats[]>([]);
  loading = signal(false);
  totalCustomers = signal(0);
  readonly skeletonRows = Array(5).fill({});

  searchQuery = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  showFormDialog = signal(false);
  showDetailDialog = signal(false);
  selectedCustomer = signal<CustomerWithStats | null>(null);
  selectedCustomerId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      const filter: CustomerFilter = {};
      if (this.searchQuery.trim()) {
        filter.search = this.searchQuery.trim();
      }

      const response = await this.customerService.getCustomers(filter);
      this.customers.set(response.data);
      this.totalCustomers.set(response.total);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load customers');
      console.error('Failed to load customers:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadData();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadData();
  }

  openCreateDialog(): void {
    this.selectedCustomer.set(null);
    this.showFormDialog.set(true);
  }

  viewCustomer(customer: CustomerWithStats): void {
    this.selectedCustomerId.set(customer.id);
    this.showDetailDialog.set(true);
  }

  editCustomer(customer: CustomerWithStats): void {
    this.selectedCustomer.set(customer);
    this.showFormDialog.set(true);
  }

  editCustomerFromDetail(customerId: string): void {
    const customer = this.customers().find(c => c.id === customerId);
    if (customer) {
      this.showDetailDialog.set(false);
      this.editCustomer(customer);
    }
  }

  async confirmDelete(customer: CustomerWithStats): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      header: 'Delete Customer',
      message: `Are you sure you want to delete ${customer.name}?`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      icon: 'pi pi-trash'
    });

    if (confirmed) {
      await this.deleteCustomer(customer);
    }
  }

  async deleteCustomer(customer: CustomerWithStats): Promise<void> {
    try {
      await this.customerService.deleteCustomer(customer.id);
      this.toastService.success('Deleted', `${customer.name} has been deleted`);
      this.loadData();
    } catch (error) {
      this.toastService.error('Error', 'Failed to delete customer');
      console.error('Failed to delete customer:', error);
    }
  }

  onCustomerSaved(customer: CustomerWithStats): void {
    if (this.selectedCustomer()) {
      this.toastService.success('Updated', `${customer.name} has been updated`);
    } else {
      this.toastService.success('Created', `${customer.name} has been added`);
    }
    this.loadData();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatPhone(phone: string): string {
    if (phone.length === 10) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    return phone;
  }

  activeCustomers(): number {
    return this.customers().filter(c => c.totalTransactions > 0).length;
  }

  totalRevenue(): number {
    return this.customers().reduce((sum, c) => sum + c.totalSpent, 0);
  }
}
