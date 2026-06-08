import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

import { ExpenseService } from '../../../core/services/expense.service';
import { StoreLocationService } from '../../../core/services/store-location.service';
import { UserLocationAssignmentService } from '../../../core/services/user-location-assignment.service';
import { SupabaseAuthService } from '../../../core/services/supabase-auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirmation.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { Expense, ExpenseDayGroup } from '../../../models/expense.model';
import { StoreLocation } from '../../../models/store-location.model';
import { ExpenseFormDialogComponent } from './expense-form-dialog.component';

@Component({
  selector: 'app-expense-list',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    SkeletonModule,
    TooltipModule,
    TagModule,
    DatePipe,
    AppCurrencyPipe,
    ExpenseFormDialogComponent
  ],
  templateUrl: './expense-list.component.html'
})
export class ExpenseListComponent implements OnInit {
  constructor(
    private expenseService: ExpenseService,
    private storeLocationService: StoreLocationService,
    private userLocationService: UserLocationAssignmentService,
    public authService: SupabaseAuthService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService
  ) { }

  locations = signal<StoreLocation[]>([]);
  selectedLocationId: string | null = null;
  dayGroups = signal<ExpenseDayGroup[]>([]);
  loading = signal(false);
  private expandedDates = signal<Set<string>>(new Set());

  showFormDialog = signal(false);
  selectedExpense = signal<Expense | null>(null);

  readonly skeletonRows = Array(4).fill({});

  readonly canManage = this.authService.isManagerOrAdmin;

  readonly selectedLocation = computed(() =>
    this.locations().find(l => l.id === this.selectedLocationId) || null
  );

  readonly monthTotal = computed(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.dayGroups()
      .filter(g => g.date.startsWith(prefix))
      .reduce((sum, g) => sum + g.total, 0);
  });

  readonly todayTotal = computed(() => {
    const today = ExpenseService.toDateString(new Date());
    return this.dayGroups().find(g => g.date === today)?.total ?? 0;
  });

  readonly entryCount = computed(() =>
    this.dayGroups().reduce((sum, g) => sum + g.items.length, 0)
  );

  async ngOnInit(): Promise<void> {
    await this.loadLocations();
  }

  async loadLocations(): Promise<void> {
    try {
      const locations = await this.storeLocationService.getActiveLocations();
      this.locations.set(locations);

      const current = this.userLocationService.currentLocationId();
      this.selectedLocationId =
        (current && locations.some(l => l.id === current) ? current : null) ||
        locations.find(l => l.isPrimary)?.id ||
        locations[0]?.id ||
        null;

      if (this.selectedLocationId) {
        await this.loadExpenses();
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load shops');
      console.error('Failed to load locations:', error);
    }
  }

  async loadExpenses(): Promise<void> {
    if (!this.selectedLocationId) {
      this.dayGroups.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const groups = await this.expenseService.getExpensesGroupedByDay({
        locationId: this.selectedLocationId
      });
      this.dayGroups.set(groups);

      // Expand the most recent day by default; keep any still-present days expanded.
      const valid = new Set(groups.map(g => g.date));
      const next = new Set([...this.expandedDates()].filter(d => valid.has(d)));
      if (next.size === 0 && groups.length > 0) {
        next.add(groups[0].date);
      }
      this.expandedDates.set(next);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load expenses');
      console.error('Failed to load expenses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onLocationChange(): void {
    this.expandedDates.set(new Set());
    if (this.selectedLocationId) {
      this.userLocationService.setCurrentLocation(this.selectedLocationId);
    }
    this.loadExpenses();
  }

  toggleDay(date: string): void {
    const next = new Set(this.expandedDates());
    next.has(date) ? next.delete(date) : next.add(date);
    this.expandedDates.set(next);
  }

  isExpanded(date: string): boolean {
    return this.expandedDates().has(date);
  }

  openCreateDialog(): void {
    if (!this.selectedLocationId) {
      this.toastService.warn('No shop selected', 'Add a store location first');
      return;
    }
    this.selectedExpense.set(null);
    this.showFormDialog.set(true);
  }

  editExpense(expense: Expense): void {
    this.selectedExpense.set(expense);
    this.showFormDialog.set(true);
  }

  async confirmDelete(expense: Expense): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      header: 'Delete Expense',
      message: `Delete "${expense.description}" (${expense.amount})?`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      icon: 'pi pi-trash'
    });

    if (confirmed) {
      await this.deleteExpense(expense);
    }
  }

  private async deleteExpense(expense: Expense): Promise<void> {
    try {
      await this.expenseService.deleteExpense(expense.id);
      this.toastService.success('Deleted', 'Expense removed');
      await this.loadExpenses();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete expense';
      this.toastService.error('Error', message);
      console.error('Failed to delete expense:', error);
    }
  }

  async onExpenseSaved(): Promise<void> {
    this.toastService.success(
      this.selectedExpense() ? 'Updated' : 'Added',
      this.selectedExpense() ? 'Expense updated' : 'Expense added'
    );
    await this.loadExpenses();
  }
}
