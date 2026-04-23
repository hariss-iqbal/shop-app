import { ProductCondition } from '../enums';

export interface Variant {
  id: string;
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: ProductCondition;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
  availableColors: string[];
  isActive: boolean;
  primaryImageUrl: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface VariantImage {
  id: string;
  variantId: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  color: string | null;
}

export interface AddStockRequest {
  variantId: string;
  color: string | null;
  costPrice: number;
  quantity: number;
  supplierId?: string | null;
  notes?: string | null;
  purchaseDate?: string | null;
}
