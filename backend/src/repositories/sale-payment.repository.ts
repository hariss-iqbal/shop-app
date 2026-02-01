import { SupabaseClient } from '@supabase/supabase-js';
import { SalePayment, SalePaymentInsert, SalePaymentUpdate, ReceiptPayment, ReceiptPaymentInsert } from '../entities/sale-payment.entity';

/**
 * Sale Payment Repository
 * Handles database operations for sale payment records
 * Table: sale_payments
 * Feature: F-018 Payment Method Integration
 */
export class SalePaymentRepository {
  private readonly tableName = 'sale_payments';

  constructor(private readonly supabase: SupabaseClient) {}

  async findBySaleId(saleId: string): Promise<SalePayment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('sale_id', saleId)
      .order('amount', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<SalePayment | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(payment: SalePaymentInsert): Promise<SalePayment> {
    // Calculate change for cash payments
    if (payment.payment_method === 'cash' && payment.cash_tendered && payment.cash_tendered > payment.amount) {
      payment.change_given = payment.cash_tendered - payment.amount;
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(payment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createMany(payments: SalePaymentInsert[]): Promise<SalePayment[]> {
    // Calculate change for cash payments
    const paymentsWithChange = payments.map(p => {
      if (p.payment_method === 'cash' && p.cash_tendered && p.cash_tendered > p.amount) {
        return { ...p, change_given: p.cash_tendered - p.amount };
      }
      return p;
    });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(paymentsWithChange)
      .select();

    if (error) throw error;
    return data || [];
  }

  async update(id: string, payment: SalePaymentUpdate): Promise<SalePayment> {
    // Recalculate change if cash_tendered is updated
    if (payment.payment_method === 'cash' && payment.cash_tendered !== undefined && payment.amount !== undefined) {
      if (payment.cash_tendered > payment.amount) {
        payment.change_given = payment.cash_tendered - payment.amount;
      } else {
        payment.change_given = 0;
      }
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(payment)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteBySaleId(saleId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('sale_id', saleId);

    if (error) throw error;
  }

  async getTotalPaidForSale(saleId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('amount')
      .eq('sale_id', saleId);

    if (error) throw error;
    return (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  }
}

/**
 * Receipt Payment Repository
 * Handles database operations for receipt payment records
 * Table: receipt_payments
 * Feature: F-018 Payment Method Integration
 */
export class ReceiptPaymentRepository {
  private readonly tableName = 'receipt_payments';

  constructor(private readonly supabase: SupabaseClient) {}

  async findByReceiptId(receiptId: string): Promise<ReceiptPayment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('receipt_id', receiptId)
      .order('amount', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(payment: ReceiptPaymentInsert): Promise<ReceiptPayment> {
    // Calculate change for cash payments
    if (payment.payment_method === 'cash' && payment.cash_tendered && payment.cash_tendered > payment.amount) {
      payment.change_given = payment.cash_tendered - payment.amount;
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(payment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createMany(payments: ReceiptPaymentInsert[]): Promise<ReceiptPayment[]> {
    const paymentsWithChange = payments.map(p => {
      if (p.payment_method === 'cash' && p.cash_tendered && p.cash_tendered > p.amount) {
        return { ...p, change_given: p.cash_tendered - p.amount };
      }
      return p;
    });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(paymentsWithChange)
      .select();

    if (error) throw error;
    return data || [];
  }

  async deleteByReceiptId(receiptId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('receipt_id', receiptId);

    if (error) throw error;
  }
}
