import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';

import { SaleService } from '../../../../core/services/sale.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CsvExportService, CsvColumn } from '../../../../shared/services/csv-export.service';
import { Sale, SaleFilter, SaleSummary } from '../../../../models/sale.model';

@Component({
  selector: 'app-sales-list',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DatePickerModule,
    SkeletonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe
  ],
  template: `
    <div class="grid">
      <div class="col-12 flex align-items-center justify-content-between mb-4">
        <h1 class="text-3xl font-bold m-0">Sales</h1>
        <p-button
          label="Export to CSV"
          icon="pi pi-download"
          severity="secondary"
          [outlined]="true"
          [disabled]="loading() || sales().length === 0"
          (onClick)="onExportCsv()"
          pTooltip="Export {{ hasActiveFilters() ? 'filtered' : 'all' }} sales data ({{ sales().length }} records)"
          tooltipPosition="left"
        />
      </div>

      <!-- Summary Statistics -->
      <div class="col-12 mb-4">
        <div class="grid">
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="50%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Total Revenue</span>
                    <span class="text-3xl font-bold">{{ summary()?.totalRevenue || 0 | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-blue-100 flex align-items-center justify-content-center">
                    <i class="pi pi-dollar text-blue-500 text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="50%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Total Cost</span>
                    <span class="text-3xl font-bold">{{ summary()?.totalCost || 0 | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-orange-100 flex align-items-center justify-content-center">
                    <i class="pi pi-wallet text-orange-500 text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="50%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Total Profit</span>
                    <span class="text-3xl font-bold" [class.text-green-500]="(summary()?.totalProfit || 0) >= 0" [class.text-red-500]="(summary()?.totalProfit || 0) < 0">
                      {{ summary()?.totalProfit || 0 | currency:'USD':'symbol':'1.2-2' }}
                    </span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-green-100 flex align-items-center justify-content-center">
                    <i class="pi pi-chart-line text-green-500 text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="50%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Avg. Margin</span>
                    <span class="text-3xl font-bold text-primary">{{ summary()?.averageMargin || 0 | number:'1.1-1' }}%</span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-primary-100 flex align-items-center justify-content-center">
                    <i class="pi pi-percentage text-primary text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
        </div>
      </div>

      <!-- Sales Table -->
      <div class="col-12">
        <p-card>
          <!-- Date Range Filter -->
          <div class="flex flex-column md:flex-row md:align-items-center gap-3 mb-4">
            <div class="flex align-items-center gap-2">
              <label for="startDate" class="font-medium white-space-nowrap">From:</label>
              <p-datepicker
                id="startDate"
                [(ngModel)]="startDate"
                (onSelect)="onDateFilterChange()"
                (onClear)="onDateFilterChange()"
                [showClear]="true"
                dateFormat="yy-mm-dd"
                placeholder="Start date"
                [showIcon]="true"
                styleClass="w-full md:w-12rem"
              />
            </div>
            <div class="flex align-items-center gap-2">
              <label for="endDate" class="font-medium white-space-nowrap">To:</label>
              <p-datepicker
                id="endDate"
                [(ngModel)]="endDate"
                (onSelect)="onDateFilterChange()"
                (onClear)="onDateFilterChange()"
                [showClear]="true"
                dateFormat="yy-mm-dd"
                placeholder="End date"
                [showIcon]="true"
                styleClass="w-full md:w-12rem"
              />
            </div>
            @if (hasActiveFilters()) {
              <p-button
                label="Clear Filters"
                icon="pi pi-filter-slash"
                severity="secondary"
                [text]="true"
                (onClick)="clearFilters()"
              />
            }
          </div>

          <!-- Table -->
          <p-table
            [value]="sales()"
            [loading]="loading()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} sales"
            [rowHover]="true"
            dataKey="id"
            styleClass="p-datatable-sm"
            [sortField]="'saleDate'"
            [sortOrder]="-1"
            [scrollable]="true"
            scrollDirection="horizontal"
            [tableStyle]="{ 'min-width': '55rem' }"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="brandName" style="width: 20%">
                  Phone
                  <p-sortIcon field="brandName" />
                </th>
                <th pSortableColumn="salePrice" style="width: 13%">
                  Sale Price
                  <p-sortIcon field="salePrice" />
                </th>
                <th pSortableColumn="costPrice" style="width: 13%">
                  Cost Price
                  <p-sortIcon field="costPrice" />
                </th>
                <th pSortableColumn="profit" style="width: 13%">
                  Profit
                  <p-sortIcon field="profit" />
                </th>
                <th pSortableColumn="buyerName" style="width: 17%">
                  Buyer
                  <p-sortIcon field="buyerName" />
                </th>
                <th pSortableColumn="saleDate" style="width: 14%">
                  Sale Date
                  <p-sortIcon field="saleDate" />
                </th>
                <th style="width: 10%" alignFrozen="right" pFrozenColumn [frozen]="true">Actions</th>
              </tr>
            </ng-template>

            <ng-template #body let-sale>
              <tr>
                <td>
                  <a
                    [routerLink]="['/admin/inventory', sale.phoneId, 'edit']"
                    class="font-medium text-primary no-underline hover:underline cursor-pointer"
                  >
                    {{ sale.brandName }} {{ sale.phoneName }}
                  </a>
                </td>
                <td>
                  <span class="font-medium">{{ sale.salePrice | currency:'USD':'symbol':'1.2-2' }}</span>
                </td>
                <td>{{ sale.costPrice | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>
                  <span
                    class="font-semibold"
                    [class.text-green-500]="sale.profit >= 0"
                    [class.text-red-500]="sale.profit < 0"
                  >
                    {{ sale.profit | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                </td>
                <td>
                  @if (sale.buyerName) {
                    {{ sale.buyerName }}
                  } @else {
                    <span class="text-color-secondary">-</span>
                  }
                </td>
                <td>{{ sale.saleDate | date:'mediumDate' }}</td>
                <td alignFrozen="right" pFrozenColumn [frozen]="true">
                  <div class="flex align-items-center gap-1">
                    <p-button
                      icon="pi pi-eye"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      size="small"
                      pTooltip="View Phone"
                      tooltipPosition="top"
                      (onClick)="onViewPhone(sale)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #footer>
              @if (sales().length > 0) {
                <tr>
                  <td class="font-bold">Totals</td>
                  <td class="font-bold">{{ summary()?.totalRevenue || 0 | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="font-bold">{{ summary()?.totalCost || 0 | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td>
                    <span
                      class="font-bold"
                      [class.text-green-500]="(summary()?.totalProfit || 0) >= 0"
                      [class.text-red-500]="(summary()?.totalProfit || 0) < 0"
                    >
                      {{ summary()?.totalProfit || 0 | currency:'USD':'symbol':'1.2-2' }}
                    </span>
                  </td>
                  <td class="font-bold" colspan="2">
                    Avg. Margin: {{ summary()?.averageMargin || 0 | number:'1.1-1' }}%
                  </td>
                  <td></td>
                </tr>
              }
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="text-center p-4">
                  <div class="flex flex-column align-items-center gap-3">
                    <i class="pi pi-shopping-cart text-4xl text-color-secondary"></i>
                    @if (hasActiveFilters()) {
                      <span class="text-color-secondary">No sales found for the selected date range</span>
                      <p-button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        severity="secondary"
                        (onClick)="clearFilters()"
                      />
                    } @else {
                      <span class="text-color-secondary">No sales recorded yet</span>
                    }
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #loadingbody>
              @for (_ of skeletonRows; track $index) {
                <tr>
                  <td><p-skeleton width="70%" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="55%" /></td>
                  <td><p-skeleton width="50%" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton shape="circle" size="2rem" /></td>
                </tr>
              }
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </div>
  `
})
export class SalesListComponent implements OnInit {
  private saleService = inject(SaleService);
  private toastService = inject(ToastService);
  private csvExportService = inject(CsvExportService);
  private router = inject(Router);

  sales = signal<Sale[]>([]);
  summary = signal<SaleSummary | null>(null);
  loading = signal(false);
  readonly skeletonRows = Array(5).fill({});

  startDate: Date | null = null;
  endDate: Date | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      const filter = this.buildFilter();
      const [salesResponse, summaryResponse] = await Promise.all([
        this.saleService.getSales(filter),
        this.saleService.getSummary(filter)
      ]);
      this.sales.set(salesResponse.data);
      this.summary.set(summaryResponse);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load sales data');
      console.error('Failed to load sales data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onDateFilterChange(): void {
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return this.startDate !== null || this.endDate !== null;
  }

  clearFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.loadData();
  }

  onViewPhone(sale: Sale): void {
    this.router.navigate(['/admin/inventory', sale.phoneId, 'edit']);
  }

  onExportCsv(): void {
    const columns: CsvColumn<Sale>[] = [
      { header: 'Brand', field: 'brandName' },
      { header: 'Model', field: 'phoneName' },
      { header: 'Sale Price', field: 'salePrice' },
      { header: 'Cost Price', field: 'costPrice' },
      { header: 'Profit', field: 'profit' },
      { header: 'Buyer Name', field: 'buyerName' },
      { header: 'Buyer Email', field: 'buyerEmail' },
      { header: 'Sale Date', field: 'saleDate' }
    ];

    this.csvExportService.exportToCsv(this.sales(), columns, 'sales_export');
    const message = this.hasActiveFilters()
      ? `${this.sales().length} filtered sales records exported to CSV`
      : `${this.sales().length} sales records exported to CSV`;
    this.toastService.success('Export Complete', message);
  }

  private buildFilter(): SaleFilter {
    const filter: SaleFilter = {};

    if (this.startDate) {
      filter.startDate = this.formatDate(this.startDate);
    }

    if (this.endDate) {
      filter.endDate = this.formatDate(this.endDate);
    }

    return filter;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
