import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Customer,
  CustomerWithStats,
  CustomerListResponse,
  CustomerFilter,
  CustomerProfile,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  FindOrCreateCustomerRequest,
  FindOrCreateCustomerResponse,
  LinkSalesToCustomerResponse
} from '../../models/customer.model';

/**
 * Customer Service
 * Handles customer contact management operations
 * Feature: F-019 Customer Contact Management
 */
@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private supabase: SupabaseService) { }

  async getCustomers(filter?: CustomerFilter): Promise<CustomerListResponse> {
    const limit = filter?.limit || 25;
    const offset = filter?.page ? (filter.page - 1) * limit : 0;

    let query = this.supabase
      .from('customers')
      .select('*', { count: 'exact' });

    if (filter?.search) {
      query = query.or(`phone.ilike.%${filter.search}%,name.ilike.%${filter.search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Get stats for each customer
    const customersWithStats: CustomerWithStats[] = [];
    for (const customer of data || []) {
      const stats = await this.getCustomerStats(customer.id);
      customersWithStats.push({
        ...this.mapToCustomer(customer),
        ...stats
      });
    }

    return {
      data: customersWithStats,
      total: count || 0
    };
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data ? this.mapToCustomer(data) : null;
  }

  async lookupByPhone(phone: string): Promise<CustomerWithStats | null> {
    const cleanedPhone = phone.replace(/[^\d+]/g, '');

    // Build alternate format for Pakistani numbers: 03xxx <-> +923xxx
    let alternatePhone: string | null = null;
    if (cleanedPhone.startsWith('0')) {
      alternatePhone = '+92' + cleanedPhone.substring(1);
    } else if (cleanedPhone.startsWith('+92')) {
      alternatePhone = '0' + cleanedPhone.substring(3);
    } else if (cleanedPhone.startsWith('92')) {
      alternatePhone = '0' + cleanedPhone.substring(2);
    }

    // Search for both formats using OR
    let query = this.supabase
      .from('customers')
      .select('*');

    if (alternatePhone) {
      const altCleaned = alternatePhone.replace(/[^\d+]/g, '');
      query = query.or(`phone.ilike.%${cleanedPhone}%,phone.ilike.%${altCleaned}%`);
    } else {
      query = query.ilike('phone', `%${cleanedPhone}%`);
    }

    const { data, error } = await query
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    const customer = this.mapToCustomer(data);
    const stats = await this.getCustomerStats(customer.id);

    return {
      ...customer,
      ...stats
    };
  }

  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    const cleanedPhone = request.phone.replace(/[^\d+]/g, '');

    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        phone: cleanedPhone,
        name: request.name.trim(),
        email: request.email?.trim() || null,
        notes: request.notes?.trim() || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A customer with this phone number already exists');
      }
      throw new Error(error.message);
    }

    // Link existing sales to this customer
    await this.linkSalesToCustomer(data.id, cleanedPhone);

    return this.mapToCustomer(data);
  }

  async updateCustomer(id: string, request: UpdateCustomerRequest): Promise<Customer> {
    const updateData: Record<string, unknown> = {};

    if (request.phone !== undefined) {
      updateData['phone'] = request.phone.replace(/[^\d+]/g, '');
    }
    if (request.name !== undefined) {
      updateData['name'] = request.name.trim();
    }
    if (request.email !== undefined) {
      updateData['email'] = request.email?.trim() || null;
    }
    if (request.notes !== undefined) {
      updateData['notes'] = request.notes?.trim() || null;
    }

    const { data, error } = await this.supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A customer with this phone number already exists');
      }
      throw new Error(error.message);
    }

    return this.mapToCustomer(data);
  }

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getCustomerPurchaseHistory(customerId: string): Promise<CustomerProfile> {
    // Get customer
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get sales with product details
    const { data: salesData, error: salesError } = await this.supabase
      .from('sales')
      .select(`
        id,
        product_id,
        sale_date,
        sale_price,
        product:products(
          id,
          model,
          brand:brands(id, name)
        )
      `)
      .eq('customer_id', customerId)
      .order('sale_date', { ascending: false });

    if (salesError) {
      throw new Error(salesError.message);
    }

    const sales = (salesData || []).map(sale => {
      const productData = sale.product as unknown;
      let productName = '';
      let brandName = '';

      if (productData && typeof productData === 'object') {
        const productObj = productData as Record<string, unknown>;
        productName = (productObj['model'] as string) || '';
        const brandData = productObj['brand'];
        if (brandData && typeof brandData === 'object') {
          const brandObj = brandData as Record<string, unknown>;
          brandName = (brandObj['name'] as string) || '';
        }
      }

      return {
        id: sale.id,
        productId: sale.product_id,
        saleDate: sale.sale_date,
        salePrice: sale.sale_price,
        productName,
        brandName
      };
    });

    const totalSpent = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    const lastPurchaseDate = sales.length > 0 ? sales[0].saleDate : null;

    return {
      customer,
      sales,
      stats: {
        totalTransactions: sales.length,
        totalSpent,
        lastPurchaseDate
      }
    };
  }

  async findOrCreate(request: FindOrCreateCustomerRequest): Promise<FindOrCreateCustomerResponse> {
    const { data, error } = await this.supabase.rpc('find_or_create_customer', {
      p_phone: request.phone,
      p_name: request.name || null,
      p_email: request.email || null,
      p_notes: request.notes || null
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      found: data.found,
      customer: data.customer ? {
        id: data.customer.id,
        phone: data.customer.phone,
        name: data.customer.name,
        email: data.customer.email,
        notes: data.customer.notes,
        createdAt: data.customer.createdAt,
        updatedAt: data.customer.updatedAt
      } : null,
      isNew: data.isNew
    };
  }

  async linkSalesToCustomer(customerId: string, phone?: string): Promise<LinkSalesToCustomerResponse> {
    let customerPhone = phone;

    if (!customerPhone) {
      const customer = await this.getCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      customerPhone = customer.phone;
    }

    const { data, error } = await this.supabase.rpc('link_sales_to_customer', {
      p_customer_id: customerId,
      p_phone: customerPhone
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      linkedCount: data || 0,
      customerId
    };
  }

  private async getCustomerStats(customerId: string): Promise<{
    totalTransactions: number;
    totalSpent: number;
    lastPurchaseDate: string | null;
  }> {
    const { data, error } = await this.supabase
      .from('sales')
      .select('sale_price, sale_date')
      .eq('customer_id', customerId);

    if (error) {
      return { totalTransactions: 0, totalSpent: 0, lastPurchaseDate: null };
    }

    const sales = data || [];
    const totalTransactions = sales.length;
    const totalSpent = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
    const sortedSales = [...sales].sort((a, b) =>
      new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    );
    const lastPurchaseDate = sortedSales.length > 0 ? sortedSales[0].sale_date : null;

    return { totalTransactions, totalSpent, lastPurchaseDate };
  }

  private mapToCustomer(data: Record<string, unknown>): Customer {
    return {
      id: data['id'] as string,
      phone: data['phone'] as string,
      name: data['name'] as string,
      email: data['email'] as string | null,
      notes: data['notes'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }
}
