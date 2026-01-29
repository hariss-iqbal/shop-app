import { PhoneCondition } from '../enums';

/**
 * Phone Label DTOs
 * Data Transfer Objects for phone label/price tag generation
 * Feature: F-051 Print Phone Label / Price Tag
 */

export interface PhoneLabelDto {
  id: string;
  brandName: string;
  model: string;
  storageGb: number | null;
  condition: PhoneCondition;
  sellingPrice: number;
  detailUrl: string;
}
