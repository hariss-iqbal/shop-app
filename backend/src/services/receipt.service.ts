import { ReceiptRepository } from '../repositories/receipt.repository';
import { Receipt, ReceiptInsert, ReceiptUpdate, ReceiptWithItems, ReceiptItemInsert } from '../entities/receipt.entity';
import {
  CreateReceiptDto,
  UpdateReceiptDto,
  ReceiptResponseDto,
  ReceiptListResponseDto,
  ReceiptFilterDto,
  ReceiptSummaryDto,
  ReceiptItemResponseDto,
  ReceiptExportDto
} from '../dto/receipt.dto';

/**
 * Receipt Service
 * Business logic for Receipt entity
 * Feature: F-005 Receipt Storage and Retrieval
 */
export class ReceiptService {
  constructor(private readonly receiptRepository: ReceiptRepository) {}

  async findAll(filter?: ReceiptFilterDto): Promise<ReceiptListResponseDto> {
    const limit = filter?.limit || 20;
    const page = filter?.page || 1;
    const offset = (page - 1) * limit;

    const filterOptions = {
      receiptNumber: filter?.receiptNumber,
      customerPhone: filter?.customerPhone,
      customerName: filter?.customerName,
      customerEmail: filter?.customerEmail,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      minAmount: filter?.minAmount,
      maxAmount: filter?.maxAmount,
      sortField: filter?.sortField,
      sortOrder: filter?.sortOrder
    };

    const receipts = await this.receiptRepository.findAll({
      ...filterOptions,
      limit,
      offset
    });

    const total = await this.receiptRepository.count(filterOptions);

    return {
      data: receipts.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<ReceiptResponseDto | null> {
    const receipt = await this.receiptRepository.findById(id);
    return receipt ? this.toResponseDto(receipt) : null;
  }

  async findByReceiptNumber(receiptNumber: string): Promise<ReceiptResponseDto | null> {
    const receipt = await this.receiptRepository.findByReceiptNumber(receiptNumber);
    return receipt ? this.toResponseDto(receipt) : null;
  }

  async findByCustomerPhone(customerPhone: string): Promise<ReceiptListResponseDto> {
    const receipts = await this.receiptRepository.findByCustomerPhone(customerPhone);

    return {
      data: receipts.map(this.toResponseDto),
      total: receipts.length
    };
  }

  async create(dto: CreateReceiptDto): Promise<ReceiptResponseDto> {
    const existing = await this.receiptRepository.findByReceiptNumber(dto.receiptNumber);
    if (existing) {
      throw new Error(`Receipt with number "${dto.receiptNumber}" already exists`);
    }

    const receiptInsert: ReceiptInsert = {
      receipt_number: dto.receiptNumber,
      transaction_date: dto.transactionDate,
      transaction_time: dto.transactionTime,
      subtotal: dto.subtotal,
      tax_rate: dto.taxRate || 0,
      tax_amount: dto.taxAmount || 0,
      grand_total: dto.grandTotal,
      customer_name: dto.customerName?.trim() || null,
      customer_phone: dto.customerPhone?.trim() || null,
      customer_email: dto.customerEmail?.trim() || null,
      notes: dto.notes?.trim() || null
    };

    const items: Omit<ReceiptItemInsert, 'receipt_id'>[] = dto.items.map(item => ({
      sale_id: item.saleId || null,
      item_name: item.itemName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total
    }));

    const receipt = await this.receiptRepository.createWithItems(receiptInsert, items);
    return this.toResponseDto(receipt);
  }

  async update(id: string, dto: UpdateReceiptDto): Promise<ReceiptResponseDto> {
    const existing = await this.receiptRepository.findById(id);
    if (!existing) {
      throw new Error(`Receipt with id "${id}" not found`);
    }

    const receiptUpdate: ReceiptUpdate = {
      ...(dto.customerName !== undefined && { customer_name: dto.customerName?.trim() || null }),
      ...(dto.customerPhone !== undefined && { customer_phone: dto.customerPhone?.trim() || null }),
      ...(dto.customerEmail !== undefined && { customer_email: dto.customerEmail?.trim() || null }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    await this.receiptRepository.update(id, receiptUpdate);
    const updated = await this.receiptRepository.findById(id);
    return this.toResponseDto(updated!);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.receiptRepository.findById(id);
    if (!existing) {
      throw new Error(`Receipt with id "${id}" not found`);
    }

    await this.receiptRepository.delete(id);
  }

  async getSummary(filter?: ReceiptFilterDto): Promise<ReceiptSummaryDto> {
    const filterOptions = {
      receiptNumber: filter?.receiptNumber,
      customerPhone: filter?.customerPhone,
      customerName: filter?.customerName,
      customerEmail: filter?.customerEmail,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      minAmount: filter?.minAmount,
      maxAmount: filter?.maxAmount
    };

    const totalReceipts = await this.receiptRepository.count(filterOptions);

    const totalRevenue = await this.receiptRepository.getTotalRevenue({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const averageTransactionValue = totalReceipts > 0 ? totalRevenue / totalReceipts : 0;

    return {
      totalReceipts,
      totalRevenue,
      averageTransactionValue
    };
  }

  async exportReceipts(exportDto: ReceiptExportDto): Promise<string> {
    const filterOptions = {
      receiptNumber: exportDto.filters?.receiptNumber,
      customerPhone: exportDto.filters?.customerPhone,
      customerName: exportDto.filters?.customerName,
      customerEmail: exportDto.filters?.customerEmail,
      startDate: exportDto.filters?.startDate,
      endDate: exportDto.filters?.endDate,
      minAmount: exportDto.filters?.minAmount,
      maxAmount: exportDto.filters?.maxAmount,
      sortField: exportDto.filters?.sortField,
      sortOrder: exportDto.filters?.sortOrder
    };

    const receipts = await this.receiptRepository.findAllForExport(filterOptions);

    if (exportDto.format === 'json') {
      return JSON.stringify(receipts.map(r => this.toExportResponseDto(r, exportDto.includeItems)), null, 2);
    }

    return this.toCsv(receipts, exportDto.includeItems);
  }

  private toCsv(receipts: ReceiptWithItems[], includeItems?: boolean): string {
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
        this.escapeCsvField(receipt.receipt_number),
        receipt.transaction_date,
        receipt.transaction_time,
        this.escapeCsvField(receipt.customer_name || ''),
        this.escapeCsvField(receipt.customer_phone || ''),
        this.escapeCsvField(receipt.customer_email || ''),
        receipt.subtotal.toFixed(2),
        receipt.tax_rate.toFixed(2),
        receipt.tax_amount.toFixed(2),
        receipt.grand_total.toFixed(2),
        (receipt.items?.length || 0).toString(),
        this.escapeCsvField(receipt.notes || ''),
        receipt.created_at
      ];

      if (includeItems && receipt.items) {
        const itemsStr = receipt.items
          .map(item => `${item.item_name} (Qty: ${item.quantity}, $${item.total.toFixed(2)})`)
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

  private toExportResponseDto(receipt: ReceiptWithItems, includeItems?: boolean): Record<string, unknown> {
    const base: Record<string, unknown> = {
      receiptNumber: receipt.receipt_number,
      transactionDate: receipt.transaction_date,
      transactionTime: receipt.transaction_time,
      customerName: receipt.customer_name,
      customerPhone: receipt.customer_phone,
      customerEmail: receipt.customer_email,
      subtotal: receipt.subtotal,
      taxRate: receipt.tax_rate,
      taxAmount: receipt.tax_amount,
      grandTotal: receipt.grand_total,
      notes: receipt.notes,
      createdAt: receipt.created_at
    };

    if (includeItems && receipt.items) {
      base.items = receipt.items.map(item => ({
        itemName: item.item_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total
      }));
    }

    return base;
  }

  private toResponseDto(receipt: ReceiptWithItems): ReceiptResponseDto {
    const items: ReceiptItemResponseDto[] = (receipt.items || []).map(item => ({
      id: item.id,
      saleId: item.sale_id,
      itemName: item.item_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.total
    }));

    return {
      id: receipt.id,
      receiptNumber: receipt.receipt_number,
      transactionDate: receipt.transaction_date,
      transactionTime: receipt.transaction_time,
      subtotal: receipt.subtotal,
      taxRate: receipt.tax_rate,
      taxAmount: receipt.tax_amount,
      grandTotal: receipt.grand_total,
      customerName: receipt.customer_name,
      customerPhone: receipt.customer_phone,
      customerEmail: receipt.customer_email,
      notes: receipt.notes,
      items,
      createdAt: receipt.created_at,
      updatedAt: receipt.updated_at
    };
  }
}
