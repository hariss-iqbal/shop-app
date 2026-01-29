/**
 * Sale DTOs
 * Data Transfer Objects for Sale entity
 */

export interface CreateSaleDto {
  phoneId: string;
  saleDate: string;
  salePrice: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}

export interface UpdateSaleDto {
  saleDate?: string;
  salePrice?: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}

export interface SaleResponseDto {
  id: string;
  phoneId: string;
  brandName: string;
  phoneName: string;
  saleDate: string;
  salePrice: number;
  costPrice: number;
  profit: number;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface SaleListResponseDto {
  data: SaleResponseDto[];
  total: number;
}

export interface SaleFilterDto {
  startDate?: string;
  endDate?: string;
  brandId?: string;
}

export interface SaleSummaryDto {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
}

export interface MarkAsSoldDto {
  phoneId: string;
  salePrice: number;
  saleDate: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}
