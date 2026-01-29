import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Supplier,
  SupplierListResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest
} from '../../models/supplier.model';
import { PurchaseOrder } from '../../models/purchase-order.model';
import { PurchaseOrderStatus } from '../../enums';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private supabase = inject(SupabaseService);

  async getSuppliers(): Promise<SupplierListResponse> {
    const { data, error, count } = await this.supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToSupplier),
      total: count || 0
    };
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToSupplier(data);
  }

  async createSupplier(request: CreateSupplierRequest): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert({
        name: request.name.trim(),
        contact_person: request.contactPerson?.trim() || null,
        contact_email: request.contactEmail?.trim() || null,
        contact_phone: request.contactPhone?.trim() || null,
        address: request.address?.trim() || null,
        notes: request.notes?.trim() || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToSupplier(data);
  }

  async updateSupplier(id: string, request: UpdateSupplierRequest): Promise<Supplier> {
    const updateData: Record<string, unknown> = {};

    if (request.name !== undefined) {
      updateData['name'] = request.name.trim();
    }
    if (request.contactPerson !== undefined) {
      updateData['contact_person'] = request.contactPerson?.trim() || null;
    }
    if (request.contactEmail !== undefined) {
      updateData['contact_email'] = request.contactEmail?.trim() || null;
    }
    if (request.contactPhone !== undefined) {
      updateData['contact_phone'] = request.contactPhone?.trim() || null;
    }
    if (request.address !== undefined) {
      updateData['address'] = request.address?.trim() || null;
    }
    if (request.notes !== undefined) {
      updateData['notes'] = request.notes?.trim() || null;
    }

    const { data, error } = await this.supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToSupplier(data);
  }

  async deleteSupplier(id: string): Promise<void> {
    const hasPOs = await this.hasPurchaseOrders(id);
    if (hasPOs) {
      throw new Error('Cannot delete supplier with existing purchase orders. Please delete or reassign the purchase orders first.');
    }

    const { error } = await this.supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error('Cannot delete supplier with existing purchase orders.');
      }
      throw new Error(error.message);
    }
  }

  async hasPurchaseOrders(supplierId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId);

    if (error) {
      throw new Error(error.message);
    }

    return (count || 0) > 0;
  }

  async getPurchaseOrdersForSupplier(supplierId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (*)
      `)
      .eq('supplier_id', supplierId)
      .order('order_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((po: Record<string, unknown>) => this.mapToPurchaseOrder(po, ''));
  }

  async getPurchaseOrderCountForSupplier(supplierId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }

  private mapToSupplier(data: Record<string, unknown>): Supplier {
    return {
      id: data['id'] as string,
      name: data['name'] as string,
      contactPerson: data['contact_person'] as string | null,
      contactEmail: data['contact_email'] as string | null,
      contactPhone: data['contact_phone'] as string | null,
      address: data['address'] as string | null,
      notes: data['notes'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }

  private mapToPurchaseOrder(data: Record<string, unknown>, supplierName: string): PurchaseOrder {
    const items = (data['purchase_order_items'] as Record<string, unknown>[] || []).map(item => ({
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
      supplierName: supplierName,
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
