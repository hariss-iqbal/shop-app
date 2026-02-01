import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  SavedReceiptSearch,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
  SavedSearchListResponse,
  ReceiptFilter
} from '../../models/sale.model';

/**
 * Saved Receipt Search Service
 * Handles persistent storage of saved search configurations
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 */
@Injectable({
  providedIn: 'root'
})
export class SavedReceiptSearchService {
  private supabase = inject(SupabaseService);

  async getSavedSearches(): Promise<SavedSearchListResponse> {
    const { data, error, count } = await this.supabase
      .from('saved_receipt_searches')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToSavedSearch),
      total: count || 0
    };
  }

  async getSavedSearchById(id: string): Promise<SavedReceiptSearch | null> {
    const { data, error } = await this.supabase
      .from('saved_receipt_searches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToSavedSearch(data);
  }

  async getDefaultSavedSearch(): Promise<SavedReceiptSearch | null> {
    const { data, error } = await this.supabase
      .from('saved_receipt_searches')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToSavedSearch(data);
  }

  async createSavedSearch(request: CreateSavedSearchRequest): Promise<SavedReceiptSearch> {
    if (request.isDefault) {
      await this.clearDefault();
    }

    const { data, error } = await this.supabase
      .from('saved_receipt_searches')
      .insert({
        name: request.name.trim(),
        filters: request.filters,
        is_default: request.isDefault || false
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToSavedSearch(data);
  }

  async updateSavedSearch(id: string, request: UpdateSavedSearchRequest): Promise<SavedReceiptSearch> {
    if (request.isDefault) {
      await this.clearDefault();
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (request.name !== undefined) {
      updates['name'] = request.name.trim();
    }
    if (request.filters !== undefined) {
      updates['filters'] = request.filters;
    }
    if (request.isDefault !== undefined) {
      updates['is_default'] = request.isDefault;
    }

    const { data, error } = await this.supabase
      .from('saved_receipt_searches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToSavedSearch(data);
  }

  async deleteSavedSearch(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('saved_receipt_searches')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private async clearDefault(): Promise<void> {
    const { error } = await this.supabase
      .from('saved_receipt_searches')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('is_default', true);

    if (error) {
      throw new Error(error.message);
    }
  }

  private mapToSavedSearch(data: Record<string, unknown>): SavedReceiptSearch {
    const filters = data['filters'] as Record<string, unknown> || {};

    const mappedFilters: ReceiptFilter = {
      receiptNumber: filters['receiptNumber'] as string | undefined,
      customerPhone: filters['customerPhone'] as string | undefined,
      customerName: filters['customerName'] as string | undefined,
      customerEmail: filters['customerEmail'] as string | undefined,
      startDate: filters['startDate'] as string | undefined,
      endDate: filters['endDate'] as string | undefined,
      minAmount: filters['minAmount'] as number | undefined,
      maxAmount: filters['maxAmount'] as number | undefined,
      sortField: filters['sortField'] as ReceiptFilter['sortField'],
      sortOrder: filters['sortOrder'] as ReceiptFilter['sortOrder']
    };

    return {
      id: data['id'] as string,
      name: data['name'] as string,
      filters: mappedFilters,
      isDefault: data['is_default'] as boolean,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | undefined
    };
  }
}
