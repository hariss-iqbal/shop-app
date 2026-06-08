import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';

import { ExpenseService } from '../../../core/services/expense.service';
import { StoreLocationService } from '../../../core/services/store-location.service';
import { UserLocationAssignmentService } from '../../../core/services/user-location-assignment.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { GrandProfitRow, GrandProfitGroupBy } from '../../../models/expense.model';

interface SelectOption<T> { label: string; value: T; }

@Component({
  selector: 'app-grand-profit',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    TableModule,
    SkeletonModule,
    DatePipe,
    AppCurrencyPipe
  ],
  templateUrl: './grand-profit.component.html'
})
export class GrandProfitComponent implements OnInit {
  constructor(
    private expenseService: ExpenseService,
    private storeLocationService: StoreLocationService,
    private userLocationService: UserLocationAssignmentService,
    private toastService: ToastService
  ) { }

  rows = signal<GrandProfitRow[]>([]);
  loading = signal(false);

  locationOptions = signal<SelectOption<string | null>[]>([{ label: 'All Shops', value: null }]);
  selectedLocationId: string | null = null;

  readonly groupByOptions: SelectOption<GrandProfitGroupBy>[] = [
    { label: 'Day', value: 'day' },
    { label: 'Month', value: 'month' }
  ];
  groupBy: GrandProfitGroupBy = 'day';

  readonly maxDate = new Date();
  // Default range: start of the current month → today.
  dateRange: Date[] = [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()];

  readonly skeletonRows = Array(5).fill({});

  readonly totalSalesProfit = computed(() => this.rows().reduce((s, r) => s + r.salesProfit, 0));
  readonly totalExpenses = computed(() => this.rows().reduce((s, r) => s + r.expensesTotal, 0));
  readonly totalGrandProfit = computed(() => this.rows().reduce((s, r) => s + r.grandProfit, 0));

  async ngOnInit(): Promise<void> {
    await this.loadLocations();
    await this.load();
  }

  private async loadLocations(): Promise<void> {
    try {
      const locations = await this.storeLocationService.getActiveLocations();
      this.locationOptions.set([
        { label: 'All Shops', value: null },
        ...locations.map(l => ({ label: l.name, value: l.id }))
      ]);
      const current = this.userLocationService.currentLocationId();
      this.selectedLocationId = current && locations.some(l => l.id === current) ? current : null;
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [start, end] = this.dateRange ?? [];
      const rows = await this.expenseService.getGrandProfit(
        {
          locationId: this.selectedLocationId ?? undefined,
          startDate: start ? ExpenseService.toDateString(start) : undefined,
          endDate: end ? ExpenseService.toDateString(end) : undefined
        },
        this.groupBy
      );
      this.rows.set(rows);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load grand profit');
      console.error('Failed to load grand profit:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(): void {
    // Only reload once a full range (start + end) is selected.
    const [start, end] = this.dateRange ?? [];
    if (this.dateRange && start && !end) {
      return;
    }
    this.load();
  }
}
