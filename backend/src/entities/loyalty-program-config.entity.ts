import { LoyaltyTier } from '../enums';

/**
 * Loyalty Program Configuration Entity
 * Singleton configuration for loyalty points program
 * Database table: loyalty_program_config
 * Owner Module: M-07 Sales
 * Feature: F-022 Loyalty Points Integration
 */
export interface LoyaltyProgramConfig {
  id: string;
  is_enabled: boolean;
  /** Base points earned per dollar spent */
  points_per_dollar: number;
  /** Dollar value per point when redeeming (e.g., 0.01 = $0.01 per point) */
  redemption_rate: number;
  /** Minimum points required for redemption */
  min_points_to_redeem: number;
  /** Maximum percentage of purchase that can be paid with points */
  max_redemption_percent: number;
  /** Points threshold to reach Silver tier */
  silver_threshold: number;
  /** Points threshold to reach Gold tier */
  gold_threshold: number;
  /** Points threshold to reach Platinum tier */
  platinum_threshold: number;
  /** Points multiplier for Bronze tier */
  bronze_multiplier: number;
  /** Points multiplier for Silver tier */
  silver_multiplier: number;
  /** Points multiplier for Gold tier */
  gold_multiplier: number;
  /** Points multiplier for Platinum tier */
  platinum_multiplier: number;
  /** Days until points expire (0 = never expire) */
  points_expiration_days: number;
  created_at: string;
  updated_at: string | null;
}

export interface LoyaltyProgramConfigInsert {
  id?: string;
  is_enabled?: boolean;
  points_per_dollar?: number;
  redemption_rate?: number;
  min_points_to_redeem?: number;
  max_redemption_percent?: number;
  silver_threshold?: number;
  gold_threshold?: number;
  platinum_threshold?: number;
  bronze_multiplier?: number;
  silver_multiplier?: number;
  gold_multiplier?: number;
  platinum_multiplier?: number;
  points_expiration_days?: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface LoyaltyProgramConfigUpdate {
  is_enabled?: boolean;
  points_per_dollar?: number;
  redemption_rate?: number;
  min_points_to_redeem?: number;
  max_redemption_percent?: number;
  silver_threshold?: number;
  gold_threshold?: number;
  platinum_threshold?: number;
  bronze_multiplier?: number;
  silver_multiplier?: number;
  gold_multiplier?: number;
  platinum_multiplier?: number;
  points_expiration_days?: number;
  updated_at?: string | null;
}

/**
 * Response from get_loyalty_config() database function
 */
export interface LoyaltyConfigResponse {
  id: string | null;
  isEnabled: boolean;
  pointsPerDollar: number;
  redemptionRate: number;
  minPointsToRedeem: number;
  maxRedemptionPercent: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
  bronzeMultiplier: number;
  silverMultiplier: number;
  goldMultiplier: number;
  platinumMultiplier: number;
  pointsExpirationDays: number;
  createdAt?: string;
  updatedAt?: string | null;
}
