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
 * Tier colors for UI display
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
 * Tier icons for UI display
 */
export const LoyaltyTierIcons: Record<LoyaltyTier, string> = {
  [LoyaltyTier.BRONZE]: 'pi pi-circle',
  [LoyaltyTier.SILVER]: 'pi pi-star',
  [LoyaltyTier.GOLD]: 'pi pi-star-fill',
  [LoyaltyTier.PLATINUM]: 'pi pi-crown'
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
export function getLoyaltyTierLabel(tier: LoyaltyTier | string | null): string {
  if (!tier) return '';
  return LoyaltyTierLabels[tier as LoyaltyTier] || tier;
}

/**
 * Get tier severity for PrimeNG components
 */
export function getLoyaltyTierSeverity(tier: LoyaltyTier | string | null): 'secondary' | 'info' | 'warn' | 'success' {
  if (!tier) return 'secondary';
  return LoyaltyTierSeverity[tier as LoyaltyTier] || 'secondary';
}

/**
 * Get tier icon
 */
export function getLoyaltyTierIcon(tier: LoyaltyTier | string | null): string {
  if (!tier) return 'pi pi-circle';
  return LoyaltyTierIcons[tier as LoyaltyTier] || 'pi pi-circle';
}

/**
 * Get tier color
 */
export function getLoyaltyTierColor(tier: LoyaltyTier | string | null): string {
  if (!tier) return '#666666';
  return LoyaltyTierColors[tier as LoyaltyTier] || '#666666';
}
