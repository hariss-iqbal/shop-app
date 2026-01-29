import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  PurchaseOrder,
  PurchaseOrderListResponse,
  PurchaseOrderFilter,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderItem,
  ReceivePurchaseOrderRequest,
  ReceivePurchaseOrderResponse
} from '../../models/purchase-order.model';
import { PurchaseOrderStatus, PhoneStatus } from '../../enums';

export interface PurchaseOrderSummary {
  totalOrders: number;
  pendingOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  pendingAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private supabase = inject(SupabaseService);

  async getPurchaseOrders(filter?: PurchaseOrderFilter): Promise<PurchaseOrderListResponse> {
    let query = this.supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers!inner (id, name),
        purchase_order_items (*)
      `, { count: 'exact' });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.supplierId) {
      query = query.eq('supplier_id', filter.supplierId);
    }

    if (filter?.startDate) {
      query = query.gte('order_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('order_date', filter.endDate);
    }

    query = query.order('order_date', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToPurchaseOrder),
      total: count || 0
    };
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers!inner (id, name),
        purchase_order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToPurchaseOrder(data);
  }

  async getSummary(): Promise<PurchaseOrderSummary> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('status, total_amount');

    if (error) {
      throw new Error(error.message);
    }

    const orders = data || [];
    const pending = orders.filter(o => o.status === PurchaseOrderStatus.PENDING);
    const received = orders.filter(o => o.status === PurchaseOrderStatus.RECEIVED);
    const cancelled = orders.filter(o => o.status === PurchaseOrderStatus.CANCELLED);

    return {
      totalOrders: orders.length,
      pendingOrders: pending.length,
      receivedOrders: received.length,
      cancelledOrders: cancelled.length,
      totalAmount: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      pendingAmount: pending.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    };
  }

  async createPurchaseOrder(request: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const poNumber = await this.getNextPoNumber();
    const totalAmount = request.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    const { data: poData, error: poError } = await this.supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: request.supplierId,
        order_date: request.orderDate,
        total_amount: totalAmount,
        status: PurchaseOrderStatus.PENDING,
        notes: request.notes?.trim() || null
      })
      .select()
      .single();

    if (poError) {
      throw new Error(poError.message);
    }

    const itemsToInsert = request.items.map(item => ({
      purchase_order_id: poData.id,
      brand: item.brand.trim(),
      model: item.model.trim(),
      quantity: item.quantity,
      unit_cost: item.unitCost
    }));

    const { error: itemsError } = await this.supabase
      .from('purchase_order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const result = await this.getPurchaseOrderById(poData.id);
    return result!;
  }

  async updatePurchaseOrder(id: string, request: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const existing = await this.getPurchaseOrderById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Cannot modify a purchase order that is not pending');
    }

    const updateData: Record<string, unknown> = {};

    if (request.supplierId !== undefined) {
      updateData['supplier_id'] = request.supplierId;
    }
    if (request.orderDate !== undefined) {
      updateData['order_date'] = request.orderDate;
    }
    if (request.notes !== undefined) {
      updateData['notes'] = request.notes?.trim() || null;
    }

    const { error } = await this.supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    const result = await this.getPurchaseOrderById(id);
    return result!;
  }

  /**
   * @deprecated Use receiveWithInventory for full receiving workflow
   */
  async markAsReceived(id: string): Promise<PurchaseOrder> {
    const existing = await this.getPurchaseOrderById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be marked as received');
    }

    const { error } = await this.supabase
      .from('purchase_orders')
      .update({ status: PurchaseOrderStatus.RECEIVED })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    const result = await this.getPurchaseOrderById(id);
    return result!;
  }

  /**
   * Receive Purchase Order with Inventory Creation (F-023)
   *
   * This workflow:
   * 1. Validates the PO is pending
   * 2. Resolves brand names to brand IDs (creates brands if they don't exist)
   * 3. Creates individual phone records for each unit with status='available'
   * 4. Sets phone's cost_price from PO item's unit_cost
   * 5. Sets phone's supplier_id from PO's supplier
   * 6. Updates PO status to 'received'
   *
   * @param id - Purchase Order ID
   * @param request - Receiving data with phone records
   * @returns Updated PO and list of created phone IDs
   */
  async receiveWithInventory(id: string, request: ReceivePurchaseOrderRequest): Promise<ReceivePurchaseOrderResponse> {
    const existing = await this.getPurchaseOrderById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be marked as received');
    }

    const expectedPhoneCount = existing.items.reduce((sum, item) => sum + item.quantity, 0);
    if (request.phones.length !== expectedPhoneCount) {
      throw new Error(
        `Expected ${expectedPhoneCount} phone records but received ${request.phones.length}. ` +
        `All items must be received at once.`
      );
    }

    const brandCache = new Map<string, string>();
    const createdPhoneIds: string[] = [];

    for (const phoneRecord of request.phones) {
      const item = existing.items[phoneRecord.lineItemIndex];
      if (!item) {
        throw new Error(`Invalid line item index: ${phoneRecord.lineItemIndex}`);
      }

      let brandId = brandCache.get(phoneRecord.brand.toLowerCase());
      if (!brandId) {
        const { data: brandData, error: brandError } = await this.supabase
          .from('brands')
          .select('id')
          .eq('name', phoneRecord.brand)
          .single();

        if (brandError && brandError.code !== 'PGRST116') {
          throw new Error(brandError.message);
        }

        if (brandData) {
          brandId = brandData.id as string;
        } else {
          const { data: newBrand, error: createBrandError } = await this.supabase
            .from('brands')
            .insert({ name: phoneRecord.brand.trim() })
            .select()
            .single();

          if (createBrandError) {
            throw new Error(createBrandError.message);
          }
          brandId = newBrand.id as string;
        }
        brandCache.set(phoneRecord.brand.toLowerCase(), brandId);
      }

      if (phoneRecord.imei) {
        const { data: existingPhone } = await this.supabase
          .from('phones')
          .select('id')
          .eq('imei', phoneRecord.imei)
          .single();

        if (existingPhone) {
          throw new Error(`Phone with IMEI "${phoneRecord.imei}" already exists`);
        }
      }

      const { data: phoneData, error: phoneError } = await this.supabase
        .from('phones')
        .insert({
          brand_id: brandId,
          model: phoneRecord.model.trim(),
          color: phoneRecord.color?.trim() || null,
          imei: phoneRecord.imei?.trim() || null,
          condition: phoneRecord.condition,
          battery_health: phoneRecord.batteryHealth || null,
          storage_gb: phoneRecord.storageGb || null,
          ram_gb: phoneRecord.ramGb || null,
          cost_price: item.unitCost,
          selling_price: phoneRecord.sellingPrice,
          status: PhoneStatus.AVAILABLE,
          supplier_id: existing.supplierId,
          purchase_date: existing.orderDate,
          notes: phoneRecord.notes?.trim() || null
        })
        .select()
        .single();

      if (phoneError) {
        throw new Error(phoneError.message);
      }

      createdPhoneIds.push(phoneData.id as string);
    }

    const { error: updateError } = await this.supabase
      .from('purchase_orders')
      .update({ status: PurchaseOrderStatus.RECEIVED })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const updatedPo = await this.getPurchaseOrderById(id);

    return {
      purchaseOrder: updatedPo!,
      phonesCreated: createdPhoneIds.length,
      createdPhoneIds
    };
  }

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const existing = await this.getPurchaseOrderById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be cancelled');
    }

    const { error } = await this.supabase
      .from('purchase_orders')
      .update({ status: PurchaseOrderStatus.CANCELLED })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    const result = await this.getPurchaseOrderById(id);
    return result!;
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    const existing = await this.getPurchaseOrderById(id);
    if (!existing) {
      throw new Error(`Purchase order with id "${id}" not found`);
    }

    if (existing.status === PurchaseOrderStatus.RECEIVED) {
      throw new Error('Cannot delete a received purchase order');
    }

    const { error } = await this.supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private async getNextPoNumber(): Promise<string> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('po_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastPo = data[0].po_number;
      const match = lastPo.match(/PO-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PO-${String(nextNumber).padStart(4, '0')}`;
  }

  private mapToPurchaseOrder(data: Record<string, unknown>): PurchaseOrder {
    const supplier = data['suppliers'] as Record<string, unknown> | null;
    const rawItems = data['purchase_order_items'] as Record<string, unknown>[] || [];

    const items: PurchaseOrderItem[] = rawItems.map(item => ({
      id: item['id'] as string,
      purchaseOrderId: item['purchase_order_id'] as string,
      brand: item['brand'] as string,
      model: item['model'] as string,
      quantity: item['quantity'] as number,
      unitCost: item['unit_cost'] as number,
      lineTotal: (item['quantity'] as number) * (item['unit_cost'] as number),
      createdAt: item['created_at'] as string
    }));

    return {
      id: data['id'] as string,
      poNumber: data['po_number'] as string,
      supplierId: data['supplier_id'] as string,
      supplierName: supplier ? (supplier['name'] as string) : '',
      orderDate: data['order_date'] as string,
      totalAmount: data['total_amount'] as number,
      status: data['status'] as PurchaseOrderStatus,
      notes: data['notes'] as string | null,
      items,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }
}
