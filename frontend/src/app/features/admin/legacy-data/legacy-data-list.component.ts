import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

import { LegacyBillService } from '../../../core/services/legacy-bill.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { LegacyBill } from '../../../models/legacy-bill.model';

@Component({
  selector: 'app-legacy-data-list',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SkeletonModule,
    TagModule,
    DatePipe,
    AppCurrencyPipe,
  ],
  templateUrl: './legacy-data-list.component.html'
})
export class LegacyDataListComponent implements OnInit {
  constructor(
    private legacyBillService: LegacyBillService,
    private toastService: ToastService
  ) {}

  bills = signal<LegacyBill[]>([]);
  totalBills = signal(0);
  loading = signal(false);
  readonly skeletonRows = Array(10).fill({});

  searchQuery = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.legacyBillService.getLegacyBills({
        search: this.searchQuery.trim() || undefined,
        limit: 1000,
      });
      this.bills.set(response.data);
      this.totalBills.set(response.total);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load legacy bills');
      console.error('Failed to load legacy bills:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadData(), 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadData();
  }

  getSeverityTag(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (severity?.toUpperCase()) {
      case 'OK': return 'success';
      case 'INFO': return 'info';
      case 'WARNING': return 'warn';
      case 'ERROR': return 'danger';
      default: return 'secondary';
    }
  }
}
