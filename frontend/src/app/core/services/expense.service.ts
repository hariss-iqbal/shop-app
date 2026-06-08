import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Expense,
  ExpenseFilter,
  ExpenseDayGroup,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  GrandProfitRow,
  GrandProfitGroupBy
} from '../../models/expense.model';

/**
 * Expense Service
 * Daily shop expenses (per location) + Grand Profit reporting.
 * Feature: F-026 Daily Expenses Tracking
 */
@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  constructor(private supabase: SupabaseService) { }

  /**
   * List expenses (newest first), optionally filtered by location/date range.
   * Uses the get_expenses RPC because it joins the creator's email
   * (auth.users is not directly queryable via PostgREST).
   */
  async getExpenses(filter?: ExpenseFilter): Promise<Expense[]> {
    const { data, error } = await this.supabase.rpc('get_expenses', {
      p_location_id: filter?.locationId ?? null,
      p_start_date: filter?.startDate ?? null,
      p_end_date: filter?.endDate ?? null
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row: Record<string, unknown>) => this.mapToExpense(row));
  }

  /** Convenience: expenses grouped by day with daily totals (for the list view). */
  async getExpensesGroupedByDay(filter?: ExpenseFilter): Promise<ExpenseDayGroup[]> {
    const expenses = await this.getExpenses(filter);
    return this.groupByDay(expenses);
  }

  groupByDay(expenses: Expense[]): ExpenseDayGroup[] {
    const groups = new Map<string, ExpenseDayGroup>();

    for (const expense of expenses) {
      let group = groups.get(expense.expenseDate);
      if (!group) {
        group = {
          date: expense.expenseDate,
          dayName: this.dayName(expense.expenseDate),
          total: 0,
          items: []
        };
        groups.set(expense.expenseDate, group);
      }
      group.items.push(expense);
      group.total += expense.amount;
    }

    // getExpenses already returns rows newest-first, so insertion order is date-desc.
    return Array.from(groups.values());
  }

  async createExpense(request: CreateExpenseRequest): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert({
        location_id: request.locationId,
        amount: request.amount,
        description: request.description.trim(),
        expense_date: request.expenseDate
      })
      .select()
      .single();

    if (error) {
      throw new Error(this.friendlyError(error));
    }

    return this.mapToExpense(data);
  }

  async updateExpense(id: string, request: UpdateExpenseRequest): Promise<Expense> {
    const updateData: Record<string, unknown> = {};
    if (request.amount !== undefined) updateData['amount'] = request.amount;
    if (request.description !== undefined) updateData['description'] = request.description.trim();
    if (request.expenseDate !== undefined) updateData['expense_date'] = request.expenseDate;

    const { data, error } = await this.supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(this.friendlyError(error));
    }

    return this.mapToExpense(data);
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(this.friendlyError(error));
    }
  }

  /** Grand Profit = sales profit (sale_price - cost_price) - expenses, per day or month. */
  async getGrandProfit(
    filter?: ExpenseFilter,
    groupBy: GrandProfitGroupBy = 'day'
  ): Promise<GrandProfitRow[]> {
    const { data, error } = await this.supabase.rpc('get_grand_profit', {
      p_start_date: filter?.startDate ?? null,
      p_end_date: filter?.endDate ?? null,
      p_location_id: filter?.locationId ?? null,
      p_group_by: groupBy
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      period: row['period'] as string,
      salesCount: Number(row['sales_count'] ?? 0),
      salesRevenue: Number(row['sales_revenue'] ?? 0),
      salesCost: Number(row['sales_cost'] ?? 0),
      salesProfit: Number(row['sales_profit'] ?? 0),
      expensesTotal: Number(row['expenses_total'] ?? 0),
      grandProfit: Number(row['grand_profit'] ?? 0)
    }));
  }

  /** Formats a Date as a local YYYY-MM-DD string (avoids UTC off-by-one). */
  static toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private dayName(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d); // local date, no TZ shift
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  private friendlyError(error: { message?: string; code?: string }): string {
    const msg = error?.message ?? 'Failed to save expense';
    if (msg.includes('future')) {
      return 'Expense date cannot be in the future';
    }
    if (error?.code === '42501' || msg.toLowerCase().includes('row-level security')) {
      return 'You do not have permission to modify expenses';
    }
    return msg;
  }

  private mapToExpense(data: Record<string, unknown>): Expense {
    return {
      id: data['id'] as string,
      locationId: data['location_id'] as string,
      locationName: (data['location_name'] as string) ?? null,
      amount: Number(data['amount'] ?? 0),
      description: data['description'] as string,
      expenseDate: data['expense_date'] as string,
      createdBy: (data['created_by'] as string) ?? null,
      createdByEmail: (data['created_by_email'] as string) ?? null,
      createdAt: data['created_at'] as string,
      updatedAt: (data['updated_at'] as string) ?? null
    };
  }
}
