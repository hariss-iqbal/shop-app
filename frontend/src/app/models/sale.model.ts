/**
 * Sale Model
 * Records a completed phone sale
 */
export interface Sale {
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

export interface CreateSaleRequest {
  phoneId: string;
  saleDate: string;
  salePrice: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}

export interface UpdateSaleRequest {
  saleDate?: string;
  salePrice?: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}

export interface SaleListResponse {
  data: Sale[];
  total: number;
}

export interface SaleFilter {
  startDate?: string;
  endDate?: string;
  brandId?: string;
}

export interface SaleSummary {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
}

export interface MarkAsSoldRequest {
  phoneId: string;
  salePrice: number;
  saleDate: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  notes?: string | null;
}
