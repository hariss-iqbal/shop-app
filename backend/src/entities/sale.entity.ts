import { PaymentMethod } from '../enums';
import { PaymentSummaryJson } from './sale-payment.entity';

/**
 * Sale Entity
 * Records a completed phone sale
 * Database table: sales
 * Owner Module: M-07 Sales
 * Feature: F-018 Payment Method Integration
 */
export interface Sale {
  id: string;
  phone_id: string;
  sale_date: string;
  sale_price: number;
  cost_price: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  /** Tax rate applied to this sale (captured at time of sale) */
  tax_rate: number;
  /** Calculated tax amount for this sale */
  tax_amount: number;
  /** Base price before tax (for tax-inclusive items, this is the extracted base) */
  base_price: number | null;
  /** Whether this sale was for a tax-exempt item */
  is_tax_exempt: boolean;
  /** Payment summary (JSONB array of payment details) - Feature: F-018 */
  payment_summary: PaymentSummaryJson[];
  /** Whether this sale used multiple payment methods - Feature: F-018 */
  is_split_payment: boolean;
  /** The primary payment method (method with largest amount) - Feature: F-018 */
  primary_payment_method: PaymentMethod | null;
  /** Location where the sale occurred - Feature: F-024 */
  location_id: string | null;
}

export interface SaleInsert {
  id?: string;
  phone_id: string;
  sale_date: string;
  sale_price: number;
  cost_price: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
  tax_rate?: number;
  tax_amount?: number;
  base_price?: number | null;
  is_tax_exempt?: boolean;
  /** Payment summary (JSONB array) - Feature: F-018 */
  payment_summary?: PaymentSummaryJson[];
  /** Whether this sale used multiple payment methods - Feature: F-018 */
  is_split_payment?: boolean;
  /** The primary payment method - Feature: F-018 */
  primary_payment_method?: PaymentMethod | null;
  /** Location where the sale occurred - Feature: F-024 */
  location_id?: string | null;
}

export interface SaleUpdate {
  id?: string;
  phone_id?: string;
  sale_date?: string;
  sale_price?: number;
  cost_price?: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  tax_rate?: number;
  tax_amount?: number;
  base_price?: number | null;
  is_tax_exempt?: boolean;
  /** Payment summary (JSONB array) - Feature: F-018 */
  payment_summary?: PaymentSummaryJson[];
  /** Whether this sale used multiple payment methods - Feature: F-018 */
  is_split_payment?: boolean;
  /** The primary payment method - Feature: F-018 */
  primary_payment_method?: PaymentMethod | null;
  /** Location where the sale occurred - Feature: F-024 */
  location_id?: string | null;
}

export interface SaleWithRelations extends Sale {
  phone?: {
    id: string;
    model: string;
    brand: {
      id: string;
      name: string;
    };
  };
  /** Related payment records - Feature: F-018 */
  payments?: Array<{
    id: string;
    payment_method: PaymentMethod;
    amount: number;
    cash_tendered: number | null;
    change_given: number | null;
    card_last_four: string | null;
    transaction_reference: string | null;
  }>;
  /** Location relation - Feature: F-024 */
  location?: {
    id: string;
    name: string;
    code: string;
  } | null;
}
