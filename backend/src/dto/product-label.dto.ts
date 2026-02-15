import { ProductCondition } from '../enums';

/**
 * Product Label DTOs
 * Data Transfer Objects for product label/price tag generation
 * Feature: F-051 Print Product Label / Price Tag
 */

export interface ProductLabelDto {
  id: string;
  brandName: string;
  model: string;
  storageGb: number | null;
  condition: ProductCondition;
  sellingPrice: number;
  detailUrl: string;
}
