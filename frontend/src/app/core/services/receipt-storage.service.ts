import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  StoredReceipt,
  StoredReceiptItem,
  CreateReceiptRequest,
  ReceiptListResponse,
  ReceiptFilter,
  ReceiptData,
  ReceiptExportOptions
} from '../../models/sale.model';

/**
 * Receipt Storage Service
 * Handles persistent storage and retrieval of receipts
 * Feature: F-005 Receipt Storage and Retrieval
 */
@Injectable({
  providedIn: 'root'
})
export class ReceiptStorageService {
  private supabase = inject(SupabaseService);

  async getReceipts(filter?: ReceiptFilter): Promise<ReceiptListResponse> {
    const limit = filter?.limit || 20;
    const page = filter?.page || 1;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('receipts')
      .select(`
        *,
        items:receipt_items(*)
      `, { count: 'exact' });

    if (filter?.receiptNumber) {
      query = query.ilike('receipt_number', `%${filter.receiptNumber}%`);
    }

    if (filter?.customerPhone) {
      const cleanedPhone = filter.customerPhone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }

    if (filter?.customerName) {
      query = query.ilike('customer_name', `%${filter.customerName}%`);
    }

    if (filter?.customerEmail) {
      query = query.ilike('customer_email', `%${filter.customerEmail}%`);
    }

    if (filter?.startDate) {
      query = query.gte('transaction_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('transaction_date', filter.endDate);
    }

    if (filter?.minAmount !== undefined) {
      query = query.gte('grand_total', filter.minAmount);
    }

    if (filter?.maxAmount !== undefined) {
      query = query.lte('grand_total', filter.maxAmount);
    }

    const sortField = this.mapSortField(filter?.sortField);
    const ascending = filter?.sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToStoredReceipt),
      total: count || 0
    };
  }

  private mapSortField(field?: string): string {
    const fieldMap: Record<string, string> = {
      'transactionDate': 'transaction_date',
      'grandTotal': 'grand_total',
      'receiptNumber': 'receipt_number',
      'createdAt': 'created_at'
    };
    return fieldMap[field || ''] || 'created_at';
  }

  async getReceiptById(id: string): Promise<StoredReceipt | null> {
    const { data, error } = await this.supabase
      .from('receipts')
      .select(`
        *,
        items:receipt_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToStoredReceipt(data);
  }

  async getReceiptByNumber(receiptNumber: string): Promise<StoredReceipt | null> {
    const { data, error } = await this.supabase
      .from('receipts')
      .select(`
        *,
        items:receipt_items(*)
      `)
      .eq('receipt_number', receiptNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToStoredReceipt(data);
  }

  /**
   * Get all receipts for a customer by phone number
   * Returns receipts in chronological order (newest first for practical admin use)
   * Feature: F-005 Receipt Storage and Retrieval - AC4
   */
  async getReceiptsByCustomerPhone(customerPhone: string): Promise<ReceiptListResponse> {
    const cleanedPhone = customerPhone.replace(/[^\d]/g, '');

    const { data, error, count } = await this.supabase
      .from('receipts')
      .select(`
        *,
        items:receipt_items(*)
      `, { count: 'exact' })
      .ilike('customer_phone', `%${cleanedPhone}%`)
      .order('transaction_date', { ascending: false })
      .order('transaction_time', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToStoredReceipt),
      total: count || 0
    };
  }

  async createReceipt(request: CreateReceiptRequest): Promise<StoredReceipt> {
    const { data: receipt, error: receiptError } = await this.supabase
      .from('receipts')
      .insert({
        receipt_number: request.receiptNumber,
        transaction_date: request.transactionDate,
        transaction_time: request.transactionTime,
        subtotal: request.subtotal,
        tax_rate: request.taxRate || 0,
        tax_amount: request.taxAmount || 0,
        grand_total: request.grandTotal,
        customer_name: request.customerName?.trim() || null,
        customer_phone: request.customerPhone?.trim() || null,
        customer_email: request.customerEmail?.trim() || null,
        notes: request.notes?.trim() || null
      })
      .select()
      .single();

    if (receiptError) {
      throw new Error(receiptError.message);
    }

    if (request.items.length > 0) {
      const receiptItems = request.items.map(item => ({
        receipt_id: receipt.id,
        sale_id: item.saleId || null,
        item_name: item.itemName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total
      }));

      const { error: itemsError } = await this.supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) {
        throw new Error(itemsError.message);
      }
    }

    const storedReceipt = await this.getReceiptById(receipt.id);
    return storedReceipt!;
  }

  async createReceiptFromReceiptData(
    receiptData: ReceiptData,
    saleIds?: string[]
  ): Promise<StoredReceipt> {
    const request: CreateReceiptRequest = {
      receiptNumber: receiptData.receiptNumber,
      transactionDate: this.formatDateForDb(receiptData.transactionDate),
      transactionTime: receiptData.transactionTime,
      subtotal: receiptData.subtotal,
      taxRate: receiptData.taxRate,
      taxAmount: receiptData.taxAmount,
      grandTotal: receiptData.grandTotal,
      customerName: receiptData.customerName,
      customerPhone: receiptData.customerPhone,
      customerEmail: receiptData.customerEmail,
      notes: receiptData.notes,
      items: receiptData.items.map((item, index) => ({
        saleId: saleIds?.[index] || null,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      }))
    };

    return this.createReceipt(request);
  }

  async deleteReceipt(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  convertToReceiptData(storedReceipt: StoredReceipt): ReceiptData {
    return {
      receiptNumber: storedReceipt.receiptNumber,
      transactionDate: this.formatDateForDisplay(storedReceipt.transactionDate),
      transactionTime: this.formatTimeForDisplay(storedReceipt.transactionTime),
      items: storedReceipt.items.map(item => ({
        name: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        basePrice: item.basePrice,
        isTaxExempt: item.isTaxExempt
      })),
      subtotal: storedReceipt.subtotal,
      taxRate: storedReceipt.taxRate,
      taxAmount: storedReceipt.taxAmount,
      grandTotal: storedReceipt.grandTotal,
      customerName: storedReceipt.customerName,
      customerPhone: storedReceipt.customerPhone,
      customerEmail: storedReceipt.customerEmail,
      notes: storedReceipt.notes
    };
  }

  private mapToStoredReceipt(data: Record<string, unknown>): StoredReceipt {
    const items = data['items'] as Array<Record<string, unknown>> | undefined;

    const mappedItems: StoredReceiptItem[] = (items || []).map(item => ({
      id: item['id'] as string,
      saleId: item['sale_id'] as string | null,
      itemName: item['item_name'] as string,
      quantity: item['quantity'] as number,
      unitPrice: item['unit_price'] as number,
      total: item['total'] as number,
      taxRate: (item['tax_rate'] as number) ?? 0,
      taxAmount: (item['tax_amount'] as number) ?? 0,
      basePrice: (item['base_price'] as number) ?? item['unit_price'] as number,
      isTaxExempt: (item['is_tax_exempt'] as boolean) ?? false
    }));

    return {
      id: data['id'] as string,
      receiptNumber: data['receipt_number'] as string,
      transactionDate: data['transaction_date'] as string,
      transactionTime: data['transaction_time'] as string,
      subtotal: data['subtotal'] as number,
      taxRate: data['tax_rate'] as number,
      taxAmount: data['tax_amount'] as number,
      grandTotal: data['grand_total'] as number,
      customerName: data['customer_name'] as string | null,
      customerPhone: data['customer_phone'] as string | null,
      customerEmail: data['customer_email'] as string | null,
      notes: data['notes'] as string | null,
      items: mappedItems,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }

  private formatDateForDb(displayDate: string): string {
    const date = new Date(displayDate);
    if (isNaN(date.getTime())) {
      return displayDate;
    }
    return date.toISOString().split('T')[0];
  }

  private formatDateForDisplay(dbDate: string): string {
    const date = new Date(dbDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatTimeForDisplay(dbTime: string): string {
    const [hours, minutes] = dbTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  async exportReceipts(options: ReceiptExportOptions): Promise<void> {
    let query = this.supabase
      .from('receipts')
      .select(`
        *,
        items:receipt_items(*)
      `);

    const filter = options.filters;
    if (filter?.receiptNumber) {
      query = query.ilike('receipt_number', `%${filter.receiptNumber}%`);
    }
    if (filter?.customerPhone) {
      const cleanedPhone = filter.customerPhone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }
    if (filter?.customerName) {
      query = query.ilike('customer_name', `%${filter.customerName}%`);
    }
    if (filter?.customerEmail) {
      query = query.ilike('customer_email', `%${filter.customerEmail}%`);
    }
    if (filter?.startDate) {
      query = query.gte('transaction_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('transaction_date', filter.endDate);
    }
    if (filter?.minAmount !== undefined) {
      query = query.gte('grand_total', filter.minAmount);
    }
    if (filter?.maxAmount !== undefined) {
      query = query.lte('grand_total', filter.maxAmount);
    }

    const sortField = this.mapSortField(filter?.sortField);
    const ascending = filter?.sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const receipts = (data || []).map(this.mapToStoredReceipt);
    const content = options.format === 'json'
      ? this.toJson(receipts, options.includeItems)
      : this.toCsv(receipts, options.includeItems);

    const timestamp = new Date().toISOString().split('T')[0];
    const extension = options.format === 'json' ? 'json' : 'csv';
    const contentType = options.format === 'json' ? 'application/json' : 'text/csv';
    const filename = `receipts-export-${timestamp}.${extension}`;

    this.downloadFile(content, filename, contentType);
  }

  private toJson(receipts: StoredReceipt[], includeItems?: boolean): string {
    const exportData = receipts.map(receipt => {
      const base: Record<string, unknown> = {
        receiptNumber: receipt.receiptNumber,
        transactionDate: receipt.transactionDate,
        transactionTime: receipt.transactionTime,
        customerName: receipt.customerName,
        customerPhone: receipt.customerPhone,
        customerEmail: receipt.customerEmail,
        subtotal: receipt.subtotal,
        taxRate: receipt.taxRate,
        taxAmount: receipt.taxAmount,
        grandTotal: receipt.grandTotal,
        notes: receipt.notes,
        createdAt: receipt.createdAt
      };

      if (includeItems) {
        base['items'] = receipt.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }));
      }

      return base;
    });

    return JSON.stringify(exportData, null, 2);
  }

  private toCsv(receipts: StoredReceipt[], includeItems?: boolean): string {
    const headers = [
      'Receipt Number',
      'Transaction Date',
      'Transaction Time',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Subtotal',
      'Tax Rate',
      'Tax Amount',
      'Grand Total',
      'Item Count',
      'Notes',
      'Created At'
    ];

    if (includeItems) {
      headers.push('Items');
    }

    const rows = receipts.map(receipt => {
      const row = [
        this.escapeCsvField(receipt.receiptNumber),
        receipt.transactionDate,
        receipt.transactionTime,
        this.escapeCsvField(receipt.customerName || ''),
        this.escapeCsvField(receipt.customerPhone || ''),
        this.escapeCsvField(receipt.customerEmail || ''),
        receipt.subtotal.toFixed(2),
        receipt.taxRate.toFixed(2),
        receipt.taxAmount.toFixed(2),
        receipt.grandTotal.toFixed(2),
        receipt.items.length.toString(),
        this.escapeCsvField(receipt.notes || ''),
        receipt.createdAt
      ];

      if (includeItems) {
        const itemsStr = receipt.items
          .map(item => `${item.itemName} (Qty: ${item.quantity}, $${item.total.toFixed(2)})`)
          .join('; ');
        row.push(this.escapeCsvField(itemsStr));
      }

      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
