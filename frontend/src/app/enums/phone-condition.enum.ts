/**
 * Phone condition enumeration - stored in database
 */
export enum PhoneCondition {
  NEW = 'new',
  USED = 'used',
  REFURBISHED = 'refurbished'
}

export const PhoneConditionLabels: Record<PhoneCondition, string> = {
  [PhoneCondition.NEW]: 'New',
  [PhoneCondition.USED]: 'Used',
  [PhoneCondition.REFURBISHED]: 'Refurbished'
};
