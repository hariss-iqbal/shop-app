/**
 * Expense models
 * Feature: F-026 Daily Expenses Tracking
 */

export interface Expense {
  id: string;
  locationId: string;
  locationName: string | null;
  amount: number;
  description: string;
  expenseDate: string; // YYYY-MM-DD
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateExpenseRequest {
  locationId: string;
  amount: number;
  description: string;
  expenseDate: string; // YYYY-MM-DD
}

export interface UpdateExpenseRequest {
  amount?: number;
  description?: string;
  expenseDate?: string; // YYYY-MM-DD
}

export interface ExpenseFilter {
  locationId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

/** A single day's expenses, rolled up for the list view. */
export interface ExpenseDayGroup {
  date: string;     // YYYY-MM-DD
  dayName: string;  // e.g. "Saturday"
  total: number;
  items: Expense[];
}

/** One row of the Grand Profit report (per day or per month). */
export interface GrandProfitRow {
  period: string;      // YYYY-MM-DD (day, or first-of-month for monthly grouping)
  salesCount: number;
  salesRevenue: number;
  salesCost: number;
  salesProfit: number;
  expensesTotal: number;
  grandProfit: number;
}

export type GrandProfitGroupBy = 'day' | 'month';

export const EXPENSE_VALIDATION = {
  DESCRIPTION_MAX: 500,
  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 9_999_999_999.99 // fits DECIMAL(12,2)
} as const;
