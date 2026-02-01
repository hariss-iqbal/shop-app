/**
 * Loyalty Tier Enum
 * Represents customer loyalty program tiers
 * Feature: F-022 Loyalty Points Integration
 */
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

/**
 * Human-readable labels for loyalty tiers
 */
export const LoyaltyTierLabels: Record<LoyaltyTier, string> = {
  [LoyaltyTier.BRONZE]: 'Bronze',
  [LoyaltyTier.SILVER]: 'Silver',
  [LoyaltyTier.GOLD]: 'Gold',
  [LoyaltyTier.PLATINUM]: 'Platinum'
};

/**
 * Tier colors for UI display (PrimeNG severity)
 */
export const LoyaltyTierColors: Record<LoyaltyTier, string> = {
  [LoyaltyTier.BRONZE]: '#CD7F32',
  [LoyaltyTier.SILVER]: '#C0C0C0',
  [LoyaltyTier.GOLD]: '#FFD700',
  [LoyaltyTier.PLATINUM]: '#E5E4E2'
};

/**
 * Tier severity for PrimeNG Tag component
 */
export const LoyaltyTierSeverity: Record<LoyaltyTier, 'secondary' | 'info' | 'warn' | 'success'> = {
  [LoyaltyTier.BRONZE]: 'secondary',
  [LoyaltyTier.SILVER]: 'info',
  [LoyaltyTier.GOLD]: 'warn',
  [LoyaltyTier.PLATINUM]: 'success'
};

/**
 * Type guard for LoyaltyTier
 */
export function isValidLoyaltyTier(value: string): value is LoyaltyTier {
  return Object.values(LoyaltyTier).includes(value as LoyaltyTier);
}

/**
 * Get tier display name
 */
export function getLoyaltyTierLabel(tier: LoyaltyTier): string {
  return LoyaltyTierLabels[tier] || tier;
}
